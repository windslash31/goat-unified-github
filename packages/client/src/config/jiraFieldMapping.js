// This file now maps fields from the *simplified* data object sent by your backend.

// Helper to safely get a value. Since the object is flat, this is simpler.
const get = (obj, path, defaultValue = null) => {
  return obj[path] !== undefined ? obj[path] : defaultValue;
};

// --- Mapper for Employee Offboarding ---
const mapEmployeeOffboardingFields = (employeeDetails) => ({
  title: "Employee Offboarding Details",
  sections: [
    {
      title: "Employee Information",
      fields: [
        {
          label: "Full Name",
          value: [
            get(employeeDetails, "firstName"),
            get(employeeDetails, "lastName"),
          ]
            .filter(Boolean)
            .join(" "),
        },
        { label: "Email", value: get(employeeDetails, "email") },
        { label: "Position", value: get(employeeDetails, "position") },
        { label: "Manager Email", value: get(employeeDetails, "managerEmail") },
      ],
    },
    {
      title: "Offboarding Timeline",
      fields: [
        {
          label: "Resignation Date",
          value: get(employeeDetails, "resignationDate"),
          type: "date",
        },
        {
          label: "Access Cut-off Date",
          value: get(employeeDetails, "accessCutoffDate"),
          type: "date",
        },
      ],
    },
  ],
});

// --- Mapper for Employee Onboarding ---
const mapEmployeeOnboardingFields = (employeeDetails) => ({
  title: "Employee Onboarding Details",
  sections: [
    {
      title: "New Hire Information",
      fields: [
        {
          label: "Full Name",
          value: [
            get(employeeDetails, "firstName"),
            get(employeeDetails, "lastName"),
          ]
            .filter(Boolean)
            .join(" "),
        },
        { label: "Email", value: get(employeeDetails, "email") },
        { label: "Position", value: get(employeeDetails, "position") },
        { label: "Manager Email", value: get(employeeDetails, "managerEmail") },
      ],
    },
  ],
});

// --- Main Export: The Strategy Map ---
export const JIRA_ISSUE_TYPE_MAPPERS = {
  // These keys should match the 'issueType' string from your backend's response
  "Employee Offboarding": (data) =>
    mapEmployeeOffboardingFields(data.employee_details),
  "DB Offboarding": (data) =>
    mapEmployeeOffboardingFields(data.employee_details),
  "Employee Onboarding": (data) =>
    mapEmployeeOnboardingFields(data.employee_details),
  "DB Onboarding": (data) => mapEmployeeOnboardingFields(data.employee_details),
};
