import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  AlertCircle,
  Cpu,
  User,
  PenSquare,
  ChevronDown,
  Loader,
} from "lucide-react";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";

// Helper to fetch detailed data for a specific platform
const fetchAccessDetails = async (employeeId, platformKey) => {
  const platformRouteKey = {
    "Google Workspace": "google",
    Slack: "slack",
    JumpCloud: "jumpcloud",
    Atlassian: "atlassian",
  }[platformKey];

  if (!platformRouteKey) return null;

  const { data } = await api.get(
    `/api/employees/${employeeId}/access-details/${platformRouteKey}`
  );
  return data;
};

// Detail View Component
const DetailView = ({ employeeId, applicationName }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["accessDetails", employeeId, applicationName],
    queryFn: () => fetchAccessDetails(employeeId, applicationName),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader size={20} className="animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-xs text-red-500">Could not load details.</div>
    );

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-900/70 rounded-lg shadow-inner mt-3">
      <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">
        Access Details
      </h4>
      <pre className="text-xs whitespace-pre-wrap font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

// A helper to render the source badge
const SourceBadge = ({ mode }) => {
  const styles = {
    API_INTEGRATED: {
      icon: <Cpu size={12} />,
      label: "API Synced",
      classes: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    MANUAL_INTERNAL: {
      icon: <User size={12} />,
      label: "Manual",
      classes: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    },
    MANUAL_LICENSED: {
      icon: <PenSquare size={12} />,
      label: "Manual License",
      classes:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
  };
  const style = styles[mode] || styles.MANUAL_INTERNAL;
  return (
    <span
      className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${style.classes}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
};

// Main component for the tab
export const EmployeeAccessTab = ({ employee }) => {
  const [expandedAccountId, setExpandedAccountId] = useState(null);

  // --- CHANGE START ---
  // The old, incorrect logic is removed. We now calculate the total cost
  // directly from the `provisioned_accounts` array that the API provides.
  const totalCost = (employee.provisioned_accounts || []).reduce(
    (sum, account) => sum + parseFloat(account.cost || 0),
    0
  );

  const provisionedAccounts = employee.provisioned_accounts || [];
  // --- CHANGE END ---

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-kredivo-light text-kredivo-primary rounded-lg p-3">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Assigned License Cost
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalCost.toFixed(2)}
              <span className="text-base font-medium text-gray-500">/mo</span>
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Provisioned Accounts ({provisionedAccounts.length})
        </h3>
        {provisionedAccounts.length > 0 ? (
          <div className="space-y-3">
            {provisionedAccounts.map((account) => {
              const isExpanded = expandedAccountId === account.account_id;

              return (
                <div
                  key={account.account_id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer"
                    onClick={() =>
                      setExpandedAccountId(
                        isExpanded ? null : account.account_id
                      )
                    }
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {account.application_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Instance: {account.instance_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <SourceBadge mode={account.integration_mode} />

                      {/* --- CHANGE START --- */}
                      {/* This logic now directly reads the `cost` and `tier_name` from the account object */}
                      {account.cost ? (
                        <div className="text-sm text-right">
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${parseFloat(account.cost).toFixed(2)}/mo
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {account.tier_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No License Cost
                        </span>
                      )}
                      {/* --- CHANGE END --- */}

                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                          account.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {account.status}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <DetailView
                          employeeId={employee.id}
                          applicationName={account.application_name}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <AlertCircle className="mx-auto w-12 h-12 text-gray-400" />
            <p className="font-semibold mt-4">No Provisioned Accounts</p>
            <p className="text-sm mt-1">
              This employee has no application accounts detected by the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
