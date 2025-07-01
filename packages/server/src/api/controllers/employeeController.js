const employeeService = require('../../services/employeeService');
const { logActivity } = require('../../services/logService');
const { Parser } = require('json2csv');

const listEmployees = async (req, res, next) => {
    try {
        const result = await employeeService.getEmployees(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// --- NEW CONTROLLER FUNCTION ---
const exportEmployees = async (req, res, next) => {
    try {
        const employees = await employeeService.getEmployeesForExport(req.query);
        
        const fields = [
            'id', 'first_name', 'middle_name', 'last_name', 'employee_email', 'status',
            'position_name', 'position_level', 'manager_email', 'legal_entity',
            'office_location', 'employee_type', 'employee_sub_type', 'join_date',
            'date_of_exit_at_date', 'access_cut_off_date_at_date', 'created_at',
            'application_access'
        ];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(employees);

        res.header('Content-Type', 'text/csv');
        res.attachment('employees.csv');
        res.send(csv);
    } catch (error) {
        next(error);
    }
};

const getEmployee = async (req, res, next) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found." });
        }
        res.json(employee);
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await employeeService.updateEmployee(id, req.body, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        if(error.message.includes('not found')){
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const getPlatformStatuses = async (req, res, next) => {
    try {
        const statuses = await employeeService.getPlatformStatuses(req.params.id);
        res.json(statuses);
    } catch (error) {
        next(error);
    }
};

const getJumpCloudLogs = async (req, res, next) => {
    try {
        const logs = await employeeService.getJumpCloudLogs(req.params.id);
        res.json(logs);
    } catch (error) {
        if(error.message.includes('not found')){
            return res.status(404).json({ message: error.message });
        }
        if(error.message.includes('API Error')){
            return res.status(502).json({ message: error.message });
        }
        next(error);
    }
};

const getEmployeeOptions = async (req, res, next) => {
    try {
        const tableName = req.params.table || req.params.tableName;
        if (!tableName) return res.status(400).json({ message: 'Table name parameter is missing.'});

        const options = await employeeService.getEmployeeOptions(tableName);
        res.json(options);
    } catch (error) {
        next(error);
    }
};

const getGoogleLogs = async (req, res, next) => {
    try {
        const logs = await employeeService.getGoogleLogs(req.params.id);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

const getSlackLogs = async (req, res, next) => {
    try {
        const logs = await employeeService.getSlackLogs(req.params.id);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};

const getUnifiedTimeline = async (req, res, next) => {
    try {
        const events = await employeeService.getUnifiedTimeline(req.params.id);
        res.json(events);
    } catch(error) {
        next(error);
    }
}

const deactivateOnPlatforms = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { platforms } = req.body;
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await employeeService.deactivateOnPlatforms(id, platforms, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const bulkDeactivateOnPlatforms = async (req, res, next) => {
    try {
        const { employeeIds, platforms } = req.body;
        if (!employeeIds || !platforms || !Array.isArray(employeeIds) || !Array.isArray(platforms)) {
            return res.status(400).json({ message: 'Invalid request body. `employeeIds` and `platforms` must be arrays.' });
        }
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        const result = await employeeService.bulkDeactivateOnPlatforms(employeeIds, platforms, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const logEmployeeView = async (req, res, next) => {
    try {
        const { targetEmployeeId } = req.body;
        if (!targetEmployeeId) {
            return res.status(400).json({ message: 'Target Employee ID is required.' });
        }
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'] };
        await logActivity(req.user.id, 'EMPLOYEE_PROFILE_VIEW', { targetEmployeeId }, reqContext);
        res.status(200).json({ message: 'View logged successfully.' });
    } catch (error) {
        next(error);
    }
};

const onboardFromTicket = async (req, res, next) => {
    try {
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'], source: 'n8n_onboard_workflow' };
        const result = await employeeService.createEmployeeFromTicket(req.body, req.user.id, reqContext);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const offboardFromTicket = async (req, res, next) => {
    try {
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'], source: 'n8n_offboard_workflow' };
        const result = await employeeService.updateOffboardingFromTicket(req.body, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        if (error.message.includes('Employee not found')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

const createApplicationAccess = async (req, res, next) => {
    try {
        const reqContext = { ip: req.ip, userAgent: req.headers['user-agent'], source: 'n8n_uar_workflow' };
        const result = await employeeService.createApplicationAccess(req.body, req.user.id, reqContext);
        res.status(200).json(result);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    listEmployees,
    getEmployee,
    updateEmployee,
    getPlatformStatuses,
    getJumpCloudLogs,
    deactivateOnPlatforms,
    logEmployeeView,
    getEmployeeOptions,
    getGoogleLogs,
    getSlackLogs,
    getUnifiedTimeline,
    bulkDeactivateOnPlatforms,
    onboardFromTicket,
    offboardFromTicket,
    createApplicationAccess,
    exportEmployees,
}