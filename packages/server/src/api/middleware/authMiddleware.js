const jwt = require('jsonwebtoken');
const db = require('../../config/db');

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
    authorize,
    authorizeAdminOrSelf,
    authorizeAdminOrSelfForLogs,
};