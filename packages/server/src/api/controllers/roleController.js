const roleService = require('../../services/roleService');

const listRolesAndPermissions = async (req, res, next) => {
    try {
        const roles = await roleService.getRolesWithPermissions();
        res.json(roles);
    } catch (error) {
        next(error);
    }
};

const listAllPermissions = async (req, res, next) => {
    try {
        const permissions = await roleService.getAllPermissions();
        res.json(permissions);
    } catch (error) {
        next(error);
    }
};

const listSimpleRoles = async (req, res, next) => {
    try {
        const roles = await roleService.getSimpleRoles();
        res.json(roles);
    } catch (error) {
        next(error);
    }
};

const createRole = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Role name is required.' });
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const newRole = await roleService.createRole(name, req.user.id, reqContext);
        res.status(201).json(newRole);
    } catch (error) {
        next(error);
    }
};

const updateRolePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissionIds } = req.body;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await roleService.updateRolePermissions(id, permissionIds, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await roleService.deleteRole(id, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        if(error.message.includes('Cannot delete')){
            return res.status(409).json({ message: error.message });
        }
        if(error.message.includes('not found')){
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    listRolesAndPermissions,
    listAllPermissions,
    createRole,
    updateRolePermissions,
    deleteRole,
    listSimpleRoles,
};