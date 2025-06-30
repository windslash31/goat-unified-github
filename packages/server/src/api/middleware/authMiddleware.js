const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const bcrypt = require('bcrypt');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const decodedForJti = jwt.decode(token);
        if (decodedForJti && decodedForJti.jti) {
            const result = await db.query('SELECT EXISTS(SELECT 1 FROM token_denylist WHERE jti = $1)', [decodedForJti.jti]);
            if (result.rows[0].exists) {
                return res.status(401).json({ message: 'Token has been invalidated.' });
            }
        }
        
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // Attach user payload to the request
        next(); // Proceed to the next middleware

    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ message: 'Token is not valid.' });
        }
        console.error('Authentication error:', err);
        return res.status(500).send('Server error during authentication.');
    }
};

const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ message: 'API Key is missing.' });
    }

    try {
        const result = await db.query('SELECT key_hash, user_id, expires_at FROM api_keys');
        const allKeys = result.rows;

        let matchedKey = null;
        for (const key of allKeys) {
            const isMatch = await bcrypt.compare(apiKey, key.key_hash);
            if (isMatch) {
                matchedKey = key;
                break;
            }
        }

        if (!matchedKey) {
            return res.status(401).json({ message: 'Invalid API Key.' });
        }

        // --- ADDED: CHECK FOR EXPIRATION ---
        if (matchedKey.expires_at && new Date() > new Date(matchedKey.expires_at)) {
            return res.status(401).json({ message: 'API Key has expired.' });
        }

        const userQuery = `
            SELECT u.*, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `;
        const userResult = await db.query(userQuery, [matchedKey.user_id]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'API Key is valid, but the associated user was not found.' });
        }

        const user = userResult.rows[0];
        const permsResult = await db.query('SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = $1', [user.role_id]);
        
        req.user = {
            id: user.id,
            employeeId: user.employee_id,
            email: user.email,
            name: user.full_name,
            role: user.role_name,
            permissions: permsResult.rows.map(p => p.name)
        };

        next();
    } catch (err) {
        console.error('API Key Authentication error:', err);
        return res.status(500).send('Server error during authentication.');
    }
};


const authorize = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication failed, user not found.' });
        }
        const userPermissions = req.user.permissions || [];
        if (userPermissions.includes(requiredPermission)) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: You do not have the required permission.' });
        }
    };
};

const authorizeAdminOrSelf = (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const requestedEmployeeId = parseInt(req.params.id || req.params.employeeId, 10);
    const userEmployeeId = req.user.employeeId;

    if (userPermissions.includes('employee:read:all') || requestedEmployeeId === userEmployeeId) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: You do not have permission to view this resource.' });
    }
};

const authorizeAdminOrSelfForLogs = (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const requestedEmployeeId = parseInt(req.params.id || req.params.employeeId, 10);
    const userEmployeeId = req.user.employeeId;

    if (userPermissions.includes('log:read:platform') || requestedEmployeeId === userEmployeeId) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: You do not have permission to view platform logs.' });
    }
};


module.exports = {
    authenticateToken,
    authenticateApiKey,
    authorize,
    authorizeAdminOrSelf,
    authorizeAdminOrSelfForLogs,
};