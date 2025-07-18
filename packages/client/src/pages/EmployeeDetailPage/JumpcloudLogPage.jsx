import React, { memo, useState } from "react";
import {
  AppWindow,
  ChevronDown,
  Database,
  FileLock,
  Filter,
  Fingerprint,
  KeyRound,
  MapPin,
  Monitor,
  Server,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { motion, AnimatePresence } from "framer-motion";

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

  const formatPrimaryInfo = (log) => {
    switch (log.event_type) {
      case "sso_auth":
        return `Authenticated to ${
          log.application?.display_label || "an application"
        }`;
      case "login_attempt":
        return `Login to ${log.system?.displayName || "system"}`;
      case "ldap_bind":
        return `LDAP Bind attempt via ${log.auth_method}`;
      default:
        return log.event_type.replace(/_/g, " ");
    }
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {loading && (
        <div className="text-center p-8">Loading JumpCloud logs...</div>
      )}
      {error && (
        <div className="text-center p-8 text-red-500">Error: {error}</div>
      )}
      {!loading && !error && (!logs || logs.length === 0) && (
        <div className="text-center p-8">
          No JumpCloud logs found for the selected criteria.
        </div>
      )}

      {!loading &&
        !error &&
        logs &&
        logs.map((log) => {
          const isExpanded = expandedLogRowId === log.id;
          const hasAuthContext =
            log.auth_context && Object.keys(log.auth_context).length > 0;
          const isSuccess =
            log.event_type === "sso_auth" ? log.sso_token_success : log.success;
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
                    {getEventIcon(log.event_type, isSuccess)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                        {formatPrimaryInfo(log)}
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
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {log.geoip?.country_code || "N/A"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Server size={14} /> {log.client_ip || "N/A"}
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
                        <dl>
                          <DetailSectionHeader>Event</DetailSectionHeader>
                          <DetailItem
                            label="Event Type"
                            value={log.event_type}
                            isMono
                          />
                          <DetailItem label="Service" value={log.service} />
                          {log.message && (
                            <DetailItem label="Message" value={log.message} />
                          )}
                          {log.application && (
                            <>
                              <DetailSectionHeader>
                                Application
                              </DetailSectionHeader>
                              <DetailItem
                                label="Name"
                                value={log.application.display_label}
                              />
                              <DetailItem
                                label="SSO Type"
                                value={log.application.sso_type}
                              />
                              <DetailItem
                                label="ID"
                                value={log.application.id}
                                isMono
                              />
                            </>
                          )}
                          {hasAuthContext && (
                            <>
                              <DetailSectionHeader>
                                Authentication
                              </DetailSectionHeader>
                              <DetailItem
                                label="MFA Method"
                                value={
                                  log.mfa_meta?.type?.replace(/_/g, " ") ||
                                  "Not Applied"
                                }
                              />
                              <DetailItem
                                label="IDP Initiated"
                                value={log.idp_initiated ? "Yes" : "No"}
                              />
                            </>
                          )}
                          {log.geoip && (
                            <>
                              <DetailSectionHeader>
                                Location
                              </DetailSectionHeader>
                              <DetailItem
                                label="Timezone"
                                value={log.geoip.timezone}
                              />
                              <DetailItem
                                label="Coordinates"
                                value={`${log.geoip.latitude}, ${log.geoip.longitude}`}
                              />
                            </>
                          )}
                          {log.useragent && (
                            <>
                              <DetailSectionHeader>Device</DetailSectionHeader>
                              <DetailItem
                                label="OS"
                                value={log.useragent.os_full}
                              />
                              <DetailItem
                                label="Browser"
                                value={`${log.useragent.name} ${log.useragent.version}`}
                              />
                              <DetailItem
                                label="Device Type"
                                value={log.useragent.device}
                              />
                            </>
                          )}
                          {log.auth_context?.system && (
                            <>
                              <DetailSectionHeader>System</DetailSectionHeader>
                              <DetailItem
                                label="Hostname"
                                value={log.auth_context.system.hostname}
                              />
                              <DetailItem
                                label="OS"
                                value={`${log.auth_context.system.os} ${log.auth_context.system.version}`}
                              />
                            </>
                          )}
                        </dl>
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
