const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { logActivity } = require('./logService');

const login = async (email, password) => {
    const userQuery = `
        SELECT u.id, u.employee_id, u.email, u.full_name, u.password_hash, u.role_id, r.name AS role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = $1
    `;
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
        // --- FIX: Pass the details object as the third argument ---
        await logActivity(null, 'USER_LOGIN_FAIL', { reason: 'User not found', emailAttempt: email });
        throw new Error('Invalid credentials.');
    }

    const user = userResult.rows[0];
    if (!user.password_hash) {
        // --- FIX: Pass the details object as the third argument ---
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'Account not fully set up', emailAttempt: email });
        throw new Error('Account credentials are not set up.');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
        // --- FIX: Pass the details object as the third argument ---
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'Incorrect password', emailAttempt: email });
        throw new Error('Invalid credentials.');
    }
    
    if (!user.role_name) {
        // --- FIX: Pass the details object as the third argument ---
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'User has no role assigned' });
        throw new Error('Your account has no role assigned.');
    }

    const permissionsQuery = `SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1`;
    const permissionsResult = await db.query(permissionsQuery, [user.role_id]);
    const permissions = permissionsResult.rows.map(row => row.name);

    if (permissions.length === 0) {
        // --- FIX: Pass the details object as the third argument ---
        await logActivity(user.id, 'USER_LOGIN_FAIL', { reason: 'Role has no permissions' });
        throw new Error('Your assigned role has no permissions.');
    }

    // --- FIX: Pass the details object as the third argument ---
    await logActivity(user.id, 'USER_LOGIN_SUCCESS', { targetUserEmail: user.email });

    const jwtPayload = { 
        id: user.id, 
        employeeId: user.employee_id, 
        email: user.email, 
        name: user.full_name, 
        role: user.role_name, 
        permissions: permissions, 
        jti: uuidv4() 
    };
    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    return { accessToken };
};

const logout = async (token) => {
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti && decoded.exp) {
        const jti = decoded.jti;
        const exp = new Date(decoded.exp * 1000);
        const query = 'INSERT INTO token_denylist (jti, exp) VALUES ($1, $2) ON CONFLICT (jti) DO NOTHING';
        await db.query(query, [jti, exp]);
        await logActivity(decoded.id, 'USER_LOGOUT_SUCCESS');
    }
};

module.exports = {
    login,
    logout,
};