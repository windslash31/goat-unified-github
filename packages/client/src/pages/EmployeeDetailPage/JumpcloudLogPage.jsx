import React, { memo, useState } from "react";
import {
  AppWindow,
  ChevronDown,
  Database,
  FileLock,
  Fingerprint,
  KeyRound,
  MapPin,
  Monitor,
  Server,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "../../utils/formatters";

const LogStatusBadge = ({ success }) => {
  const isSuccess = success;
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
  const successClasses =
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  const failureClasses =
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";

  return (
    <span
      className={`${baseClasses} ${
        isSuccess ? successClasses : failureClasses
      }`}
    >
      {isSuccess ? "Success" : "Failed"}
    </span>
  );
};

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
        {String(value)}
      </dd>
    </div>
  );
};

const DetailSectionHeader = ({ children }) => (
  <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 pb-1 border-b-2 border-kredivo-primary/50">
    {children}
  </h4>
);

export const JumpCloudLogPage = memo(({ logs, loading, error }) => {
  const [expandedLogRowId, setExpandedLogRowId] = useState(null);

  const toggleRowExpansion = (logId) => {
    setExpandedLogRowId((prevId) => (prevId === logId ? null : logId));
  };

  const getEventIcon = (eventType, success) => {
    const baseClass = "w-6 h-6 flex-shrink-0";
    switch (eventType) {
      case "login_attempt":
        return success ? (
          <Monitor className={`${baseClass} text-green-500`} />
        ) : (
          <Monitor className={`${baseClass} text-red-500`} />
        );
      case "sso_auth":
        return <AppWindow className={`${baseClass} text-blue-500`} />;
      case "user_create":
        return <UserCheck className={`${baseClass} text-green-500`} />;
      case "user_delete":
        return <UserX className={`${baseClass} text-red-500`} />;
      case "password_change":
        return <KeyRound className={`${baseClass} text-yellow-500`} />;
      case "directory_object_modify":
        return <FileLock className={`${baseClass} text-orange-500`} />;
      case "ldap_bind":
        return <Database className={`${baseClass} text-indigo-500`} />;
      case "user_login_attempt":
        return <Fingerprint className={`${baseClass} text-cyan-500`} />;
      case "passwordmanager_backup_create":
        return <FileLock className={`${baseClass} text-purple-500`} />;
      default:
        return <Shield className={`${baseClass} text-gray-400`} />;
    }
  };

  const formatPrimaryInfo = (logDetails) => {
    switch (logDetails.event_type) {
      case "sso_auth":
        return `Authenticated to ${
          logDetails.application?.display_label || "an application"
        }`;
      case "login_attempt":
        return `Login to ${logDetails.system?.displayName || "system"}`;
      case "ldap_bind":
        return `LDAP Bind attempt via ${logDetails.auth_method}`;
      default:
        return logDetails.event_type.replace(/_/g, " ");
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading JumpCloud logs...</div>;
  }
  if (error) {
    return (
      <div className="text-center p-8 text-red-500">Error: {error.message}</div>
    );
  }
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No JumpCloud logs found for this user in the local database.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {logs.map((log) => {
        const isExpanded = expandedLogRowId === log.id;
        const details = log.details; // The full event from the API is now in the `details` field
        const isSuccess = details.success;

        return (
          <div
            key={log.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
          >
            <button
              onClick={() => toggleRowExpansion(log.id)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  {getEventIcon(details.event_type, isSuccess)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                      {formatPrimaryInfo(details)}
                    </p>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <LogStatusBadge success={isSuccess} />
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDateTime(log.timestamp)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />{" "}
                      {details.geoip?.country_code || "N/A"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Server size={14} /> {details.client_ip || "N/A"}
                    </span>
                  </div>
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
                      <DetailSectionHeader>
                        Full Event Details
                      </DetailSectionHeader>
                      <pre className="text-xs whitespace-pre-wrap font-mono p-2 overflow-x-auto">
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
});
