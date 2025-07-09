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
import { CustomSelect } from "../../components/ui/CustomSelect"; // Import CustomSelect

// A dedicated badge for the log status
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

// The key-value pairs for the details section
const DetailItem = ({ label, children, isMono = false }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 px-1">
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
      {label}
    </dt>
    <dd
      className={`text-sm text-gray-800 dark:text-gray-200 text-left sm:text-right mt-1 sm:mt-0 break-words ${
        isMono ? "font-mono text-xs" : ""
      }`}
    >
      {children || "N/A"}
    </dd>
  </div>
);

// The header for sections within the details card
const DetailSectionHeader = ({ children }) => (
  <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3 mb-1 px-1 first:mt-0">
    {children}
  </h5>
);

// The main log page component
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
              {isExpanded && (
                <div className="pt-3">
                  <div className="p-3 bg-gray-100 dark:bg-gray-900/70 rounded-lg shadow-inner">
                    <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                      <DetailSectionHeader>Event</DetailSectionHeader>
                      <DetailItem label="Event Type" isMono>
                        {log.event_type}
                      </DetailItem>
                      <DetailItem label="Service">{log.service}</DetailItem>
                      {log.message && (
                        <DetailItem label="Message">{log.message}</DetailItem>
                      )}
                      {log.application && (
                        <>
                          <DetailSectionHeader>Application</DetailSectionHeader>
                          <DetailItem label="Name">
                            {log.application.display_label}
                          </DetailItem>
                          <DetailItem label="SSO Type">
                            {log.application.sso_type}
                          </DetailItem>
                          <DetailItem label="ID" isMono>
                            {log.application.id}
                          </DetailItem>
                        </>
                      )}
                      {hasAuthContext && (
                        <>
                          <DetailSectionHeader>
                            Authentication
                          </DetailSectionHeader>
                          <DetailItem label="MFA Method">
                            {log.mfa_meta?.type?.replace(/_/g, " ") ||
                              "Not Applied"}
                          </DetailItem>
                          <DetailItem label="IDP Initiated">
                            {log.idp_initiated ? "Yes" : "No"}
                          </DetailItem>
                        </>
                      )}
                      {log.geoip && (
                        <>
                          <DetailSectionHeader>Location</DetailSectionHeader>
                          <DetailItem label="Timezone">
                            {log.geoip.timezone}
                          </DetailItem>
                          <DetailItem label="Coordinates">
                            {log.geoip.latitude}, {log.geoip.longitude}
                          </DetailItem>
                        </>
                      )}
                      {log.useragent && (
                        <>
                          <DetailSectionHeader>Device</DetailSectionHeader>
                          <DetailItem label="OS">
                            {log.useragent.os_full}
                          </DetailItem>
                          <DetailItem label="Browser">
                            {log.useragent.name} {log.useragent.version}
                          </DetailItem>
                          <DetailItem label="Device Type">
                            {log.useragent.device}
                          </DetailItem>
                        </>
                      )}
                      {log.auth_context?.system && (
                        <>
                          <DetailSectionHeader>System</DetailSectionHeader>
                          <DetailItem label="Hostname">
                            {log.auth_context.system.hostname}
                          </DetailItem>
                          <DetailItem label="OS">
                            {log.auth_context.system.os}{" "}
                            {log.auth_context.system.version}
                          </DetailItem>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
});
