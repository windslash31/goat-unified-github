import React, { memo, useState } from "react";
import {
  ArrowRight,
  UserCheck,
  UserX,
  KeyRound,
  FileLock,
  Shield,
  MapPin,
  Monitor,
  Database,
  Filter,
  ChevronDown,
  ChevronUp,
  Vpn,
  AppWindow,
  Fingerprint,
  Server,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

// A small component for displaying key-value pairs in the details section
const DetailItem = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-2 py-1">
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-1">
      {label}
    </dt>
    <dd className="text-sm text-gray-900 dark:text-gray-200 col-span-2">
      {children}
    </dd>
  </div>
);

// The component for the collapsible details section
const CollapsibleDetails = ({ log }) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderDetails = () => {
    switch (log.event_type) {
      case "sso_auth":
        return (
          <>
            <DetailItem label="Application">
              {log.application?.display_label || "N/A"}
            </DetailItem>
            <DetailItem label="SSO Type">
              {log.application?.sso_type || "N/A"}
            </DetailItem>
            <DetailItem label="MFA Method">
              {log.mfa_meta?.type?.replace(/_/g, " ") || "Not Applied"}
            </DetailItem>
            <DetailItem label="Hostname">
              {log.auth_context?.system?.hostname || "N/A"}
            </DetailItem>
            <DetailItem label="OS">
              {log.useragent?.os_full || "N/A"}
            </DetailItem>
            <DetailItem label="Browser">
              {log.useragent?.name || "N/A"}
            </DetailItem>
            <DetailItem label="Latitude">
              {log.geoip?.latitude || "N/A"}
            </DetailItem>
            <DetailItem label="Longitude">
              {log.geoip?.longitude || "N/A"}
            </DetailItem>
            <DetailItem label="Service">{log.service || "N/A"}</DetailItem>
            <DetailItem label="Application ID">
              {log.application?.id || "N/A"}
            </DetailItem>
          </>
        );
      case "login_attempt":
        return (
          <>
            <DetailItem label="System ID">{log.system?.id || "N/A"}</DetailItem>
            <DetailItem label="Message">
              {log.message || "No message."}
            </DetailItem>
            <DetailItem label="Latitude">
              {log.geoip?.latitude || "N/A"}
            </DetailItem>
            <DetailItem label="Longitude">
              {log.geoip?.longitude || "N/A"}
            </DetailItem>
          </>
        );
      case "ldap_bind":
        return (
          <>
            <DetailItem label="Distinguished Name">
              <span className="font-mono text-xs">{log.dn}</span>
            </DetailItem>
            <DetailItem label="Auth Method">{log.auth_method}</DetailItem>
            <DetailItem label="Connection ID">{log.connection_id}</DetailItem>
          </>
        );
      case "passwordmanager_backup_create":
        return (
          <>
            <DetailItem label="Resource Name">{log.resource?.name}</DetailItem>
            <DetailItem label="Resource ID">{log.resource?.id}</DetailItem>
            <DetailItem label="Latitude">
              {log.geoip?.latitude || "N/A"}
            </DetailItem>
            <DetailItem label="Longitude">
              {log.geoip?.longitude || "N/A"}
            </DetailItem>
          </>
        );
      default:
        return (
          <>
            <DetailItem label="Details">
              {log.message || "No additional details."}
            </DetailItem>
            <DetailItem label="Latitude">
              {log.geoip?.latitude || "N/A"}
            </DetailItem>
            <DetailItem label="Longitude">
              {log.geoip?.longitude || "N/A"}
            </DetailItem>
          </>
        );
    }
  };

  return (
    <div className="mt-2 md:mt-0 md:pl-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-kredivo-primary hover:underline"
      >
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {isOpen ? "Hide Details" : "View Details"}
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
          <dl>{renderDetails()}</dl>
        </div>
      )}
    </div>
  );
};

export const JumpCloudLogPage = memo(
  ({ logs, loading, error, params, onParamsChange, onFetch }) => {
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
          // Fallback to the event type name
          return log.event_type.replace(/_/g, " ");
      }
    };

    const handleInputChange = (e) => {
      onParamsChange({ ...params, [e.target.name]: e.target.value });
    };

    const maxDate = new Date().toISOString().split("T")[0];
    const minDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Filter /> Filter Options
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                htmlFor="limit"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Limit (10-1000)
              </label>
              <input
                type="number"
                name="limit"
                id="limit"
                min="10"
                max="1000"
                value={params.limit}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-kredivo-primary"
              />
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
            logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div>{getEventIcon(log.event_type, log.success)}</div>

                  {/* Main content */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                          {formatPrimaryInfo(log)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} />{" "}
                            {log.geoip?.country_code || "N/A"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Server size={14} /> {log.client_ip || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        <p
                          className={`text-xs font-bold text-right ${
                            log.success ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {log.success ? "Success" : "Failed"}
                        </p>
                      </div>
                    </div>

                    {/* Collapsible details */}
                    <CollapsibleDetails log={log} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }
);
