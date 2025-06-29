const userService = require('../../services/userService');

const listUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const actorId = req.user.id; 
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const newUser = await userService.createUser(req.body, actorId, reqContext);
        res.status(201).json(newUser);
    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message });
        }
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { roleId } = req.body;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await userService.updateUserRole(id, roleId, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await userService.deleteUser(id, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        if(error.message.includes('not found')){
            return res.status(404).json({ message: error.message });
        }
        if(error.message.includes('Cannot delete')){
            return res.status(403).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    listUsers,
    createUser,
    updateUserRole,
    deleteUser,
};