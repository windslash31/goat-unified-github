const employeeService = require("./employeeService");
const atlassianService = require("./atlassianService");

/**
 * This file defines the tools (functions) that the AI model can call to answer user queries.
 */

const getEmployeeDetails = async ({ email }) => {
  try {
    const employees = await employeeService.getEmployees({ search: email });
    if (employees.employees.length === 0) {
      return { error: `An employee with the email '${email}' was not found.` };
    }
    const employeeId = employees.employees[0].id;
    const fullDetails = await employeeService.getEmployeeById(employeeId);

    // Create a clean, summarized object to return to the model.
    // This avoids sending complex data and reduces token usage.
    return {
      id: fullDetails.id,
      fullName: `${fullDetails.first_name} ${fullDetails.last_name}`,
      email: fullDetails.employee_email,
      position: fullDetails.position_name || "N/A",
      status: fullDetails.status || "N/A",
      managerEmail: fullDetails.manager_email || "N/A",
      applications:
        fullDetails.applications?.map((app) => app.name).join(", ") || "None",
    };
  } catch (error) {
    console.error("AI Tool Error (getEmployeeDetails):", error);
    return {
      error: "An internal error occurred while retrieving employee details.",
    };
  }
};

const getJiraTicket = async ({ ticketId }) => {
  try {
    const details = await atlassianService.getTicketDetails(ticketId);
    // Ensure a clean object is returned.
    return details || { error: `Ticket '${ticketId}' was not found.` };
  } catch (error) {
    console.error("AI Tool Error (getJiraTicket):", error);
    if (error.message.includes("not found")) {
      return { error: `Jira ticket '${ticketId}' was not found.` };
    }
    return {
      error: "An internal error occurred while retrieving the Jira ticket.",
    };
  }
};

const tools = {
  getEmployeeDetails,
  getJiraTicket,
};

// Tool definitions remain the same
const toolDefinitions = [
  {
    name: "getEmployeeDetails",
    description:
      "Get detailed information about a specific employee using their email address.",
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The email address of the employee to look up.",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "getJiraTicket",
    description: "Get information about a specific Jira ticket by its ID.",
    parameters: {
      type: "object",
      properties: {
        ticketId: {
          type: "string",
          description: "The ID of the Jira ticket (e.g., 'PROJ-123').",
        },
      },
      required: ["ticketId"],
    },
  },
];

module.exports = {
  tools,
  toolDefinitions,
};
