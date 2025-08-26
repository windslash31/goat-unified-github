const db = require("../config/db");
const { logActivity } = require("./logService");
const Papa = require("papaparse");
const { z } = require("zod");
const { AsyncParser } = require("json2csv");
const QueryStream = require("pg-query-stream");
const jumpcloudService = require("./jumpcloudService");
const googleWorkspaceService = require("./googleService");
const slackService = require("./slackService");
const atlassianService = require("./atlassianService");

const optionsCache = {
  data: {},
  timestamp: {},
  ttl: 10 * 60 * 1000, // 10 minutes
};

const employeeImportSchema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  employee_email: z.string().email("Invalid email format."),
  middle_name: z.string().optional().nullable(),
  position_name: z.string().optional().nullable(),
  position_level: z.string().optional().nullable(),
  join_date: z.string().optional().nullable(),
  asset_name: z.string().optional().nullable(),
  onboarding_ticket: z.string().optional().nullable(),
  manager_email: z
    .string()
    .email("Invalid manager email format.")
    .optional()
    .nullable(),
  legal_entity_name: z.string().optional().nullable(),
  office_location_name: z.string().optional().nullable(),
  employee_type_name: z.string().optional().nullable(),
  employee_sub_type_name: z.string().optional().nullable(),
});

const getEmployeeStatus = (employee) => {
  if (!employee.is_active) return "Inactive";
  if (employee.access_cut_off_date_at_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutOffDate = new Date(employee.access_cut_off_date_at_date);
    if (today > cutOffDate) return "For Escalation";
  }
  return "Active";
};

const getEmployeeById = async (employeeId) => {
  const query = `
    SELECT
      e.*,
      le.name as legal_entity,
      ol.name as office_location,
      et.name as employee_type,
      est.name as employee_sub_type,
      CONCAT_WS(' ', manager.first_name, manager.middle_name, manager.last_name) as manager_name,
      manager.employee_email as manager_email,
      (
        SELECT json_agg(json_build_object(
          'account_id', ua.id,
          'application_name', ma.name,
          'application_id', ma.id,
          'instance_name', ai.display_name,
          'status', ua.status,
          'integration_mode', ma.integration_mode,
          'is_licensable', ma.is_licensable,
          'tier_name', final_license.tier_name,
          'cost', final_license.monthly_cost,
          'currency', final_license.currency,
          'license_assignment_id', final_license.license_assignment_id
        ))
         FROM user_accounts ua
        JOIN app_instances ai ON ua.app_instance_id = ai.id
        JOIN managed_applications ma ON ai.application_id = ma.id
        LEFT JOIN LATERAL (
          (
            -- PRIORITY 1: Look for a direct, manual assignment (This part is unchanged)
            SELECT l.tier_name, l.monthly_cost, l.currency, la.id as license_assignment_id, 1 as priority
            FROM license_assignments la
            JOIN licenses l ON la.license_id = l.id
            WHERE la.employee_id = ua.user_id AND l.application_id = ma.id
          )
          UNION ALL
          (
            -- PRIORITY 2: Look for an automatic single-tier license
            SELECT l.tier_name, l.monthly_cost, l.currency, NULL::integer as license_assignment_id, 2 as priority
            FROM licenses l
            WHERE l.application_id = ma.id AND (
              SELECT count(*) FROM licenses WHERE application_id = ma.id
            ) = 1
            -- THIS IS THE NEW CONDITION TO FIX THE LOGIC --
            AND ma.integration_mode NOT IN ('MANUAL_INTERNAL', 'MANUAL_LICENSED')
          )
          ORDER BY priority ASC
          LIMIT 1
        ) final_license ON true
        WHERE ua.user_id = e.id
      ) as provisioned_accounts,
      (
        SELECT json_agg(json_build_object(
          'platform_name', pas.platform_name,
          'status', pas.status,
          'details', pas.details,
          'last_synced_at', pas.last_synced_at
        ) ORDER BY pas.platform_name)
        FROM platform_access_status pas
        WHERE pas.employee_id = e.id
      ) as platform_statuses
    FROM employees e
    LEFT JOIN legal_entities le ON e.legal_entity_id = le.id
    LEFT JOIN office_locations ol ON e.office_location_id = ol.id
    LEFT JOIN employee_types et ON e.employee_type_id = et.id
    LEFT JOIN employee_sub_types est ON e.employee_sub_type_id = est.id
    LEFT JOIN employees manager ON e.manager_id = manager.id
    WHERE e.id = $1
  `;
  const result = await db.query(query, [employeeId]);
  if (result.rows.length === 0) return null;

  const employee = result.rows[0];
  employee.status = getEmployeeStatus(employee);
  employee.provisioned_accounts = employee.provisioned_accounts || [];
  employee.platform_statuses = employee.platform_statuses || [];
  return employee;
};

const getEmployees = async (filters) => {
  const {
    status,
    search,
    jobTitle,
    manager,
    page = 1,
    limit = 20,
    sortBy = "first_name",
    sortOrder = "asc",
    legal_entity_id,
    office_location_id,
    employee_type_id,
    employee_sub_type_id,
    application_id,
  } = filters;

  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (application_id) {
    whereClauses.push(
      `e.id IN (SELECT employee_id FROM employee_application_access WHERE application_id = $${paramIndex++})`
    );
    queryParams.push(application_id);
  }

  if (status && status !== "all") {
    const statusTextMap = {
      active: "Active",
      inactive: "Inactive",
      escalation: "For Escalation",
    };
    whereClauses.push(
      `get_employee_status(e.is_active, e.access_cut_off_date_at_date) = $${paramIndex++}`
    );
    queryParams.push(statusTextMap[status]);
  }
  if (search) {
    whereClauses.push(
      `(e.first_name || ' ' || e.middle_name || ' ' || e.last_name || ' ' || e.employee_email ILIKE $${paramIndex++})`
    );
    queryParams.push(`%${search}%`);
  }
  if (jobTitle) {
    whereClauses.push(`e.position_name ILIKE $${paramIndex++}`);
    queryParams.push(`%${jobTitle}%`);
  }
  if (manager) {
    whereClauses.push(`m.employee_email ILIKE $${paramIndex++}`);
    queryParams.push(`%${manager}%`);
  }
  if (legal_entity_id) {
    whereClauses.push(`e.legal_entity_id = $${paramIndex++}`);
    queryParams.push(legal_entity_id);
  }
  if (office_location_id) {
    whereClauses.push(`e.office_location_id = $${paramIndex++}`);
    queryParams.push(office_location_id);
  }
  if (employee_type_id) {
    whereClauses.push(`e.employee_type_id = $${paramIndex++}`);
    queryParams.push(employee_type_id);
  }
  if (employee_sub_type_id) {
    whereClauses.push(`e.employee_sub_type_id = $${paramIndex++}`);
    queryParams.push(employee_sub_type_id);
  }

  const whereCondition =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countQuery = `SELECT COUNT(*) FROM employees e LEFT JOIN employees m ON e.manager_id = m.id ${whereCondition}`;
  const countResult = await db.query(countQuery, queryParams);
  const totalCount = parseInt(countResult.rows[0].count, 10);

  let orderByClause;
  const safeSortOrder = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
  if (sortBy === "status") {
    orderByClause = `ORDER BY get_employee_status(e.is_active, e.access_cut_off_date_at_date) ${safeSortOrder}`;
  } else {
    const allowedSortBy = ["first_name", "employee_email", "position_name"];
    const safeSortBy = allowedSortBy.includes(sortBy)
      ? `e.${sortBy}`
      : "e.first_name";
    orderByClause = `ORDER BY ${safeSortBy} ${safeSortOrder}`;
  }

  const offset = (page - 1) * limit;
  const mainQuery = `
        SELECT e.*,
            (SELECT json_agg(json_build_object('name', ia.name, 'role', eaa.role, 'jira_ticket', eaa.jira_ticket))
             FROM employee_application_access eaa JOIN internal_applications ia ON eaa.application_id = ia.id
             WHERE eaa.employee_id = e.id) as applications
        FROM employees e
        LEFT JOIN employees m ON e.manager_id = m.id
        ${whereCondition}
        ${orderByClause}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
  const queryValues = [...queryParams, limit, offset];
  const employeeResult = await db.query(mainQuery, queryValues);

  const employees = employeeResult.rows.map((emp) => ({
    ...emp,
    status: getEmployeeStatus(emp),
    applications: emp.applications || [],
  }));

  return {
    employees,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page, 10),
  };
};

const getEmployeesForExport = (filters) => {
  const {
    status,
    search,
    jobTitle,
    manager,
    legal_entity_id,
    office_location_id,
    employee_type_id,
    employee_sub_type_id,
    application_id,
  } = filters;

  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (application_id) {
    whereClauses.push(
      `e.id IN (SELECT employee_id FROM employee_application_access WHERE application_id = $${paramIndex++})`
    );
    queryParams.push(application_id);
  }
  if (status && status !== "all") {
    const statusTextMap = {
      active: "Active",
      inactive: "Inactive",
      escalation: "For Escalation",
    };
    whereClauses.push(
      `get_employee_status(e.is_active, e.access_cut_off_date_at_date) = $${paramIndex++}`
    );
    queryParams.push(statusTextMap[status]);
  }
  if (search) {
    whereClauses.push(
      `(e.first_name || ' ' || e.middle_name || ' ' || e.last_name || ' ' || e.employee_email ILIKE $${paramIndex++})`
    );
    queryParams.push(`%${search}%`);
  }
  if (jobTitle) {
    whereClauses.push(`e.position_name ILIKE $${paramIndex++}`);
    queryParams.push(`%${jobTitle}%`);
  }
  if (manager) {
    whereClauses.push(`manager.employee_email ILIKE $${paramIndex++}`);
    queryParams.push(`%${manager}%`);
  }
  if (legal_entity_id) {
    whereClauses.push(`e.legal_entity_id = $${paramIndex++}`);
    queryParams.push(legal_entity_id);
  }
  if (office_location_id) {
    whereClauses.push(`e.office_location_id = $${paramIndex++}`);
    queryParams.push(office_location_id);
  }
  if (employee_type_id) {
    whereClauses.push(`e.employee_type_id = $${paramIndex++}`);
    queryParams.push(employee_type_id);
  }
  if (employee_sub_type_id) {
    whereClauses.push(`e.employee_sub_type_id = $${paramIndex++}`);
    queryParams.push(employee_sub_type_id);
  }

  const whereCondition =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const query = `
        SELECT
            e.id,
            e.first_name,
            e.middle_name,
            e.last_name,
            e.employee_email,
            get_employee_status(e.is_active, e.access_cut_off_date_at_date) as status,
            e.position_name,
            e.position_level,
            manager.employee_email as manager_email,
            le.name as legal_entity,
            ol.name as office_location,
            et.name as employee_type,
            est.name as employee_sub_type,
            e.join_date,
            e.date_of_exit_at_date,
            e.access_cut_off_date_at_date,
            e.created_at,
            (
                SELECT STRING_AGG(ia.name || ' (Role: ' || eaa.role || ')', '; ')
                FROM employee_application_access eaa
                JOIN internal_applications ia ON eaa.application_id = ia.id
                WHERE eaa.employee_id = e.id
            ) as application_access,
            (
                SELECT STRING_AGG(pas.platform_name || ': ' || pas.status, '; ')
                FROM platform_access_status pas
                WHERE pas.employee_id = e.id
            ) as platform_status_summary
        FROM employees e
        LEFT JOIN employees manager ON e.manager_id = manager.id
        LEFT JOIN legal_entities le ON e.legal_entity_id = le.id
        LEFT JOIN office_locations ol ON e.office_location_id = ol.id
        LEFT JOIN employee_types et ON e.employee_type_id = et.id
        LEFT JOIN employee_sub_types est ON e.employee_sub_type_id = est.id
        ${whereCondition}
        ORDER BY e.first_name, e.last_name;
    `;

  return { text: query, values: queryParams };
};

const streamEmployeesForExport = (filters) => {
  const { text, values } = getEmployeesForExport(filters);
  const queryStream = new QueryStream(text, values);

  const fields = [
    "id",
    "first_name",
    "middle_name",
    "last_name",
    "employee_email",
    "status",
    "position_name",
    "position_level",
    "manager_email",
    "legal_entity",
    "office_location",
    "employee_type",
    "employee_sub_type",
    "join_date",
    "date_of_exit_at_date",
    "access_cut_off_date_at_date",
    "created_at",
    "application_access",
    "platform_status_summary",
  ];

  const asyncParser = new AsyncParser({ fields });

  db.pool.connect((err, client, done) => {
    if (err) {
      queryStream.emit("error", err);
      return;
    }
    const stream = client.query(queryStream);
    stream.on("end", done);
    stream.on("error", (err) => {
      done();
      queryStream.emit("error", err);
    });
  });

  return asyncParser.parse(queryStream);
};

const updateEmployee = async (employeeId, updatedData, actorId, reqContext) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    if (typeof updatedData.manager_email !== "undefined") {
      const managerEmail = updatedData.manager_email;
      if (managerEmail === "" || managerEmail === null) {
        updatedData.manager_id = null;
      } else {
        const managerResult = await client.query(
          "SELECT id FROM employees WHERE employee_email = $1",
          [managerEmail]
        );
        if (managerResult.rows.length > 0) {
          updatedData.manager_id = managerResult.rows[0].id;
        } else {
          throw new Error(`Manager with email "${managerEmail}" not found.`);
        }
      }
      delete updatedData.manager_email;
    }

    const beforeResult = await client.query(
      "SELECT * FROM employees WHERE id = $1 FOR UPDATE",
      [employeeId]
    );
    if (beforeResult.rows.length === 0) throw new Error("Employee not found");

    const originalEmployee = beforeResult.rows[0];
    const changes = {};
    for (const key in updatedData) {
      if (
        Object.prototype.hasOwnProperty.call(updatedData, key) &&
        String(updatedData[key] ?? "") !== String(originalEmployee[key] ?? "")
      ) {
        changes[key] = updatedData[key] === "" ? null : updatedData[key];
      }
    }

    if (Object.keys(changes).length === 0) {
      await client.query("ROLLBACK");
      return {
        message: "No changes were made.",
        employee: await getEmployeeById(employeeId),
      };
    }

    const setClauses = Object.keys(changes)
      .map((field, index) => `"${field}" = $${index + 2}`)
      .join(", ");
    const values = Object.values(changes);

    await client.query(`UPDATE employees SET ${setClauses} WHERE id = $1`, [
      employeeId,
      ...values,
    ]);

    const logChanges = {};
    for (const key in changes) {
      let fromValue = originalEmployee[key];
      let toValue = changes[key];

      if (fromValue instanceof Date) {
        fromValue = fromValue.toISOString().split("T")[0];
      }
      if (toValue instanceof Date) {
        toValue = toValue.toISOString().split("T")[0];
      }

      logChanges[key] = { from: fromValue, to: toValue };
    }
    await logActivity(
      actorId,
      "EMPLOYEE_UPDATE",
      { targetEmployeeId: employeeId, changes: logChanges },
      reqContext,
      client
    );

    await client.query("COMMIT");

    const updatedEmployee = await getEmployeeById(employeeId);
    return {
      message: "Employee updated successfully",
      employee: updatedEmployee,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const createEmployeeFromTicket = async (ticketData, actorId, reqContext) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const requiredFields = ["first_name", "last_name", "employee_email"];
    for (const field of requiredFields) {
      if (!ticketData[field]) {
        throw new Error(`Missing required field from ticket data: ${field}`);
      }
    }

    const existingEmployee = await client.query(
      "SELECT id FROM employees WHERE employee_email ILIKE $1",
      [ticketData.employee_email]
    );
    if (existingEmployee.rows.length > 0) {
      throw new Error(
        `An employee with the email ${ticketData.employee_email} already exists.`
      );
    }

    const resolvedIds = {};

    if (ticketData.manager_email) {
      const result = await client.query(
        "SELECT id FROM employees WHERE employee_email ILIKE $1",
        [ticketData.manager_email]
      );
      if (result.rows.length === 0)
        throw new Error(
          `Manager not found with email: ${ticketData.manager_email}`
        );
      resolvedIds.manager_id = result.rows[0].id;
    }

    if (ticketData.legal_entity_name) {
      const result = await client.query(
        "SELECT id FROM legal_entities WHERE name ILIKE $1",
        [ticketData.legal_entity_name]
      );
      if (result.rows.length === 0)
        throw new Error(
          `Legal Entity not found with name: ${ticketData.legal_entity_name}`
        );
      resolvedIds.legal_entity_id = result.rows[0].id;
    }

    if (ticketData.office_location_name) {
      const result = await client.query(
        "SELECT id FROM office_locations WHERE name ILIKE $1",
        [ticketData.office_location_name]
      );
      if (result.rows.length === 0)
        throw new Error(
          `Office Location not found with name: ${ticketData.office_location_name}`
        );
      resolvedIds.office_location_id = result.rows[0].id;
    }

    if (ticketData.employee_type_name) {
      const result = await client.query(
        "SELECT id FROM employee_types WHERE name ILIKE $1",
        [ticketData.employee_type_name]
      );
      if (result.rows.length === 0)
        throw new Error(
          `Employee Type not found with name: ${ticketData.employee_type_name}`
        );
      resolvedIds.employee_type_id = result.rows[0].id;
    }

    if (ticketData.employee_sub_type_name) {
      const result = await client.query(
        "SELECT id FROM employee_sub_types WHERE name ILIKE $1",
        [ticketData.employee_sub_type_name]
      );
      if (result.rows.length === 0)
        throw new Error(
          `Employee Sub-Type not found with name: ${ticketData.employee_sub_type_name}`
        );
      resolvedIds.employee_sub_type_id = result.rows[0].id;
    }

    const finalData = { ...ticketData, ...resolvedIds };

    const allowedFields = [
      "first_name",
      "last_name",
      "middle_name",
      "employee_email",
      "position_name",
      "position_level",
      "join_date",
      "asset_name",
      "onboarding_ticket",
      "legal_entity_id",
      "office_location_id",
      "employee_type_id",
      "employee_sub_type_id",
      "manager_id",
    ];

    const columns = [];
    const values = [];
    const valuePlaceholders = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (finalData[field] !== undefined) {
        columns.push(field);
        values.push(finalData[field]);
        valuePlaceholders.push(`$${paramIndex++}`);
      }
    }

    const query = `
            INSERT INTO employees (${columns.join(", ")})
            VALUES (${valuePlaceholders.join(", ")})
            RETURNING id;
        `;

    const result = await client.query(query, values);
    const newEmployeeId = result.rows[0].id;

    await logActivity(
      actorId,
      "EMPLOYEE_CREATE",
      {
        targetEmployeeId: newEmployeeId,
        details: { ...ticketData, source_ticket: ticketData.onboarding_ticket },
      },
      reqContext,
      client
    );

    await client.query("COMMIT");

    return {
      message: "Employee created successfully from ticket.",
      employeeId: newEmployeeId,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const updateOffboardingFromTicket = async (ticketData, actorId, reqContext) => {
  const {
    employee_email,
    date_of_exit,
    access_cut_off_date,
    offboarding_ticket,
  } = ticketData;

  if (!employee_email) {
    throw new Error(
      'Required field "employee_email" is missing from the request body.'
    );
  }
  if (!date_of_exit || !access_cut_off_date) {
    throw new Error(
      "Missing required fields: date_of_exit and access_cut_off_date are required."
    );
  }

  const employeeResult = await db.query(
    "SELECT id FROM employees WHERE employee_email = $1",
    [employee_email]
  );
  if (employeeResult.rows.length === 0) {
    throw new Error(`Employee not found with email: ${employee_email}`);
  }
  const employeeId = employeeResult.rows[0].id;

  const updatedData = {
    date_of_exit_at_date: date_of_exit,
    access_cut_off_date_at_date: access_cut_off_date,
    offboarding_ticket: offboarding_ticket,
    is_active: false,
  };

  return await updateEmployee(employeeId, updatedData, actorId, reqContext);
};

const getPlatformLogsFromDB = async (employeeId, platform, filters = {}) => {
  let tableName;
  const whereClauses = ["employee_id = $1"];
  const queryParams = [employeeId];
  let paramIndex = 2;

  switch (platform) {
    case "jumpcloud":
      tableName = "jumpcloud_logs";
      // Add specific filters for JumpCloud
      if (filters.service && filters.service !== "all") {
        whereClauses.push(`details ->> 'service' = $${paramIndex++}`);
        queryParams.push(filters.service);
      }
      break;
    case "google":
      tableName = "google_workspace_logs";
      // Add filters for Google here in the future
      break;
    default:
      throw new Error("Invalid or unsupported platform specified for logs.");
  }

  // Add generic filters like date range
  if (filters.startTime) {
    whereClauses.push(`timestamp >= $${paramIndex++}`);
    queryParams.push(filters.startTime);
  }
  if (filters.endTime) {
    // To make the end date inclusive, we check for dates less than the next day
    const inclusiveEndDate = new Date(filters.endTime);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
    whereClauses.push(`timestamp < $${paramIndex++}`);
    queryParams.push(inclusiveEndDate.toISOString().split("T")[0]);
  }

  const whereCondition =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const limit = parseInt(filters.limit, 10) || 100;
  queryParams.push(limit);

  const query = `
    SELECT * FROM ${tableName}
    ${whereCondition}
    ORDER BY timestamp DESC
    LIMIT $${paramIndex}
  `;

  const result = await db.query(query, queryParams);
  return result.rows;
};

const getGoogleLogs = async (employeeId) => {
  const employeeRes = await db.query(
    "SELECT employee_email FROM employees WHERE id = $1",
    [employeeId]
  );
  if (employeeRes.rows.length === 0) throw new Error("Employee not found.");
  const email = employeeRes.rows[0].employee_email;
  return await googleWorkspaceService.getLoginEvents(email);
};

const getSlackLogs = async (employeeId) => {
  const employeeRes = await db.query(
    "SELECT employee_email FROM employees WHERE id = $1",
    [employeeId]
  );
  if (employeeRes.rows.length === 0) throw new Error("Employee not found.");
  const email = employeeRes.rows[0].employee_email;
  return await slackService.getAuditLogs(email);
};

const getUnifiedTimeline = async (employeeId) => {
  const query = `
        SELECT
            eaa.application_id as id,
            'Access to ' || ia.name || ' was granted with the role: ' || eaa.role as description,
            ia.name as source,
            eaa.updated_at as timestamp
        FROM
            employee_application_access eaa
        JOIN
            internal_applications ia ON eaa.application_id = ia.id
        WHERE
            eaa.employee_id = $1
        ORDER BY
            eaa.updated_at DESC;
    `;
  const result = await db.query(query, [employeeId]);
  return result.rows;
};

const deactivateOnPlatforms = async (
  employeeId,
  platforms,
  actorId,
  reqContext
) => {
  const employeeRes = await db.query(
    "SELECT employee_email FROM employees WHERE id = $1",
    [employeeId]
  );
  if (employeeRes.rows.length === 0) throw new Error("Employee not found.");

  const email = employeeRes.rows[0].employee_email;
  const deactivation_results = [];
  const platformMap = {
    jumpcloud: jumpcloudService.suspendUser,
    google: googleWorkspaceService.suspendUser,
    slack: slackService.deactivateUser,
    atlassian: atlassianService.deactivateUser,
  };

  for (const platform of platforms) {
    if (platformMap[platform]) {
      const result = await platformMap[platform](email);
      deactivation_results.push({
        platform,
        status: result.success ? "SUCCESS" : "FAILED",
        message: result.message,
      });
    }
  }

  await logActivity(
    actorId,
    "MANUAL_PLATFORM_SUSPENSION",
    { targetEmployeeId: employeeId, deactivation_results },
    reqContext
  );
  return {
    message: "Suspension process completed.",
    results: deactivation_results,
  };
};

const bulkDeactivateOnPlatforms = async (
  employeeIds,
  platforms,
  actorId,
  reqContext
) => {
  const results = [];
  for (const employeeId of employeeIds) {
    try {
      const result = await deactivateOnPlatforms(
        employeeId,
        platforms,
        actorId,
        reqContext
      );
      results.push({ employeeId, success: true, message: result.message });
    } catch (error) {
      results.push({ employeeId, success: false, message: error.message });
    }
  }
  return { message: "Bulk suspension process completed.", results };
};

const getEmployeeOptions = async (tableName) => {
  const now = Date.now();
  if (
    optionsCache.data[tableName] &&
    now - optionsCache.timestamp[tableName] < optionsCache.ttl
  ) {
    console.log(`[Cache] HIT for ${tableName}`);
    return optionsCache.data[tableName];
  }
  console.log(`[Cache] MISS for ${tableName}`);

  if (!/^[a-z_]+$/.test(tableName)) {
    throw new Error("Invalid table name.");
  }

  const result = await db.query(
    `SELECT id, name FROM ${tableName} ORDER BY name`
  );

  optionsCache.data[tableName] = result.rows;
  optionsCache.timestamp[tableName] = now;

  return result.rows;
};

const createApplicationAccess = async (ticketData, actorId, reqContext) => {
  const { employee_email, application_name, role, jira_ticket } = ticketData;

  if (!employee_email || !application_name) {
    throw new Error(
      "Missing required fields: employee_email and application_name are required."
    );
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const employeeResult = await client.query(
      "SELECT id FROM employees WHERE employee_email ILIKE $1",
      [employee_email]
    );
    if (employeeResult.rows.length === 0)
      throw new Error(`Employee not found with email: ${employee_email}`);
    const employeeId = employeeResult.rows[0].id;

    const applicationResult = await client.query(
      "SELECT id FROM internal_applications WHERE name ILIKE $1",
      [application_name]
    );
    if (applicationResult.rows.length === 0)
      throw new Error(
        `Internal application not found with name: ${application_name}`
      );
    const applicationId = applicationResult.rows[0].id;

    const query = `
            INSERT INTO employee_application_access (employee_id, application_id, role, jira_ticket, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (employee_id, application_id) DO UPDATE SET
                role = EXCLUDED.role,
                jira_ticket = EXCLUDED.jira_ticket,
                updated_at = NOW();
        `;
    await client.query(query, [employeeId, applicationId, role, jira_ticket]);

    await client.query(
      "UPDATE employees SET updated_at = NOW() WHERE id = $1",
      [employeeId]
    );

    await logActivity(
      actorId,
      "APPLICATION_ACCESS_CREATE",
      {
        targetEmployeeId: employeeId,
        details: {
          application: application_name,
          role: role,
          source_ticket: jira_ticket,
        },
      },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return {
      message: `Access to ${application_name} successfully recorded for ${employee_email}.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getLicenseDetails = async (employeeId) => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  const platformChecks = {
    google: googleWorkspaceService.getUserStatus(employee.employee_email),
    jumpcloud: jumpcloudService.getUserStatus(employee.employee_email),
    slack: slackService.getUserStatus(employee.employee_email),
    atlassian: atlassianService.getUserStatus(employee.employee_email),
  };

  const results = await Promise.all(
    Object.entries(platformChecks).map(async ([platform, promise]) => {
      try {
        const data = await promise;
        let status = "Not Licensed";
        let details = {};

        if (data) {
          switch (platform) {
            case "google":
              status = data.length > 0 ? "Licensed" : "Not Licensed";
              details = data.map((lic) => ({
                sku: lic.skuName,
                plan: lic.planName,
              }));
              break;
            case "jumpcloud":
              status = data.active ? "Active" : "Suspended";
              break;
            case "slack":
              status = data.deleted ? "Deactivated" : "Active";
              details = {
                is_guest: data.is_restricted || data.is_ultra_restricted,
              };
              break;
            case "atlassian":
              status = data.active ? "Active" : "Inactive";
              details = {
                products:
                  data.applicationRoles?.items.map((item) => item.name) || [],
              };
              break;
            default:
              status = "Active";
          }
        }
        return { platform, status, details };
      } catch (error) {
        return {
          platform,
          status: "Error",
          details: { message: error.message },
        };
      }
    })
  );

  return results;
};

const bulkImportEmployees = async (fileBuffer, actorId, reqContext) => {
  const client = await db.pool.connect();
  const results = { created: 0, updated: 0, errors: [] };
  const csvString = fileBuffer.toString("utf-8");
  const parsedData = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedData.errors.length > 0) {
    results.errors.push({
      message: `CSV parsing error: ${parsedData.errors[0].message}`,
    });
    return results;
  }

  try {
    await client.query("BEGIN");

    for (const [index, row] of parsedData.data.entries()) {
      const rowNum = index + 2;

      const validationResult = employeeImportSchema.safeParse(row);
      if (!validationResult.success) {
        results.errors.push({
          row: rowNum,
          message: validationResult.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        });
        continue;
      }

      const { first_name, last_name, employee_email } = validationResult.data;

      const existingEmployeeResult = await client.query(
        "SELECT id FROM employees WHERE employee_email = $1",
        [employee_email]
      );
      const existingEmployee = existingEmployeeResult.rows[0];

      const resolvedIds = {};
      if (row.manager_email) {
        const res = await client.query(
          "SELECT id FROM employees WHERE employee_email ILIKE $1",
          [row.manager_email]
        );
        if (res.rows.length > 0) resolvedIds.manager_id = res.rows[0].id;
      }
      if (row.legal_entity_name) {
        const res = await client.query(
          "SELECT id FROM legal_entities WHERE name ILIKE $1",
          [row.legal_entity_name]
        );
        if (res.rows.length > 0) resolvedIds.legal_entity_id = res.rows[0].id;
      }
      if (row.office_location_name) {
        const res = await client.query(
          "SELECT id FROM office_locations WHERE name ILIKE $1",
          [row.office_location_name]
        );
        if (res.rows.length > 0)
          resolvedIds.office_location_id = res.rows[0].id;
      }
      if (row.employee_type_name) {
        const res = await client.query(
          "SELECT id FROM employee_types WHERE name ILIKE $1",
          [row.employee_type_name]
        );
        if (res.rows.length > 0) resolvedIds.employee_type_id = res.rows[0].id;
      }
      if (row.employee_sub_type_name) {
        const res = await client.query(
          "SELECT id FROM employee_sub_types WHERE name ILIKE $1",
          [row.employee_sub_type_name]
        );
        if (res.rows.length > 0)
          resolvedIds.employee_sub_type_id = res.rows[0].id;
      }

      const employeeData = { ...validationResult.data, ...resolvedIds };

      const allowedFields = [
        "first_name",
        "last_name",
        "middle_name",
        "employee_email",
        "position_name",
        "position_level",
        "join_date",
        "asset_name",
        "onboarding_ticket",
        "manager_id",
        "legal_entity_id",
        "office_location_id",
        "employee_type_id",
        "employee_sub_type_id",
      ];

      if (existingEmployee) {
        const updateFields = allowedFields
          .filter((field) => employeeData[field] !== undefined)
          .map((field, i) => `"${field}" = $${i + 2}`)
          .join(", ");

        if (updateFields) {
          const updateValues = allowedFields
            .filter((field) => employeeData[field] !== undefined)
            .map((field) => employeeData[field]);

          await client.query(
            `UPDATE employees SET ${updateFields} WHERE id = $1`,
            [existingEmployee.id, ...updateValues]
          );
          results.updated++;
        }
      } else {
        const insertColumns = allowedFields.filter(
          (field) => employeeData[field] !== undefined
        );

        if (insertColumns.length > 0) {
          const insertValues = insertColumns.map(
            (field) => employeeData[field]
          );
          const valuePlaceholders = insertColumns
            .map((_, i) => `$${i + 1}`)
            .join(", ");

          await client.query(
            `INSERT INTO employees (${insertColumns.join(
              ", "
            )}) VALUES (${valuePlaceholders})`,
            insertValues
          );
          results.created++;
        }
      }
    }

    await logActivity(
      actorId,
      "EMPLOYEE_BULK_IMPORT",
      { results },
      reqContext,
      client
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk import transaction failed:", err);
    results.errors.push({
      message:
        "A server error occurred during the import. The entire operation was rolled back.",
    });
  } finally {
    client.release();
  }

  return results;
};

const getEmployeeDevices = async (employeeId) => {
  const employee = await getEmployeeById(employeeId);
  if (!employee || !employee.employee_email) {
    throw new Error("Employee not found or has no email.");
  }

  const jumpcloudUser = await jumpcloudService.getUser(employee.employee_email);
  if (!jumpcloudUser) {
    return [];
  }

  const associations = await jumpcloudService.getSystemAssociations(
    jumpcloudUser.id
  );
  if (!associations || associations.length === 0) {
    return [];
  }

  const systemIds = associations.map((assoc) => assoc.to.id);
  if (systemIds.length === 0) {
    return [];
  }

  const deviceDetailsPromises = systemIds.map((systemId) =>
    jumpcloudService.getSystemDetails(systemId)
  );

  const devices = await Promise.all(deviceDetailsPromises);
  return devices;
};

const syncPlatformStatus = async (employeeId) => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    console.error(
      `syncPlatformStatus: Employee with ID ${employeeId} not found.`
    );
    return;
  }

  console.log(`Orchestrating platform sync for: ${employee.employee_email}`);

  const syncPromises = [
    atlassianService.syncUserData(employeeId, employee.employee_email),
    jumpcloudService.syncUserData(employeeId, employee.employee_email),
    googleWorkspaceService.syncUserData(employeeId, employee.employee_email),
    slackService.syncUserData(employeeId, employee.employee_email),
  ];

  await Promise.allSettled(syncPromises);

  await db.query("UPDATE employees SET updated_at = NOW() WHERE id = $1", [
    employeeId,
  ]);
};

const getPlatformStatuses = async (employeeId) => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new Error(`Employee with ID ${employeeId} not found.`);
  }

  const email = employee.employee_email;
  const platformStatuses = [];

  const jumpcloudQuery = `SELECT * FROM jumpcloud_users WHERE email = $1`;
  const atlassianQuery = `SELECT * FROM atlassian_users WHERE email_address = $1`;
  const googleQuery = `SELECT * FROM google_users WHERE primary_email = $1`;
  const slackQuery = `SELECT * FROM slack_users WHERE email = $1`;

  const [jumpcloudRes, atlassianRes, googleRes, slackRes] = await Promise.all([
    db.query(jumpcloudQuery, [email]),
    db.query(atlassianQuery, [email]),
    db.query(googleQuery, [email]),
    db.query(slackQuery, [email]),
  ]);

  if (jumpcloudRes.rows.length > 0) {
    const jc = jumpcloudRes.rows[0];
    platformStatuses.push({
      platform: "JumpCloud",
      status: jc.suspended ? "Suspended" : "Active",
      details: {
        coreIdentity: { id: jc.id, email: jc.email, username: jc.username },
        accountStatus: {
          state: jc.activated ? "ACTIVATED" : "DEACTIVATED",
          activated: jc.activated,
          suspended: jc.suspended,
          accountLocked: jc.account_locked,
          passwordExpired: jc.password_expiration_date < new Date(),
          mfaStatus: jc.totp_enabled ? "ENABLED" : "DISABLED",
        },
        userDetails: {
          jobTitle: jc.job_title,
          department: jc.department,
          company: jc.company,
          location: jc.location,
        },
        permissions: {
          sudo: jc.sudo,
        },
        security: {
          mfaEnrollment: jc.mfa_enrollment,
        },
        customAttributes: jc.attributes,
        last_synced_at: jc.updated_at,
      },
    });
  } else {
    platformStatuses.push({
      platform: "JumpCloud",
      status: "Not Found",
      details: {},
    });
  }

  if (atlassianRes.rows.length > 0) {
    const atlassian = atlassianRes.rows[0];
    platformStatuses.push({
      platform: "Atlassian",
      status: atlassian.account_status,
      details: {
        accountId: atlassian.account_id,
        emailAddress: atlassian.email_address,
        displayName: atlassian.display_name,
        accountType: atlassian.account_type,
        last_synced_at: atlassian.last_updated_at,
      },
    });
  } else {
    platformStatuses.push({
      platform: "Atlassian",
      status: "Not Found",
      details: {},
    });
  }

  if (googleRes.rows.length > 0) {
    const google = googleRes.rows[0];
    platformStatuses.push({
      platform: "Google",
      status: google.suspended ? "Suspended" : "Active",
      details: {
        isAdmin: google.is_admin,
        isDelegatedAdmin: google.is_delegated_admin,
        orgUnitPath: google.org_unit_path,
        isEnrolledIn2Sv: google.is_enrolled_in_2sv,
        lastLoginTime: google.last_login_time,
        last_synced_at: google.last_synced_at,
      },
    });
  } else {
    platformStatuses.push({
      platform: "Google",
      status: "Not Found",
      details: {},
    });
  }

  if (slackRes.rows.length > 0) {
    const slack = slackRes.rows[0];
    platformStatuses.push({
      platform: "Slack",
      status: slack.status,
      details: {
        id: slack.user_id,
        is_admin: slack.is_admin,
        is_owner: slack.is_owner,
        is_guest: slack.is_restricted || slack.is_ultra_restricted,
        last_synced_at: slack.last_synced_at,
      },
    });
  } else {
    platformStatuses.push({
      platform: "Slack",
      status: "Not Found",
      details: {},
    });
  }

  return platformStatuses;
};

const forceSyncPlatformStatus = async (employeeId) => {
  console.log(`Force syncing platform status for employee ID: ${employeeId}`);
  await syncPlatformStatus(employeeId);
  return getPlatformStatuses(employeeId);
};

const getApplicationAccess = async (employeeId) => {
  const employee = await getEmployeeById(employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }
  try {
    const atlassianQuery = `
      WITH user_info AS (
        SELECT account_id FROM atlassian_users WHERE email_address = $1
      ),
      user_groups AS (
        SELECT group_id FROM atlassian_group_members WHERE account_id = (SELECT account_id FROM user_info)
      )
      SELECT
        (
          SELECT json_agg(p) FROM (
            SELECT DISTINCT jp.project_id, jp.project_key, jp.project_name, jp.project_type, jp.jira_url, jr.role_name
            FROM jira_project_permissions jpp
            JOIN jira_projects jp ON jpp.project_id = jp.project_id
            LEFT JOIN jira_roles jr ON jpp.role_id = jr.role_id
            WHERE (jpp.actor_type = 'atlassian-user-role-actor' AND jpp.actor_id = (SELECT account_id FROM user_info)) OR (jpp.actor_type = 'atlassian-group-role-actor' AND jpp.actor_id IN (SELECT group_id FROM user_groups))
          ) p
        ) as jira_projects,
        (
          SELECT json_agg(r) FROM (
            SELECT DISTINCT br.repo_uuid, br.full_name, br.description, br.project_name, br.updated_on, brp.permission_level
            FROM bitbucket_repository_permissions brp
            JOIN bitbucket_repositories br ON brp.repo_uuid = br.repo_uuid
            WHERE brp.user_account_id = (SELECT account_id FROM user_info)
          ) r
        ) as bitbucket_repositories,
        (
          SELECT json_agg(s) FROM (
            SELECT cs.id, cs.key, cs.name, cs.description, json_agg(DISTINCT csp.operation) as permissions
            FROM confluence_space_permission csp
            JOIN confluence_space cs ON csp.space_id = cs.id
            WHERE (csp.principal_type = 'user' AND csp.principal_id = (SELECT account_id FROM user_info)) OR (csp.principal_type = 'group' AND csp.principal_id IN (SELECT group_id FROM user_groups))
            GROUP BY cs.id, cs.key, cs.name, cs.description
          ) s
        ) as confluence_spaces;
    `;
    const atlassianRes = await db.query(atlassianQuery, [
      employee.employee_email,
    ]);
    const atlassianAccess = {
      jiraProjects: atlassianRes.rows[0]?.jira_projects || [],
      bitbucketRepositories: atlassianRes.rows[0]?.bitbucket_repositories || [],
      confluenceSpaces: atlassianRes.rows[0]?.confluence_spaces || [],
    };

    const jumpcloudQuery = `
      SELECT DISTINCT ja.*
      FROM jumpcloud_applications ja
      JOIN jumpcloud_application_bindings jab ON ja.id = jab.application_id
      JOIN jumpcloud_user_group_members jugm ON jab.group_id = jugm.group_id
      JOIN jumpcloud_users ju ON jugm.user_id = ju.id
      WHERE ju.email = $1;
    `;
    const jumpcloudRes = await db.query(jumpcloudQuery, [
      employee.employee_email,
    ]);

    // Fetch the sync job timestamps
    const syncJobsQuery = `SELECT job_name, last_success_at FROM sync_jobs WHERE job_name IN ('atlassian_sync', 'jumpcloud_sync')`;
    const syncJobsRes = await db.query(syncJobsQuery);

    const syncTimestamps = syncJobsRes.rows.reduce((acc, row) => {
      acc[row.job_name] = row.last_success_at;
      return acc;
    }, {});

    // Restructure the return value to include both data and timestamps
    return {
      accessData: {
        atlassian: atlassianAccess,
        jumpcloud: jumpcloudRes.rows,
      },
      syncTimestamps: syncTimestamps,
    };
  } catch (error) {
    console.error("Error fetching application access:", error);
    throw error;
  }
};

const onboardDeferred = async (employeeData, actorId, reqContext) => {
  const { manager_email, ...restOfEmployeeData } = employeeData;

  // Pre-fetch all possible related entities to create lookup maps
  const [legalEntities, officeLocations, employeeTypes, employeeSubTypes] =
    await Promise.all([
      db.query("SELECT id, name FROM legal_entities"),
      db.query("SELECT id, name FROM office_locations"),
      db.query("SELECT id, name FROM employee_types"),
      db.query("SELECT id, name FROM employee_sub_types"),
    ]);

  const legalEntityMap = new Map(
    legalEntities.rows.map((item) => [item.name, item.id])
  );
  const officeLocationMap = new Map(
    officeLocations.rows.map((item) => [item.name, item.id])
  );
  const employeeTypeMap = new Map(
    employeeTypes.rows.map((item) => [item.name, item.id])
  );
  const employeeSubTypeMap = new Map(
    employeeSubTypes.rows.map((item) => [item.name, item.id])
  );

  const resolvedData = {
    ...restOfEmployeeData,
    legal_entity_id: legalEntityMap.get(employeeData.legal_entity_name),
    office_location_id: officeLocationMap.get(
      employeeData.office_location_name
    ),
    employee_type_id: employeeTypeMap.get(employeeData.employee_type_name),
    employee_sub_type_id: employeeSubTypeMap.get(
      employeeData.employee_sub_type_name
    ),
  };

  const allowedFields = [
    "first_name",
    "last_name",
    "middle_name",
    "employee_email",
    "position_name",
    "join_date",
    "asset_name",
    "onboarding_ticket",
    "legal_entity_id",
    "office_location_id",
    "employee_type_id",
    "employee_sub_type_id",
    "pending_manager_email",
  ];

  const columns = [];
  const values = [];
  const valuePlaceholders = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    let value = resolvedData[field];
    if (field === "pending_manager_email") value = manager_email;

    if (value !== undefined && value !== null) {
      columns.push(field);
      values.push(value);
      valuePlaceholders.push(`$${paramIndex++}`);
    }
  }

  const query = `
      INSERT INTO employees (${columns.join(", ")})
      VALUES (${valuePlaceholders.join(", ")})
      RETURNING id;
  `;

  const result = await db.query(query, values);
  return {
    message: "Employee accepted for deferred processing.",
    employeeId: result.rows[0].id,
  };
};

// ** THIS IS THE FULL, CORRECTED reconcileManagers FUNCTION **
const reconcileManagers = async (actorId, reqContext) => {
  console.log("Starting manager reconciliation job...");
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE employees e
      SET manager_id = m.id,
          pending_manager_email = NULL
      FROM employees m
      WHERE e.pending_manager_email = m.employee_email
      AND e.pending_manager_email IS NOT NULL;
    `);

    await client.query("COMMIT");

    const updatedCount = result.rowCount;
    console.log(
      `Manager reconciliation complete. ${updatedCount} employees updated.`
    );

    await logActivity(
      actorId,
      "MANAGER_RECONCILIATION",
      { details: { updatedCount } },
      reqContext
    );

    return { message: "Manager reconciliation complete.", updatedCount };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Manager reconciliation failed.", err);
    throw err;
  } finally {
    client.release();
  }
};

const getJumpCloudSsoAppDetails = async (employeeId, managedApplicationId) => {
  const query = `
    SELECT jg.name as group_name
    FROM jumpcloud_user_groups jg
    JOIN jumpcloud_user_group_members jgm ON jg.id = jgm.group_id
    JOIN jumpcloud_users ju ON jgm.user_id = ju.id
    JOIN employees e ON ju.email = e.employee_email
    JOIN jumpcloud_application_bindings jab ON jg.id = jab.group_id
    JOIN managed_applications ma ON jab.application_id = ma.jumpcloud_app_id
    WHERE e.id = $1 AND ma.id = $2;
  `;
  const result = await db.query(query, [employeeId, managedApplicationId]);
  return { user_groups: result.rows.map((row) => row.group_name) };
};

const removeUserAccount = async (userAccountId, actorId, reqContext) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    // Find the account to get details for logging before deleting
    const accountRes = await client.query(
      `SELECT ua.user_id, ma.name as app_name
       FROM user_accounts ua
       JOIN app_instances ai ON ua.app_instance_id = ai.id
       JOIN managed_applications ma ON ai.application_id = ma.id
       WHERE ua.id = $1`,
      [userAccountId]
    );

    if (accountRes.rows.length === 0) {
      throw new Error("User account not found.");
    }
    const { user_id: employeeId, app_name } = accountRes.rows[0];

    // Delete any associated license assignments first
    await client.query(
      `DELETE FROM license_assignments WHERE id IN (
         SELECT la.id FROM license_assignments la
         JOIN licenses l ON la.license_id = l.id
         JOIN app_instances ai ON l.application_id = ai.application_id
         WHERE la.employee_id = $1 AND ai.id = (SELECT app_instance_id FROM user_accounts WHERE id = $2)
       )`,
      [employeeId, userAccountId]
    );

    // Now delete the main account record
    await client.query("DELETE FROM user_accounts WHERE id = $1", [
      userAccountId,
    ]);

    // Log the activity
    await logActivity(
      actorId,
      "APPLICATION_ACCESS_DELETE",
      { targetEmployeeId: employeeId, details: { application: app_name } },
      reqContext,
      client
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: "Application access removed successfully.",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getEmployeeById,
  getEmployees,
  getEmployeesForExport,
  updateEmployee,
  getPlatformStatuses,
  getPlatformLogsFromDB,
  deactivateOnPlatforms,
  getEmployeeOptions,
  getGoogleLogs,
  getSlackLogs,
  getUnifiedTimeline,
  streamEmployeesForExport,
  bulkDeactivateOnPlatforms,
  createEmployeeFromTicket,
  updateOffboardingFromTicket,
  createApplicationAccess,
  getLicenseDetails,
  bulkImportEmployees,
  getEmployeeDevices,
  getApplicationAccess,
  syncPlatformStatus,
  onboardDeferred,
  reconcileManagers,
  forceSyncPlatformStatus,
  getJumpCloudSsoAppDetails,
  removeUserAccount,
};
