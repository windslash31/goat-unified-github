import React, { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/api";
import { Ticket, ChevronRight, RefreshCw } from "lucide-react";
import { PLATFORM_CONFIG } from "../../config/platforms";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const PlatformStatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    Suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    Deactivated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Not Found":
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    Error:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };
  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${
        styles[status] || styles["Error"]
      }`}
    >
      {status}
    </span>
  );
};

const PlatformRowSkeleton = () => (
  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-md bg-gray-300 dark:bg-gray-700"></div>
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32 mt-1"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => {
  if (value === null || typeof value === "undefined" || value === "")
    return null;
  return (
    <div className="grid grid-cols-3 gap-4 text-xs">
      <span className="col-span-1 text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="col-span-2 font-medium text-gray-800 dark:text-gray-200 break-words">
        {String(value)}
      </span>
    </div>
  );
};

const PlatformDetailView = ({ platformName, details }) => {
  if (!details || Object.keys(details).length === 0) {
    return (
      <div className="text-center text-xs text-gray-500 pt-3">
        No additional details available.
      </div>
    );
  }

  let content;
  switch (platformName) {
    case "Google":
      content = (
        <>
          <DetailRow label="Is Admin" value={details.isAdmin ? "Yes" : "No"} />
          <DetailRow
            label="Is Delegated Admin"
            value={details.isDelegatedAdmin ? "Yes" : "No"}
          />
          <DetailRow label="Org Unit Path" value={details.orgUnitPath} />
          <DetailRow
            label="Last Login"
            value={
              details.lastLoginTime
                ? new Date(details.lastLoginTime).toLocaleString()
                : "N/A"
            }
          />
          <DetailRow label="Aliases" value={details.aliases?.join(", ")} />
        </>
      );
      break;
    case "Slack":
      content = (
        <>
          <DetailRow label="User ID" value={details.id} />
          <DetailRow label="Is Admin" value={details.is_admin ? "Yes" : "No"} />
          <DetailRow label="Is Owner" value={details.is_owner ? "Yes" : "No"} />
          <DetailRow
            label="Is Guest"
            value={
              details.is_restricted || details.is_ultra_restricted
                ? "Yes"
                : "No"
            }
          />
        </>
      );
      break;
    case "Atlassian":
      content = (
        <>
          <DetailRow label="Account ID" value={details.accountId} />
          <DetailRow label="Account Type" value={details.accountType} />
        </>
      );
      break;
    case "JumpCloud":
      content = (
        <>
          <DetailRow label="Username" value={details.username} />
          <DetailRow label="User ID" value={details.id} />
          <DetailRow label="Job Title" value={details.jobTitle} />
          <DetailRow label="Department" value={details.department} />
        </>
      );
      break;
    default:
      content = (
        <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>
      );
  }

  return <div className="space-y-2">{content}</div>;
};

export const EmployeeApplicationsTab = memo(
  ({
    employeeId,
    applications,
    platformStatuses,
    isLoading,
    onTicketClick,
  }) => {
    const [expandedPlatform, setExpandedPlatform] = useState(null);
    const queryClient = useQueryClient();

    const { mutate: syncPlatformStatus, isPending: isSyncing } = useMutation({
      mutationFn: () => api.post(`/api/employees/${employeeId}/sync-status`),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["employee", String(employeeId)],
        });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      },
      onError: (error) => {
        console.error("Failed to sync platform statuses:", error);
      },
    });

    const togglePlatformExpansion = (platformName) => {
      setExpandedPlatform(
        expandedPlatform === platformName ? null : platformName
      );
    };

    return (
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Platform Access Status
            </h3>
            <button
              onClick={() => syncPlatformStatus()}
              disabled={isSyncing}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-kredivo-primary hover:bg-kredivo-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kredivo-primary disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "Syncing..." : "Sync"}
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Live status of the employee's account on integrated external
            platforms.
          </p>
          <div className="space-y-2">
            {isLoading ? (
              <>
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
              </>
            ) : (
              platformStatuses.map((platform) => {
                const isExpanded = expandedPlatform === platform.platform_name;
                const platformConfig =
                  PLATFORM_CONFIG[platform.platform_name] ||
                  PLATFORM_CONFIG.Default;
                const lastSyncTime = platform.last_synced_at
                  ? formatDistanceToNow(new Date(platform.last_synced_at), {
                      addSuffix: true,
                    })
                  : "never";
                const hasDetails =
                  platform.details &&
                  Object.keys(platform.details).length > 0 &&
                  !platform.details.error;

                return (
                  <div
                    key={platform.platform_name}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                  >
                    <button
                      onClick={() =>
                        hasDetails &&
                        togglePlatformExpansion(platform.platform_name)
                      }
                      className="w-full text-left"
                      disabled={!hasDetails}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={platformConfig.logo}
                            alt={`${platform.platform_name} Logo`}
                            className="w-8 h-8"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {platform.platform_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              Last synced: {lastSyncTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <PlatformStatusBadge status={platform.status} />
                          {hasDetails && (
                            <ChevronRight
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            marginTop: "12px",
                          }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-12"
                        >
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <PlatformDetailView
                              platformName={platform.platform_name}
                              details={platform.details}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Internal Application Access
          </h3>
          {!applications || applications.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No internal application access records found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {applications.map((app) => (
                <div
                  key={app.name}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50"
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {app.name}
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Role:</span> {app.role}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium">Request:</span>
                    {app.jira_ticket ? (
                      <button
                        onClick={() => onTicketClick(app.jira_ticket)}
                        className="text-kredivo-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        <Ticket className="w-4 h-4" />
                        {app.jira_ticket}
                      </button>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
