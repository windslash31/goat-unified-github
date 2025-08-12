import React, { useState } from "react";
import { EmployeeApplicationsTab } from "./EmployeeApplicationsTab";
import ApplicationAccessTab from "./ApplicationAccessTab";

// This component acts as a container with its own internal tabs
const ApplicationsTab = ({ employee, onTicketClick }) => {
  const [activeSubTab, setActiveSubTab] = useState("status");

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveSubTab(id)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeSubTab === id
          ? "bg-kredivo-light text-kredivo-dark-text"
          : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
        <TabButton id="status" label="Platform Status" />
        <TabButton id="detailed" label="Detailed Access" />
      </div>

      <div className="mt-4">
        {activeSubTab === "status" && (
          <EmployeeApplicationsTab
            employeeId={employee.id}
            applications={employee.applications || []}
            platformStatuses={employee.platform_statuses || []}
            onTicketClick={onTicketClick}
          />
        )}
        {activeSubTab === "detailed" && <ApplicationAccessTab />}
      </div>
    </div>
  );
};

export default ApplicationsTab;
