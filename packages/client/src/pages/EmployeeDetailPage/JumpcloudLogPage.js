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
export const JumpCloudLogPage = memo(
  ({ logs, loading, error, params, onParamsChange, onFetch }) => {
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

    const handleInputChange = (e) => {
      onParamsChange({ ...params, [e.target.name]: e.target.value });
    };

    // --- NEW: Handler specifically for the CustomSelect component ---
    const handleLimitChange = (value) => {
      onParamsChange({ ...params, limit: value });
    };

    const maxDate = new Date().toISOString().split("T")[0];
    const minDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // --- NEW: Options for the CustomSelect component ---
    const limitOptions = [
      { id: 10, name: "10" },
      { id: 100, name: "100" },
      { id: 500, name: "500" },
      { id: 1000, name: "1000" },
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Filter /> Filter Options
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Start Date
              </label>
              <input
                type="date"
                name="startTime"
                id="startTime"
                value={params.startTime}
                min={minDate}
                max={maxDate}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-kredivo-primary"
              />
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                End Date
              </label>
              <input
                type="date"
                name="endTime"
                id="endTime"
                value={params.endTime}
                min={params.startTime}
                max={maxDate}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-kredivo-primary"
              />
            </div>
            <div>
              <label
                htmlFor="limit"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Limit
              </label>
              {/* --- REPLACED: The native select is now a CustomSelect --- */}
              <div className="mt-1">
                <CustomSelect
                  id="limit"
                  options={limitOptions}
                  value={params.limit}
                  onChange={handleLimitChange}
                />
              </div>
            </div>
            <Button
              onClick={onFetch}
              disabled={loading}
              className="w-full md:w-auto justify-center"
            >
              {loading ? "Fetching..." : "Fetch Logs"}
            </Button>
          </div>
        </div>

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
                        {getEventIcon(log.event_type, log.success)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                            {formatPrimaryInfo(log)}
                          </p>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <LogStatusBadge success={log.success} />
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
                            <MapPin size={14} />{" "}
                            {log.geoip?.country_code || "N/A"}
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
                            <DetailItem label="Message">
                              {log.message}
                            </DetailItem>
                          )}
                          {log.application && (
                            <>
                              <DetailSectionHeader>
                                Application
                              </DetailSectionHeader>
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
                              <DetailSectionHeader>
                                Location
                              </DetailSectionHeader>
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
      </div>
    );
  }
);
