const db = require('../config/db');

const getDashboardStats = async () => {
    const statsQuery = `
        SELECT
            COUNT(*) as total_employees,
            SUM(CASE WHEN get_employee_status(is_active, access_cut_off_date_at_date) = 'Active' THEN 1 ELSE 0 END) as active_employees,
            SUM(CASE WHEN get_employee_status(is_active, access_cut_off_date_at_date) = 'For Escalation' THEN 1 ELSE 0 END) as for_escalation_employees,
            SUM(CASE WHEN get_employee_status(is_active, access_cut_off_date_at_date) = 'Inactive' THEN 1 ELSE 0 END) as inactive_employees,
            (SELECT COUNT(*) FROM activity_logs WHERE timestamp > NOW() - INTERVAL '7 days') as recent_activities
        FROM employees;
    `;
    const result = await db.query(statsQuery);
    return result.rows[0];
};

const getRecentActivity = async () => {
    const query = `
        SELECT
            al.id,
            al.action_type,
            al.actor_email,
            e.employee_email as target_employee_email,
            al.timestamp
        FROM
            activity_logs al
        LEFT JOIN
            employees e ON al.target_employee_id = e.id
        ORDER BY
            al.timestamp DESC
        LIMIT 5;
    `;
    const result = await db.query(query);
    return result.rows;
};

const getRecentTickets = async () => {
    const query = `
        SELECT id, first_name, last_name, ticket_id, ticket_type FROM (
            (SELECT id, first_name, last_name, onboarding_ticket as ticket_id, 'Onboarding' as ticket_type, created_at as sort_date FROM employees WHERE onboarding_ticket IS NOT NULL)
            UNION ALL
            (SELECT id, first_name, last_name, offboarding_ticket as ticket_id, 'Offboarding' as ticket_type, date_of_exit_at_date as sort_date FROM employees WHERE offboarding_ticket IS NOT NULL)
        ) as all_tickets
        WHERE sort_date IS NOT NULL
        ORDER BY sort_date DESC
        LIMIT 5;
    `;
    const result = await db.query(query);
    return result.rows;
};

module.exports = {
    getDashboardStats,
    getRecentActivity,
    getRecentTickets
};