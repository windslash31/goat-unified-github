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
        if (error.message.includes('not permitted')) {
            return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
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

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new passwords are required.' });
        }

        const result = await userService.changePassword(userId, oldPassword, newPassword, reqContext);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { id: targetUserId } = req.params;
        const actorId = req.user.id;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };

        if (parseInt(targetUserId, 10) === actorId) {
            return res.status(403).json({ message: "You cannot reset your own password from this panel." });
        }

        const result = await userService.resetPassword(targetUserId, actorId, reqContext);
        res.status(200).json(result);
    } catch (error) {
        if (error.message.includes('not permitted') || error.message.includes('super admin')) {
            return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const generateApiKey = async (req, res, next) => {
    try {
        const { id: targetUserId } = req.params;
        const { description, expiresInDays } = req.body;
        const actorId = req.user.id;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };

        if (!description) {
            return res.status(400).json({ message: 'A description for the API key is required.' });
        }

        const result = await userService.generateApiKey(targetUserId, description, expiresInDays, actorId, reqContext);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const listApiKeys = async (req, res, next) => {
    try {
        const { id: targetUserId } = req.params;
        const keys = await userService.listApiKeysForUser(targetUserId);
        res.json(keys);
    } catch (error) {
        next(error);
    }
};

const deleteApiKey = async (req, res, next) => {
    try {
        const { keyId } = req.params;
        const actorId = req.user.id;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        
        await userService.deleteApiKey(keyId, actorId, reqContext);
        res.status(204).send();
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};


module.exports = {
    listUsers,
    createUser,
    updateUserRole,
    deleteUser,
    changePassword,
    resetPassword,
    generateApiKey,
    listApiKeys,
    deleteApiKey,
};