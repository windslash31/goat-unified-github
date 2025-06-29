const db = require('../config/db');
const sanitizeHtml = require('sanitize-html');

const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    const sanitizedObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitizedObj[key] = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
            } else {
                sanitizedObj[key] = sanitizeObject(value);
            }
        }
    }
    return sanitizedObj;
};

const logActivity = async (actorUserId, actionType, details = {}, reqContext = {}, client = db) => {
    try {
        let actorEmail = null;
        let actorFullName = null;

        if (actorUserId) {
            const actorResult = await client.query('SELECT email, full_name FROM users WHERE id = $1', [actorUserId]);
            if (actorResult.rows.length > 0) {
                actorEmail = actorResult.rows[0].email;
                actorFullName = actorResult.rows[0].full_name;
            }
        }
        
        const sanitizedDetails = sanitizeObject(details);
        const targetEmployeeId = details.targetEmployeeId || null;
        const targetUserEmail = details.targetUserEmail || null;

        const finalDetails = {
            ...sanitizedDetails,
            context: {
                ipAddress: reqContext.ip,
                userAgent: reqContext.userAgent,
            }
        };

        const logQuery = `
            INSERT INTO activity_logs 
            (actor_user_id, actor_email, actor_full_name, action_type, target_employee_id, target_user_email, details) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(logQuery, [actorUserId, actorEmail, actorFullName, actionType, targetEmployeeId, targetUserEmail, JSON.stringify(finalDetails)]);

    } catch (err) {
        console.error('Failed to log activity:', err);
        throw err;
    }
};

const getActivityLogs = async (limit = 100) => {
    const logsQuery = `
        SELECT 
            al.id, al.timestamp, al.action_type, al.details, 
            al.actor_email,
            al.target_user_email,
            e.employee_email as target_employee_email
        FROM activity_logs al 
        LEFT JOIN employees e ON al.target_employee_id = e.id 
        ORDER BY al.timestamp DESC 
        LIMIT $1
    `;
    const result = await db.query(logsQuery, [limit]);
    return result.rows;
};

module.exports = {
    logActivity,
    getActivityLogs,
};