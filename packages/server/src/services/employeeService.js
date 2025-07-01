const db = require('../config/db');
const { logActivity } = require('./logService');

// External Platform Services
const jumpcloudService = require('./jumpcloudService');
const googleWorkspaceService = require('./googleService');
const slackService = require('./slackService');
const atlassianService = require('./atlassianService');

const getEmployeeStatus = (employee) => {
    if (!employee.is_active) return 'Inactive';
    if (employee.access_cut_off_date_at_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const cutOffDate = new Date(employee.access_cut_off_date_at_date);
        if (today > cutOffDate) return 'For Escalation';
    }
    return 'Active';
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
            (SELECT json_agg(json_build_object(
                'name', ia.name, 
                'role', eaa.role, 
                'jira_ticket', eaa.jira_ticket
            )) 
            FROM employee_application_access eaa
            JOIN internal_applications ia ON eaa.application_id = ia.id
            WHERE eaa.employee_id = e.id) as applications
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
    employee.applications = employee.applications || [];
    return employee;
};

const getEmployees = async (filters) => {
    const { 
        status, search, jobTitle, manager, page = 1, limit = 20, sortBy = 'first_name', sortOrder = 'asc',
        legal_entity_id, office_location_id, employee_type_id, employee_sub_type_id,
        application_id
    } = filters;
    
    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    if (application_id) {
        whereClauses.push(`e.id IN (SELECT employee_id FROM employee_application_access WHERE application_id = $${paramIndex++})`);
        queryParams.push(application_id);
    }

    if (status && status !== 'all') {
        const statusTextMap = { 'active': 'Active', 'inactive': 'Inactive', 'escalation': 'For Escalation' };
        whereClauses.push(`get_employee_status(e.is_active, e.access_cut_off_date_at_date) = $${paramIndex++}`);
        queryParams.push(statusTextMap[status]);
    }
    if (search) {
        whereClauses.push(`(e.first_name || ' ' || e.middle_name || ' ' || e.last_name || ' ' || e.employee_email ILIKE $${paramIndex++})`);
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

    const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) FROM employees e LEFT JOIN employees m ON e.manager_id = m.id ${whereCondition}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    let orderByClause;
    const safeSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    if (sortBy === 'status') {
        orderByClause = `ORDER BY get_employee_status(e.is_active, e.access_cut_off_date_at_date) ${safeSortOrder}`;
    } else {
        const allowedSortBy = ['first_name', 'employee_email', 'position_name'];
        const safeSortBy = allowedSortBy.includes(sortBy) ? `e.${sortBy}` : 'e.first_name';
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

    const employees = employeeResult.rows.map(emp => ({
        ...emp,
        status: getEmployeeStatus(emp),
        applications: emp.applications || []
    }));

    return {
        employees,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page, 10)
    };
};

const getEmployeesForExport = async (filters) => {
    const { 
        status, search, jobTitle, manager, 
        legal_entity_id, office_location_id, employee_type_id, employee_sub_type_id,
        application_id
    } = filters;
    
    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    if (application_id) {
        whereClauses.push(`e.id IN (SELECT employee_id FROM employee_application_access WHERE application_id = $${paramIndex++})`);
        queryParams.push(application_id);
    }
    if (status && status !== 'all') {
        const statusTextMap = { 'active': 'Active', 'inactive': 'Inactive', 'escalation': 'For Escalation' };
        whereClauses.push(`get_employee_status(e.is_active, e.access_cut_off_date_at_date) = $${paramIndex++}`);
        queryParams.push(statusTextMap[status]);
    }
    if (search) {
        whereClauses.push(`(e.first_name || ' ' || e.middle_name || ' ' || e.last_name || ' ' || e.employee_email ILIKE $${paramIndex++})`);
        queryParams.push(`%${search}%`);
    }
    if (jobTitle) {
        whereClauses.push(`e.position_name ILIKE $${paramIndex++}`);
        queryParams.push(`%${jobTitle}%`);
    }
    if (manager) {
        // Use the 'manager' alias here
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

    const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

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
            e.created_at
        FROM employees e
        LEFT JOIN employees manager ON e.manager_id = manager.id
        LEFT JOIN legal_entities le ON e.legal_entity_id = le.id
        LEFT JOIN office_locations ol ON e.office_location_id = ol.id
        LEFT JOIN employee_types et ON e.employee_type_id = et.id
        LEFT JOIN employee_sub_types est ON e.employee_sub_type_id = est.id
        ${whereCondition}
        ORDER BY e.first_name, e.last_name;
    `;
    
    const { rows } = await db.query(query, queryParams);
    return rows;
};

const updateEmployee = async (employeeId, updatedData, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        if (typeof updatedData.manager_email !== 'undefined') {
            const managerEmail = updatedData.manager_email;
            if (managerEmail === '' || managerEmail === null) {
                updatedData.manager_id = null;
            } else {
                const managerResult = await client.query('SELECT id FROM employees WHERE employee_email = $1', [managerEmail]);
                if (managerResult.rows.length > 0) {
                    updatedData.manager_id = managerResult.rows[0].id;
                } else {
                    throw new Error(`Manager with email "${managerEmail}" not found.`);
                }
            }
            delete updatedData.manager_email;
        }

        const beforeResult = await client.query('SELECT * FROM employees WHERE id = $1 FOR UPDATE', [employeeId]);
        if (beforeResult.rows.length === 0) throw new Error('Employee not found');
        
        const originalEmployee = beforeResult.rows[0];
        const changes = {};
        for (const key in updatedData) {
            if (Object.prototype.hasOwnProperty.call(updatedData, key) && String(updatedData[key] ?? '') !== String(originalEmployee[key] ?? '')) {
                changes[key] = updatedData[key] === '' ? null : updatedData[key];
            }
        }
        
        if (Object.keys(changes).length === 0) {
            await client.query('ROLLBACK');
            return { message: "No changes were made.", employee: await getEmployeeById(employeeId) };
        }

        const setClauses = Object.keys(changes).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
        const values = Object.values(changes);
        
        await client.query(`UPDATE employees SET ${setClauses} WHERE id = $1`, [employeeId, ...values]);

        const logChanges = {};
        for (const key in changes) {
            let fromValue = originalEmployee[key];
            let toValue = changes[key];

            if (fromValue instanceof Date) {
                fromValue = fromValue.toISOString().split('T')[0];
            }
            if (toValue instanceof Date) {
                toValue = toValue.toISOString().split('T')[0];
            }
            
            logChanges[key] = { from: fromValue, to: toValue };
        }
        await logActivity(actorId, 'EMPLOYEE_UPDATE', { targetEmployeeId: employeeId, changes: logChanges }, reqContext, client);

        await client.query('COMMIT');
        
        const updatedEmployee = await getEmployeeById(employeeId);
        return { message: 'Employee updated successfully', employee: updatedEmployee };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const createEmployeeFromTicket = async (ticketData, actorId, reqContext) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const requiredFields = ['first_name', 'last_name', 'employee_email'];
        for (const field of requiredFields) {
            if (!ticketData[field]) {
                throw new Error(`Missing required field from ticket data: ${field}`);
            }
        }
        
        const existingEmployee = await client.query('SELECT id FROM employees WHERE employee_email ILIKE $1', [ticketData.employee_email]);
        if (existingEmployee.rows.length > 0) {
            throw new Error(`An employee with the email ${ticketData.employee_email} already exists.`);
        }

        const resolvedIds = {};
        
        if (ticketData.manager_email) {
            const result = await client.query('SELECT id FROM employees WHERE employee_email ILIKE $1', [ticketData.manager_email]);
            if (result.rows.length === 0) throw new Error(`Manager not found with email: ${ticketData.manager_email}`);
            resolvedIds.manager_id = result.rows[0].id;
        }

        if (ticketData.legal_entity_name) {
            const result = await client.query('SELECT id FROM legal_entities WHERE name ILIKE $1', [ticketData.legal_entity_name]);
            if (result.rows.length === 0) throw new Error(`Legal Entity not found with name: ${ticketData.legal_entity_name}`);
            resolvedIds.legal_entity_id = result.rows[0].id;
        }
        
        if (ticketData.office_location_name) {
            const result = await client.query('SELECT id FROM office_locations WHERE name ILIKE $1', [ticketData.office_location_name]);
            if (result.rows.length === 0) throw new Error(`Office Location not found with name: ${ticketData.office_location_name}`);
            resolvedIds.office_location_id = result.rows[0].id;
        }
        
        if (ticketData.employee_type_name) {
            const result = await client.query('SELECT id FROM employee_types WHERE name ILIKE $1', [ticketData.employee_type_name]);
            if (result.rows.length === 0) throw new Error(`Employee Type not found with name: ${ticketData.employee_type_name}`);
            resolvedIds.employee_type_id = result.rows[0].id;
        }

        if (ticketData.employee_sub_type_name) {
            const result = await client.query('SELECT id FROM employee_sub_types WHERE name ILIKE $1', [ticketData.employee_sub_type_name]);
            if (result.rows.length === 0) throw new Error(`Employee Sub-Type not found with name: ${ticketData.employee_sub_type_name}`);
            resolvedIds.employee_sub_type_id = result.rows[0].id;
        }

        const finalData = { ...ticketData, ...resolvedIds };
        
        const allowedFields = [
            'first_name', 'last_name', 'middle_name', 'employee_email',
            'position_name', 'position_level', 'join_date', 'asset_name',
            'onboarding_ticket', 'legal_entity_id', 'office_location_id',
            'employee_type_id', 'employee_sub_type_id', 'manager_id'
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
            INSERT INTO employees (${columns.join(', ')})
            VALUES (${valuePlaceholders.join(', ')})
            RETURNING id;
        `;
        
        const result = await client.query(query, values);
        const newEmployeeId = result.rows[0].id;

        await logActivity(
            actorId,
            'EMPLOYEE_CREATE',
            {
                targetEmployeeId: newEmployeeId,
                details: { ...ticketData, source_ticket: ticketData.onboarding_ticket }
            },
            reqContext,
            client
        );

        await client.query('COMMIT');
        
        return { message: 'Employee created successfully from ticket.', employeeId: newEmployeeId };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const updateOffboardingFromTicket = async (ticketData, actorId, reqContext) => {
    const { employee_email, date_of_exit, access_cut_off_date, offboarding_ticket } = ticketData;

    if (!employee_email) {
        throw new Error('Required field "employee_email" is missing from the request body.');
    }
    if (!date_of_exit || !access_cut_off_date) {
        throw new Error('Missing required fields: date_of_exit and access_cut_off_date are required.');
    }

    const employeeResult = await db.query('SELECT id FROM employees WHERE employee_email = $1', [employee_email]);
    if (employeeResult.rows.length === 0) {
        throw new Error(`Employee not found with email: ${employee_email}`);
    }
    const employeeId = employeeResult.rows[0].id;

    const updatedData = {
        date_of_exit_at_date: date_of_exit,
        access_cut_off_date_at_date: access_cut_off_date,
        offboarding_ticket: offboarding_ticket,
        is_active: false
    };
    
    return await updateEmployee(employeeId, updatedData, actorId, reqContext);
};

const getPlatformStatuses = async (employeeId) => {
    const employeeRes = await db.query('SELECT employee_email FROM employees WHERE id = $1', [employeeId]);
    if (employeeRes.rows.length === 0) throw new Error('Employee not found.');
    const email = employeeRes.rows[0].employee_email;
    
    const platformPromises = [
        googleWorkspaceService.getUserStatus(email),
        slackService.getUserStatus(email),
        jumpcloudService.getUserStatus(email),
        atlassianService.getUserStatus(email)
    ];
    
    const results = await Promise.allSettled(platformPromises);
    return results.map(result => {
        if (result.status === 'fulfilled') return result.value;
        console.error("Platform status check failed:", result.reason.message);
        return { platform: 'Unknown', status: 'Error', message: 'Failed to fetch status.' };
    });
};

const getJumpCloudLogs = async (employeeId) => {
    if (!process.env.JUMPCLOUD_API_KEY) throw new Error("Server configuration error for JumpCloud.");
    
    const employeeEmailRes = await db.query('SELECT employee_email FROM employees WHERE id = $1', [employeeId]);
    if (employeeEmailRes.rows.length === 0) throw new Error('Employee not found.');
    
    const email = employeeEmailRes.rows[0].employee_email;
    const findUserUrl = `https://console.jumpcloud.com/api/systemusers?filter=email:eq:${encodeURIComponent(email)}`;
    const findUserResponse = await fetch(findUserUrl, { headers: { 'x-api-key': process.env.JUMPCLOUD_API_KEY, 'Accept': 'application/json' } });
    if (!findUserResponse.ok) throw new Error(`JumpCloud API Error: ${findUserResponse.status}.`);
    
    const { results: users } = await findUserResponse.json();
    if (!users || users.length === 0) return [];
    if (!users[0].username) return [];

    const eventsUrl = 'https://api.jumpcloud.com/insights/directory/v1/events';
    const startTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const body = JSON.stringify({ service: ["all"], start_time: startTime, sort: "DESC", search_term: { and: [{ "username": users[0].username }] } });
    
    const eventsResponse = await fetch(eventsUrl, { method: 'POST', headers: { 'x-api-key': process.env.JUMPCLOUD_API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body });
    if (!eventsResponse.ok) throw new Error(`JumpCloud Events API Error: ${eventsResponse.status}.`);
    
    return eventsResponse.json();
};

const getGoogleLogs = async (employeeId) => {
    const employeeRes = await db.query('SELECT employee_email FROM employees WHERE id = $1', [employeeId]);
    if (employeeRes.rows.length === 0) throw new Error('Employee not found.');
    const email = employeeRes.rows[0].employee_email;
    return await googleWorkspaceService.getLoginEvents(email);
};

const getSlackLogs = async (employeeId) => {
    const employeeRes = await db.query('SELECT employee_email FROM employees WHERE id = $1', [employeeId]);
    if (employeeRes.rows.length === 0) throw new Error('Employee not found.');
    const email = employeeRes.rows[0].employee_email;
    return await slackService.getAuditLogs(email);
};

const getUnifiedTimeline = async (employeeId) => {
    return [];
};

const deactivateOnPlatforms = async (employeeId, platforms, actorId, reqContext) => {
    const employeeRes = await db.query('SELECT employee_email FROM employees WHERE id = $1', [employeeId]);
    if (employeeRes.rows.length === 0) throw new Error('Employee not found.');
    
    const email = employeeRes.rows[0].employee_email;
    const deactivation_results = [];
    const platformMap = {
        jumpcloud: jumpcloudService.suspendUser,
        google: googleWorkspaceService.suspendUser,
        slack: slackService.deactivateUser,
        atlassian: atlassianService.deactivateUser
    };
    
    for (const platform of platforms) {
        if (platformMap[platform]) {
            const result = await platformMap[platform](email);
            deactivation_results.push({ platform, status: result.success ? 'SUCCESS' : 'FAILED', message: result.message });
        }
    }
    
    await logActivity(actorId, 'MANUAL_PLATFORM_SUSPENSION', { targetEmployeeId: employeeId, deactivation_results }, reqContext);
    return { message: 'Suspension process completed.', results: deactivation_results };
};

const bulkDeactivateOnPlatforms = async (employeeIds, platforms, actorId, reqContext) => {
    const results = [];
    for (const employeeId of employeeIds) {
        try {
            const result = await deactivateOnPlatforms(employeeId, platforms, actorId, reqContext);
            results.push({ employeeId, success: true, message: result.message });
        } catch(error) {
            results.push({ employeeId, success: false, message: error.message });
        }
    }
    return { message: 'Bulk suspension process completed.', results };
};

const getEmployeeOptions = async (tableName) => {
    if (!/^[a-z_]+$/.test(tableName)) {
        throw new Error('Invalid table name.');
    }
    const result = await db.query(`SELECT id, name FROM ${tableName} ORDER BY name`);
    return result.rows;
};

const createApplicationAccess = async (ticketData, actorId, reqContext) => {
    const { employee_email, application_name, role, jira_ticket } = ticketData;

    if (!employee_email || !application_name) {
        throw new Error('Missing required fields: employee_email and application_name are required.');
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const employeeResult = await client.query('SELECT id FROM employees WHERE employee_email ILIKE $1', [employee_email]);
        if (employeeResult.rows.length === 0) throw new Error(`Employee not found with email: ${employee_email}`);
        const employeeId = employeeResult.rows[0].id;

        const applicationResult = await client.query('SELECT id FROM internal_applications WHERE name ILIKE $1', [application_name]);
        if (applicationResult.rows.length === 0) throw new Error(`Internal application not found with name: ${application_name}`);
        const applicationId = applicationResult.rows[0].id;

        const query = `
            INSERT INTO employee_application_access (employee_id, application_id, role, jira_ticket)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (employee_id, application_id) DO UPDATE SET
                role = EXCLUDED.role,
                jira_ticket = EXCLUDED.jira_ticket;
        `;
        await client.query(query, [employeeId, applicationId, role, jira_ticket]);

        await logActivity(
            actorId,
            'APPLICATION_ACCESS_CREATE',
            {
                targetEmployeeId: employeeId,
                details: { application: application_name, role: role, source_ticket: jira_ticket }
            },
            reqContext,
            client
        );

        await client.query('COMMIT');
        return { message: `Access to ${application_name} successfully recorded for ${employee_email}.` };

    } catch (err) {
        await client.query('ROLLBACK');
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
    getJumpCloudLogs,
    deactivateOnPlatforms,
    getEmployeeOptions,
    getGoogleLogs,
    getSlackLogs,
    getUnifiedTimeline,
    bulkDeactivateOnPlatforms,
    createEmployeeFromTicket,
    updateOffboardingFromTicket,
    createApplicationAccess,
};