const db = require("../config/db");
const sanitizeHtml = require("sanitize-html");

const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));
  const sanitizedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string") {
        sanitizedObj[key] = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
      } else {
        sanitizedObj[key] = sanitizeObject(value);
      }
    }
  }
  return sanitizedObj;
};

const logActivity = async (
  actorUserId,
  actionType,
  details = {},
  reqContext = {},
  client = db
) => {
  try {
    let actorEmail = null;
    let actorFullName = null;

    if (actorUserId) {
      const actorResult = await client.query(
        "SELECT email, full_name FROM users WHERE id = $1",
        [actorUserId]
      );
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
      },
    };

    const logQuery = `
            INSERT INTO activity_logs 
            (actor_user_id, actor_email, actor_full_name, action_type, target_employee_id, target_user_email, details) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

    await client.query(logQuery, [
      actorUserId,
      actorEmail,
      actorFullName,
      actionType,
      targetEmployeeId,
      targetUserEmail,
      JSON.stringify(finalDetails),
    ]);
  } catch (err) {
    console.error("Failed to log activity:", err);
    throw err;
  }
};

const getActivityLogs = async (filters = {}) => {
  const { limit = 100, actionType, actorEmail, startDate, endDate } = filters;

  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (actionType) {
    whereClauses.push(`al.action_type = $${paramIndex++}`);
    queryParams.push(actionType);
  }
  if (actorEmail) {
    whereClauses.push(`al.actor_email = $${paramIndex++}`);
    queryParams.push(actorEmail);
  }
  // --- MODIFICATION START: Add date range filtering ---
  if (startDate) {
    whereClauses.push(`al.timestamp >= $${paramIndex++}`);
    queryParams.push(startDate);
  }
  if (endDate) {
    const inclusiveEndDate = new Date(endDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
    whereClauses.push(`al.timestamp < $${paramIndex++}`);
    queryParams.push(inclusiveEndDate.toISOString().split("T")[0]);
  }
  // --- MODIFICATION END ---

  const whereCondition =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const logsQuery = `
        SELECT 
            al.id, al.timestamp, al.action_type, al.details, 
            al.actor_email,
            al.target_user_email,
            e.employee_email as target_employee_email
        FROM activity_logs al 
        LEFT JOIN employees e ON al.target_employee_id = e.id 
        ${whereCondition}
        ORDER BY al.timestamp DESC 
        LIMIT $${paramIndex}
    `;
  queryParams.push(limit);

  const result = await db.query(logsQuery, queryParams);
  return result.rows;
};

const getActivityLogFilterOptions = async () => {
  // This function remains unchanged
  const actionsQuery = db.query(
    "SELECT DISTINCT action_type FROM activity_logs ORDER BY action_type"
  );
  const actorsQuery = db.query(
    "SELECT DISTINCT actor_email FROM activity_logs WHERE actor_email IS NOT NULL ORDER BY actor_email"
  );

  const [actionsResult, actorsResult] = await Promise.all([
    actionsQuery,
    actorsQuery,
  ]);

  return {
    actionTypes: actionsResult.rows.map((r) => r.action_type),
    actors: actorsResult.rows.map((r) => r.actor_email),
  };
};

module.exports = {
  logActivity,
  getActivityLogs,
  getActivityLogFilterOptions,
};
