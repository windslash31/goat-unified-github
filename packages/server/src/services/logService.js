const db = require("../config/db");
const sanitizeHtml = require("sanitize-html");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Parser } = require("json2csv");

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

const getAdminActivityData = async () => {
  const query = `
    SELECT
        al.timestamp,
        al.actor_email,
        al.action_type,
        al.target_user_email,
        e.employee_email as target_employee_email,
        al.details ->> 'roleName' as role_name,
        al.details -> 'changes' as changes
    FROM
        activity_logs al
    JOIN users u ON al.actor_user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON al.target_employee_id = e.id
    WHERE r.name = 'admin' 
    AND al.action_type IN (
        'USER_CREATE', 'USER_DELETE', 'USER_ROLE_UPDATE', 
        'ROLE_CREATE', 'ROLE_DELETE', 'ROLE_PERMISSIONS_UPDATE',
        'ADMIN_PASSWORD_RESET'
    )
    ORDER BY al.timestamp DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

const generateAdminActivityPdf = (data, stream) => {
  const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });
  doc.pipe(stream);

  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Administrator Activity Report", { align: "center" });
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Generated on: ${new Date().toLocaleDateString("en-US", {
        timeZone: "Asia/Jakarta",
      })}`,
      { align: "center" }
    );
  doc.moveDown(2);

  const tableTop = doc.y;
  const dateX = 50;
  const actorX = 150;
  const actionX = 280;
  const targetX = 450;
  const detailsX = 600;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Date", dateX, tableTop)
    .text("Admin User", actorX, tableTop)
    .text("Action", actionX, tableTop)
    .text("Target", targetX, tableTop)
    .text("Details", detailsX, tableTop);

  doc
    .moveTo(dateX - 10, doc.y + 5)
    .lineTo(750, doc.y + 5)
    .stroke();
  doc.moveDown();

  doc.font("Helvetica").fontSize(9);

  data.forEach((row) => {
    const rowY = doc.y;
    const target =
      row.target_user_email ||
      row.target_employee_email ||
      row.role_name ||
      "N/A";
    const details =
      row.action_type === "ROLE_PERMISSIONS_UPDATE"
        ? `Added: ${row.changes?.added?.length || 0}, Removed: ${
            row.changes?.removed?.length || 0
          }`
        : `Role: ${row.changes?.role?.from} -> ${row.changes?.role?.to}`;

    doc.text(
      new Date(row.timestamp).toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
      }),
      dateX,
      rowY,
      { width: 90 }
    );
    doc.text(row.actor_email, actorX, rowY, { width: 120 });
    doc.text(row.action_type.replace(/_/g, " "), actionX, rowY, { width: 160 });
    doc.text(target, targetX, rowY, { width: 140 });
    doc.text(details, detailsX, rowY, { width: 150 });

    doc.y = rowY + 35;
    if (doc.y > 500) {
      doc.addPage();
      doc.y = tableTop;
    }
  });

  doc.end();
};

const generateAdminActivityExcel = async (data, stream) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "G.O.A.T Platform";
  const worksheet = workbook.addWorksheet("Admin Activity");

  worksheet.columns = [
    { header: "Timestamp", key: "timestamp", width: 25 },
    { header: "Admin Email", key: "actor_email", width: 30 },
    { header: "Action Type", key: "action_type", width: 30 },
    { header: "Target", key: "target", width: 30 },
    { header: "Details", key: "details", width: 50 },
  ];
  worksheet.getRow(1).font = { bold: true };

  const rows = data.map((row) => ({
    timestamp: new Date(row.timestamp),
    actor_email: row.actor_email,
    action_type: row.action_type,
    target:
      row.target_user_email ||
      row.target_employee_email ||
      row.role_name ||
      "N/A",
    details: JSON.stringify(row.changes),
  }));

  worksheet.addRows(rows);
  await workbook.xlsx.write(stream);
  stream.end();
};

const generateAdminActivityCsv = (data) => {
  const fields = [
    "timestamp",
    "actor_email",
    "action_type",
    "target",
    "details",
  ];
  const rows = data.map((row) => ({
    timestamp: row.timestamp,
    actor_email: row.actor_email,
    action_type: row.action_type,
    target:
      row.target_user_email ||
      row.target_employee_email ||
      row.role_name ||
      "N/A",
    details: JSON.stringify(row.changes),
  }));
  const json2csvParser = new Parser({ fields });
  return json2csvParser.parse(rows);
};

const generateAdminActivityReport = async (format, stream) => {
  const data = await getAdminActivityData();
  switch (format) {
    case "pdf":
      return generateAdminActivityPdf(data, stream);
    case "excel":
      return await generateAdminActivityExcel(data, stream);
    case "csv":
      const csvData = generateAdminActivityCsv(data);
      stream.write(csvData);
      stream.end();
      break;
    default:
      throw new Error("Unsupported report format");
  }
};

module.exports = {
  logActivity,
  getActivityLogs,
  getActivityLogFilterOptions,
  getAdminActivityData,
  generateAdminActivityReport,
};
