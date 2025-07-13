// packages/client/src/pages/EmployeeDetailPage/LicensesTab.js
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/api";
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from "lucide-react";

const fetchLicenseDetails = async (employeeId) => {
  const { data } = await api.get(`/api/employees/${employeeId}/licenses`);
  return data;
};

const platformDisplayNames = {
  google: "Google Workspace",
  jumpcloud: "JumpCloud",
  slack: "Slack",
  atlassian: "Atlassian (Jira/Confluence)",
};

const LicenseStatusIndicator = ({ status }) => {
  switch (status) {
    case "Licensed":
    case "Active":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "Not Licensed":
    case "Suspended":
    case "Deactivated":
    case "Inactive":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "Error":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    default:
      return <HelpCircle className="w-5 h-5 text-gray-400" />;
  }
};

const LicenseDetail = ({ platform, license }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center">
        <LicenseStatusIndicator status={license.status} />
        <div className="ml-3">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {platformDisplayNames[platform]}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {license.status}
          </p>
        </div>
      </div>
      {license.details && Object.keys(license.details).length > 0 && (
        <div className="text-right text-sm">
          {license.details.is_guest && (
            <span className="font-medium text-blue-500">Guest Account</span>
          )}
          {license.details.products &&
            license.details.products.map((p) => (
              <div key={p} className="text-gray-500">
                {p}
              </div>
            ))}
          {Array.isArray(license.details) &&
            license.details.map((d) => (
              <div key={d.sku} className="text-gray-500">
                {d.plan}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export const LicensesTab = ({ employeeId }) => {
  const {
    data: licenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employeeLicenses", employeeId],
    queryFn: () => fetchLicenseDetails(employeeId),
  });

  if (isLoading) {
    return <div className="text-center p-6">Loading license details...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-500">
        Could not fetch license details.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-4">
        {licenses.map((license) => (
          <LicenseDetail
            key={license.platform}
            platform={license.platform}
            license={license}
          />
        ))}
      </div>
    </div>
  );
};
