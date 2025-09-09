const db = require("../config/db");

const getDashboardStats = async () => {
  const statsQuery = `
        SELECT
            (SELECT COUNT(*) FROM employees) as total_employees,
            (SELECT COUNT(*) FROM employees WHERE get_employee_status(is_active, access_cut_off_date_at_date) = 'Active') as active_employees,
            (SELECT COUNT(*) FROM employees WHERE get_employee_status(is_active, access_cut_off_date_at_date) = 'For Escalation') as for_escalation_employees,
            (SELECT COUNT(*) FROM employees WHERE get_employee_status(is_active, access_cut_off_date_at_date) = 'Inactive') as inactive_employees,
            (SELECT COUNT(*) FROM users) as total_users
        FROM employees
        LIMIT 1;
    `;
  try {
    console.log("Attempting to query dashboard stats...");
    const result = await db.query(statsQuery);
    console.log("Dashboard stats query successful.");
    return result.rows[0];
  } catch (error) {
    console.error("Error during getDashboardStats DB query:", error);
    throw error;
  }
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

const getLicenseStats = async () => {
  return [
    { name: "Google Workspace", used: 150, total: 200 },
    { name: "Atlassian", used: 120, total: 150 },
    { name: "Slack", used: 180, total: 200 },
  ];
};

const getEmployeeDistribution = async () => {
  const query = `
        SELECT ol.name, COUNT(e.id) as count
        FROM employees e
        JOIN office_locations ol ON e.office_location_id = ol.id
        WHERE e.is_active = TRUE
        GROUP BY ol.name
        ORDER BY count DESC;
    `;
  const result = await db.query(query);
  return result.rows;
};

const getLicenseInventory = async () => {
  const query = `
    SELECT
        ma.name as application_name,
        l.tier_name,
        l.is_unlimited,
        l.total_seats,
        COUNT(la.id)::int as assigned_seats
    FROM managed_applications ma
    JOIN licenses l ON ma.id = l.application_id
    LEFT JOIN license_assignments la ON l.id = la.license_id
    WHERE ma.is_licensable = TRUE
    GROUP BY ma.id, ma.name, l.id, l.tier_name, l.total_seats, l.is_unlimited
    ORDER BY ma.name, l.tier_name;
  `;
  const result = await db.query(query);
  return result.rows;
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getRecentTickets,
  getLicenseStats,
  getEmployeeDistribution,
  getLicenseInventory,
};
