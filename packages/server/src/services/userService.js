const crypto = require('crypto');
const db = require('../config/db');
const { logActivity } = require('./logService');
const bcrypt = require('bcrypt');
const { validatePassword } = require('../utils/passwordValidator');

const getUsers = async () => {
    const usersQuery = `
        SELECT u.id, u.email, u.full_name, r.id as role_id, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        ORDER BY u.full_name
    `;
    const result = await db.query(usersQuery);
    return result.rows;
};

const createUser = async (userData, actorId, reqContext) => {
    const { email, fullName, roleId } = userData;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            throw new Error('A user with this email already exists.');
        }

        const employeeResult = await client.query('SELECT id FROM employees WHERE employee_email = $1', [email]);
        const employeeId = employeeResult.rows.length > 0 ? employeeResult.rows[0].id : null;

        const temporaryPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);

        const result = await client.query(
            'INSERT INTO users (full_name, email, password_hash, role_id, employee_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role_id',
            [fullName, email, passwordHash, roleId, employeeId]
        );
        const newUser = result.rows[0];
        
        await logActivity(
            actorId,
            'USER_CREATE', 
            { targetUserEmail: newUser.email, createdUser: { fullName, email, roleId } }, 
            reqContext,
            client
        );
        
        await client.query('COMMIT');
        newUser.temporaryPassword = temporaryPassword;
        return newUser;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};


const updateUserRole = async (userId, newRoleId, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const newRoleResult = await client.query(`SELECT name FROM roles WHERE id = $1`, [newRoleId]);
        if (newRoleResult.rows.length === 0) {
            throw new Error('Role not found.');
        }
        const newRoleName = newRoleResult.rows[0].name;

        if (newRoleName === 'admin') {
            throw new Error('Assigning the super admin role is not permitted.');
        }

        const userResult = await client.query('SELECT u.email, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1', [userId]);
        if(userResult.rows.length === 0) throw new Error('User not found');
        const oldRoleName = userResult.rows[0]?.role_name || 'none';
        
        await client.query('UPDATE users SET role_id = $1 WHERE id = $2', [newRoleId, userId]);
        
        await logActivity(
            actorId, 
            'USER_ROLE_UPDATE', 
            { changes: { role: { from: oldRoleName, to: newRoleName } }, targetUserEmail: userResult.rows[0]?.email }, 
            reqContext,
            client
        );
        
        await client.query('COMMIT');
        return { message: `Role updated for user` };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const deleteUser = async (userId, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const userToDeleteResult = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userToDeleteResult.rows.length === 0) throw new Error('User not found.');
        
        const deletedUserEmail = userToDeleteResult.rows[0].email;

        if (parseInt(userId, 10) === actorId) {
            throw new Error('Cannot delete your own user account.');
        }
        
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        
        await logActivity(
            actorId, 
            'USER_DELETE', 
            { targetUserEmail: deletedUserEmail, details: `Deleted user ${deletedUserEmail}` }, 
            reqContext,
            client
        );
        
        await client.query('COMMIT');
        return { message: 'User deleted successfully.' };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const changePassword = async (userId, oldPassword, newPassword, reqContext) => {
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new Error('User not found.');

    const user = userResult.rows[0];
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordCorrect) throw new Error('Incorrect old password.');
    
    const complexityCheck = validatePassword(newPassword);
    if (!complexityCheck.valid) throw new Error(complexityCheck.issues.join(', '));

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    await logActivity(userId, 'USER_PASSWORD_CHANGE_SUCCESS', {}, reqContext);

    return { message: 'Password changed successfully.' };
};

const resetPassword = async (targetUserId, actorId, reqContext) => {
    const targetUserResult = await db.query('SELECT r.name as role_name, u.email FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1', [targetUserId]);
    if (targetUserResult.rows.length === 0) throw new Error('Target user not found.');

    if (targetUserResult.rows[0].role_name === 'admin') {
        throw new Error('Cannot reset the password of a super admin.');
    }

    const temporaryPassword = Math.random().toString(36).slice(-10);
    const newPasswordHash = await bcrypt.hash(temporaryPassword, 10);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, targetUserId]);

    await logActivity(actorId, 'ADMIN_PASSWORD_RESET', { targetUserEmail: targetUserResult.rows[0].email }, reqContext);
    
    return { temporaryPassword };
};

const generateApiKey = async (userId, description, expiresInDays, actorId, reqContext) => {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(apiKey, 10);

    let expiresAt = null;
    const days = parseInt(expiresInDays, 10);
    if (days > 0 && days <= 365) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else if (days > 365) {
        throw new Error('Expiration cannot be more than 365 days.');
    }

    const result = await db.query(
        'INSERT INTO api_keys (user_id, key_hash, description, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, description, created_at, expires_at',
        [userId, keyHash, description, expiresAt]
    );

    await logActivity(actorId, 'API_KEY_CREATE', { targetUserId: userId, keyId: result.rows[0].id, expires: expiresAt }, reqContext);

    return { newKey: apiKey, details: result.rows[0] };
};

const listApiKeysForUser = async (userId) => {
    const result = await db.query(
        'SELECT id, description, created_at, expires_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
};

const deleteApiKey = async (keyId, actorId, reqContext) => {
    const keyResult = await db.query('SELECT user_id FROM api_keys WHERE id = $1', [keyId]);
    if (keyResult.rows.length === 0) {
        throw new Error('API Key not found.');
    }
    const targetUserId = keyResult.rows[0].user_id;
    
    await db.query('DELETE FROM api_keys WHERE id = $1', [keyId]);
    await logActivity(actorId, 'API_KEY_DELETE', { targetUserId, keyId: keyId }, reqContext);

    return { message: 'API Key revoked successfully.' };
};

module.exports = {
    getUsers,
    createUser,
    updateUserRole,
    deleteUser,
    changePassword,
    resetPassword,
    generateApiKey,
    listApiKeysForUser,
    deleteApiKey,
};