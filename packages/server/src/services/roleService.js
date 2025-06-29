const db = require('../config/db'); // Corrected path
const { logActivity } = require('./logService');

const getRolesWithPermissions = async () => {
    const rolesResult = await db.query('SELECT * FROM roles ORDER BY name');
    const roles = rolesResult.rows;
    const rolesWithPermissions = await Promise.all(roles.map(async (role) => {
        const permissionsResult = await db.query('SELECT p.id, p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1', [role.id]);
        return { ...role, permissions: permissionsResult.rows };
    }));
    return rolesWithPermissions;
};

const getSimpleRoles = async () => {
    const result = await db.query('SELECT id, name FROM roles ORDER BY name');
    return result.rows;
};

const getAllPermissions = async () => {
    const result = await db.query('SELECT * FROM permissions ORDER BY name');
    return result.rows;
};

const createRole = async (name, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [name]);
        await logActivity(actorId, 'ROLE_CREATE', { roleName: name }, reqContext, client);
        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const updateRolePermissions = async (roleId, permissionIds, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const roleResult = await client.query('SELECT name FROM roles WHERE id = $1', [roleId]);
        const roleName = roleResult.rows[0]?.name;
        if (!roleName) throw new Error('Role not found.');

        const oldPermsResult = await client.query('SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1', [roleId]);
        const oldPermissions = oldPermsResult.rows.map(r => r.name);
        
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        
        let newPermissions = [];
        if (permissionIds && permissionIds.length > 0) {
            const newPermsResult = await client.query(`SELECT name FROM permissions WHERE id = ANY($1::int[])`, [permissionIds]);
            newPermissions = newPermsResult.rows.map(r => r.name);
            const insertQuery = 'INSERT INTO role_permissions (role_id, permission_id) SELECT $1, unnest($2::int[])';
            await client.query(insertQuery, [roleId, permissionIds]);
        }
        
        const added = newPermissions.filter(p => !oldPermissions.includes(p));
        const removed = oldPermissions.filter(p => !newPermissions.includes(p));
        
        if (added.length > 0 || removed.length > 0) {
            await logActivity(actorId, 'ROLE_PERMISSIONS_UPDATE', { roleName: roleName, changes: { added, removed } }, reqContext, client);
        }
        
        await client.query('COMMIT');
        return { message: 'Role permissions updated successfully.' };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const deleteRole = async (roleId, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const roleCheckResult = await client.query('SELECT name FROM roles WHERE id = $1', [roleId]);
        if (roleCheckResult.rows.length === 0) throw new Error('Role not found.');

        const roleName = roleCheckResult.rows[0].name;
        if (['admin', 'auditor', 'viewer'].includes(roleName)) {
            throw new Error(`Cannot delete core system role: ${roleName}.`);
        }

        const userCheckResult = await client.query('SELECT COUNT(*) as user_count FROM users WHERE role_id = $1', [roleId]);
        if (parseInt(userCheckResult.rows[0].user_count, 10) > 0) {
            throw new Error(`Cannot delete role. It is currently assigned to users.`);
        }
        
        await client.query('DELETE FROM roles WHERE id = $1', [roleId]);
        await logActivity(actorId, 'ROLE_DELETE', { roleName: roleName }, reqContext, client);
        
        await client.query('COMMIT');
        return { message: 'Role deleted successfully' };
    } catch(err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    getRolesWithPermissions,
    getAllPermissions,
    createRole,
    updateRolePermissions,
    deleteRole,
    getSimpleRoles
};