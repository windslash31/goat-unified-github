const db = require('../config/db');
const { logActivity } = require('./logService');
const bcrypt = require('bcrypt');

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
        
        // Step 1: Get the name of the new role being assigned
        const newRoleResult = await client.query(`SELECT name FROM roles WHERE id = $1`, [newRoleId]);
        if (newRoleResult.rows.length === 0) {
            throw new Error('Role not found.');
        }
        const newRoleName = newRoleResult.rows[0].name;

        // --- NEW SECURITY CHECK ---
        // Step 2: Prevent anyone from assigning the "admin" role.
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

module.exports = {
    getUsers,
    createUser,
    updateUserRole,
    deleteUser,
};