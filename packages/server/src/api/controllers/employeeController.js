const employeeService = require('../../services/employeeService');
const { logActivity } = require('../../services/logService');

const listEmployees = async (req, res, next) => {
    try {
        const result = await employeeService.getEmployees(req.query);
        res.json(result);
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
        const result = await employeeService.updateEmployee(id, req.body, req.user.id);
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

const deactivateOnPlatforms = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { platforms } = req.body;
        const result = await employeeService.deactivateOnPlatforms(id, platforms, req.user.id);
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
        await logActivity(req.user.id, 'EMPLOYEE_PROFILE_VIEW', targetEmployeeId);
        res.status(200).json({ message: 'View logged successfully.' });
    } catch (error) {
        next(error);
    }
};

const getEmployeeOptions = async (req, res, next) => {
    try {
        // The parameter should match the route definition, e.g., /options/:tableName
        const tableName = req.params.table || req.params.tableName;
        if (!tableName) return res.status(400).json({ message: 'Table name parameter is missing.'});

        const options = await employeeService.getEmployeeOptions(tableName);
        res.json(options);
    } catch (error) {
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
    getEmployeeOptions
};