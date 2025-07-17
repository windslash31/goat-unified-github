import React, { memo } from "react";
import { Ticket } from "lucide-react";
import { PLATFORM_CONFIG } from "../../config/platforms";
import { formatDistanceToNow } from "date-fns";

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
  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-md bg-gray-300 dark:bg-gray-700"></div>
      <div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32 mt-1"></div>
      </div>
    </div>
    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
  </div>
);

export const EmployeeApplicationsTab = memo(
  ({ applications, platformStatuses, isLoading, onTicketClick }) => {
    return (
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Platform Access Status
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Live status of the employee's account on integrated external
            platforms.
          </p>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
              </>
            ) : (
              // --- START: MODIFIED PLATFORM STATUS RENDERING ---
              platformStatuses.map((platform) => {
                // Use platform_name from the backend, and get the logo from the config
                const platformConfig =
                  PLATFORM_CONFIG[platform.platform_name] ||
                  PLATFORM_CONFIG.Default;
                const lastSyncTime = platform.last_synced_at
                  ? formatDistanceToNow(new Date(platform.last_synced_at), {
                      addSuffix: true,
                    })
                  : "never";

                return (
                  <div
                    key={platform.platform_name}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                  >
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
                    <PlatformStatusBadge status={platform.status} />
                  </div>
                );
              })
              // --- END: MODIFIED PLATFORM STATUS RENDERING ---
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
