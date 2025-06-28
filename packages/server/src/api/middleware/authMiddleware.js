const jwt = require('jsonwebtoken');
const db = require('../../config/db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'No token provided.' });

    try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.jti) {
            const result = await db.query('SELECT EXISTS(SELECT 1 FROM token_denylist WHERE jti = $1)', [decoded.jti]);
            if (result.rows[0].exists) {
                return res.status(401).json({ message: 'Token has been invalidated.' });
            }
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token is not valid.' });
            }
            req.user = user;
            next();
        });
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).send('Server error during authentication.');
    }
};

const authorize = (requiredPermission) => {
    return (req, res, next) => {
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