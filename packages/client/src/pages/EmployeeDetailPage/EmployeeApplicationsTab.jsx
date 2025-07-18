import React, { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/api";
import {
  Ticket,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Hash,
  Cpu,
  HardDrive,
  Monitor,
  Shield,
} from "lucide-react";
import { PLATFORM_CONFIG } from "../../config/platforms";
import { formatTimeAgo } from "../../utils/formatters";
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
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
        styles[status] || styles["Error"]
      }`}
    >
      {status}
    </span>
  );
};

const PlatformRowSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-md bg-gray-300 dark:bg-gray-700"></div>
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
    </div>
  </div>
);

const DetailItem = ({ label, value, isMono = false }) => {
  if (value === null || typeof value === "undefined" || value === "")
    return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2.5 px-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:col-span-1">
        {label}
      </dt>
      <dd
        className={`text-sm text-gray-800 dark:text-gray-200 sm:col-span-2 break-words ${
          isMono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
};

const DetailSectionHeader = ({ children }) => (
  <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 pb-1 border-b-2 border-kredivo-primary/50">
    {children}
  </h4>
);

const PlatformDetailView = ({ platformName, details }) => {
  if (!details || Object.keys(details).length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-4">
        No additional details available.
      </div>
    );
  }

  const formatBoolean = (value) =>
    value ? (
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
        <CheckCircle size={14} /> Yes
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
        <XCircle size={14} /> No
      </span>
    );

  let content;
  switch (platformName) {
    case "Google":
      content = (
        <>
          <DetailSectionHeader>Account Info</DetailSectionHeader>
          <DetailItem label="Is Admin" value={formatBoolean(details.isAdmin)} />
          <DetailItem
            label="Is Delegated Admin"
            value={formatBoolean(details.isDelegatedAdmin)}
          />
          <DetailItem label="Org Unit" value={details.orgUnitPath} />
          <DetailSectionHeader>Security</DetailSectionHeader>
          <DetailItem
            label="2-Step Verification"
            value={details.isEnrolledIn2Sv ? "Enrolled" : "Not Enrolled"}
          />
          <DetailItem
            label="Last Login"
            value={
              details.lastLoginTime
                ? new Date(details.lastLoginTime).toLocaleString()
                : "N/A"
            }
          />
        </>
      );
      break;
    case "Slack":
      content = (
        <>
          <DetailSectionHeader>Account Info</DetailSectionHeader>
          <DetailItem label="User ID" value={details.id} />
          <DetailSectionHeader>Permissions</DetailSectionHeader>
          <DetailItem
            label="Is Admin"
            value={formatBoolean(details.is_admin)}
          />
          <DetailItem
            label="Is Owner"
            value={formatBoolean(details.is_owner)}
          />
          <DetailItem
            label="Is Guest"
            value={formatBoolean(details.is_guest)}
          />
        </>
      );
      break;
    case "Atlassian":
      content = (
        <>
          <DetailSectionHeader>Account Info</DetailSectionHeader>
          <DetailItem label="Display Name" value={details.displayName} />
          <DetailItem label="Email" value={details.emailAddress} />
          <DetailItem label="Account ID" value={details.accountId} />
          <DetailItem label="Account Type" value={details.accountType} />
        </>
      );
      break;
    case "JumpCloud":
      content = (
        <>
          <DetailSectionHeader>Core User Identity</DetailSectionHeader>
          <DetailItem label="Username" value={details.coreIdentity?.username} />
          <DetailItem label="Email" value={details.coreIdentity?.email} />
          <DetailItem label="ID" value={details.coreIdentity?.id} isMono />

          <DetailSectionHeader>Account Status & Security</DetailSectionHeader>
          <DetailItem label="State" value={details.accountStatus?.state} />
          <DetailItem
            label="Activated"
            value={formatBoolean(details.accountStatus?.activated)}
          />
          <DetailItem
            label="Suspended"
            value={formatBoolean(details.accountStatus?.suspended)}
          />
          <DetailItem
            label="Account Locked"
            value={formatBoolean(details.accountStatus?.accountLocked)}
          />
          <DetailItem
            label="Password Expired"
            value={formatBoolean(details.accountStatus?.passwordExpired)}
          />
          <DetailItem
            label="MFA Status"
            value={details.accountStatus?.mfaStatus}
          />

          <DetailSectionHeader>Permissions & Access</DetailSectionHeader>
          <DetailItem
            label="Admin"
            value={formatBoolean(details.permissions?.isAdmin)}
          />
          <DetailItem
            label="Sudo Access"
            value={formatBoolean(details.permissions?.hasSudo)}
          />
          <DetailItem
            label="Tags"
            value={details.permissions?.tags?.join(", ")}
          />
        </>
      );
      break;
    default:
      content = (
        <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>
      );
  }

  return <dl className="space-y-1">{content}</dl>;
};

const PlatformStatusCard = memo(({ platform, isExpanded, onToggle }) => {
  const platformConfig =
    PLATFORM_CONFIG[platform.platform_name] || PLATFORM_CONFIG.Default;
  const lastSyncTime = formatTimeAgo(platform.last_synced_at);
  const hasDetails =
    platform.details &&
    Object.keys(platform.details).length > 0 &&
    !platform.details.error;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="w-full text-left"
        disabled={!hasDetails}
      >
        <div className="flex items-start gap-4">
          <img
            src={platformConfig.logo}
            alt={`${platform.platform_name} Logo`}
            className="w-8 h-8 mt-1 flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                {platform.platform_name}
              </p>
              <div className="flex-shrink-0 flex items-center gap-2 pl-2">
                <PlatformStatusBadge status={platform.status} />
                {hasDetails && (
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last synced: {lastSyncTime}
            </p>
          </div>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-gray-100 dark:bg-gray-900/70 rounded-lg shadow-inner">
                <PlatformDetailView
                  platformName={platform.platform_name}
                  details={platform.details}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

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
        <div>
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Live status of the employee's account on integrated external
            platforms.
          </p>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
                <PlatformRowSkeleton />
              </>
            ) : (
              platformStatuses.map((platform) => (
                <PlatformStatusCard
                  key={platform.platform_name}
                  platform={platform}
                  isExpanded={expandedPlatform === platform.platform_name}
                  onToggle={() =>
                    togglePlatformExpansion(platform.platform_name)
                  }
                />
              ))
            )}
          </div>
        </div>

        <div>
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
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
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
