// Helper to safely get a value from a nested object
const get = (obj, path, defaultValue = null) => {
  const value = path.split(".").reduce((a, b) => (a ? a[b] : undefined), obj);
  return value !== undefined ? value : defaultValue;
};

// Mapper for Employee Offboarding
const mapEmployeeOffboardingFields = (employeeDetails, assetDetails) => ({
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
        { label: "Email", value: get(employeeDetails, "employeeEmail") },
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
    {
      title: "Asset Details",
      fields: [
        {
          label: "Assigned Laptop",
          ...(get(assetDetails, "assignedLaptop") ?? {}),
          type: "asset",
        },
      ],
    },
  ],
});

// Mapper for Employee Onboarding
const mapEmployeeOnboardingFields = (employeeDetails, assetDetails) => ({
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
        {
          label: "Employee Email",
          value: get(employeeDetails, "employeeEmail"),
        },
        { label: "Manager Email", value: get(employeeDetails, "managerEmail") },
        {
          label: "Join Date",
          value: get(employeeDetails, "joinDate"),
          type: "date",
        },
      ],
    },
    {
      title: "Job Details",
      fields: [
        { label: "Position", value: get(employeeDetails, "position") },
        { label: "Legal Entity", value: get(employeeDetails, "legalEntity") },
        {
          label: "Employment Type",
          value: get(employeeDetails, "employmentType"),
        },
        {
          label: "Employee Sub-Type",
          value: get(employeeDetails, "employeeSubType"),
        },
        {
          label: "Office Location",
          value: get(employeeDetails, "officeLocation"),
        },
      ],
    },
    {
      title: "Asset Assignment",
      fields: [
        { label: "Laptop Type", value: get(employeeDetails, "laptopType") },
        {
          label: "Assigned Laptop",
          ...get(assetDetails, "assignedLaptop"),
          type: "asset",
        },
      ],
    },
  ],
});

// Mapper for DB-level tasks
const mapDbTaskFields = (employeeDetails) => ({
  title: `Database Task`,
  sections: [
    {
      title: "Target User",
      fields: [
        {
          label: "Employee Email",
          value: get(employeeDetails, "employeeEmail"),
        },
      ],
    },
    {
      title: "Task Details",
      fields: [
        {
          label: "Effective Date",
          value:
            get(employeeDetails, "joinDate") ||
            get(employeeDetails, "accessCutoffDate"),
          type: "date",
        },
      ],
    },
  ],
});

// --- Main Export: The Strategy Map ---
export const JIRA_ISSUE_TYPE_MAPPERS = {
  // These keys now correctly match all your issue types
  "Employee Offboarding": (data) =>
    mapEmployeeOffboardingFields(data.employee_details, data.asset_details),
  "DB Offboarding": (data) => mapDbTaskFields(data.employee_details),
  "Employee onboarding": (data) =>
    mapEmployeeOnboardingFields(data.employee_details, data.asset_details),
  "DB Onboarding": (data) =>
    mapEmployeeOnboardingFields(data.employee_details, data.asset_details),
};
