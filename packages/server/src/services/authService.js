const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { logActivity } = require('./logService');

const login = async (email, password, reqContext) => {
    const userQuery = `
        SELECT u.id, u.employee_id, u.email, u.full_name, u.password_hash, u.role_id, r.name AS role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = $1
    `;
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
        await logActivity(null, 'USER_LOGIN_FAIL', { reason: 'User not found', emailAttempt: email }, reqContext);
        throw new Error('Invalid credentials.');
    }

    const user = userResult.rows[0];
    if (!user.password_hash) {
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'Account not fully set up', emailAttempt: email }, reqContext);
        throw new Error('Account credentials are not set up.');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'Incorrect password', emailAttempt: email }, reqContext);
        throw new Error('Invalid credentials.');
    }
    
    if (!user.role_name) {
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'User has no role assigned' }, reqContext);
        throw new Error('Your account has no role assigned.');
    }

    const permissionsQuery = `SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1`;
    const permissionsResult = await db.query(permissionsQuery, [user.role_id]);
    const permissions = permissionsResult.rows.map(row => row.name);

    if (permissions.length === 0) {
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'Role has no permissions' }, reqContext);
        throw new Error('Your assigned role has no permissions.');
    }

    await logActivity(user.id, 'USER_LOGIN_SUCCESS', { targetUserEmail: user.email }, reqContext);

    const jwtPayload = { 
        id: user.id, 
        employeeId: user.employee_id, 
        email: user.email, 
        name: user.full_name, 
        role: user.role_name, 
        permissions: permissions
    };
    
    // Create short-lived access token
    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '15m', jwtid: uuidv4() });
    
    // Create long-lived refresh token with a unique ID
    const refreshToken = jwt.sign({ id: user.id, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    
    // --- FIX: Clean up old tokens before inserting a new one ---
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
    
    // Store the new refresh token in the database
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, sevenDaysFromNow]
    );
    
    return { accessToken, refreshToken };
};

const refreshAccessToken = async (token) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Verify the refresh token
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const userId = decoded.id;

        // Check if the token exists in our database
        const tokenResult = await client.query('SELECT 1 FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()', [token, userId]);
        if (tokenResult.rows.length === 0) {
            throw new Error('Invalid or expired refresh token.');
        }

        // Token is valid, issue a new access token
        const userQuery = `
            SELECT u.id, u.employee_id, u.email, u.full_name, r.name AS role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1
        `;
        const userResult = await client.query(userQuery, [userId]);
        if (userResult.rows.length === 0) {
            throw new Error('User not found.');
        }
        const user = userResult.rows[0];

        const permissionsQuery = `SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1`;
        const permissionsResult = await client.query(permissionsQuery, [user.role_id]);
        const permissions = permissionsResult.rows.map(row => row.name);

        const jwtPayload = { 
            id: user.id, 
            employeeId: user.employee_id, 
            email: user.email, 
            name: user.full_name, 
            role: user.role_name, 
            permissions: permissions, 
            jti: uuidv4() 
        };
        const newAccessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        await client.query('COMMIT');
        return { accessToken: newAccessToken };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Refresh token error:", error);
        throw new Error('Token refresh failed.');
    } finally {
        client.release();
    }
};

const logout = async (token, reqContext) => {
    // Invalidate the JWT access token by adding its JTI to the denylist
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti && decoded.exp) {
        const jti = decoded.jti;
        const exp = new Date(decoded.exp * 1000);
        await db.query('INSERT INTO token_denylist (jti, exp) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING', [jti, exp]);
    }
    
    // Invalidate the refresh token by deleting it from the database
    const { refreshToken } = reqContext; // Assuming refreshToken is passed in the request body
    if(refreshToken) {
        await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    if(decoded) {
        await logActivity(decoded.id, 'USER_LOGOUT_SUCCESS', {}, reqContext);
    }
};

module.exports = {
    login,
    logout,
    refreshAccessToken,
};