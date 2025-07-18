import React, { useState, memo } from "react";
import { Shield, Server, ChevronDown, User, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "../../utils/formatters";

const DetailItem = ({ label, value }) => {
  if (value === null || typeof value === "undefined" || value === "")
    return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2.5 px-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:col-span-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 sm:col-span-2 break-words">
        {String(value)}
      </dd>
    </div>
  );
};

const SectionHeader = ({ children }) => (
  <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 pb-1 border-b-2 border-kredivo-primary/50">
    {children}
  </h4>
);

const GoogleLogDetailView = ({ log }) => {
  const event = log.events[0];
  const parameters = event.parameters.reduce(
    (acc, p) => ({ ...acc, [p.name]: p.value }),
    {}
  );

  return (
    <dl>
      <SectionHeader>Event Details</SectionHeader>
      <DetailItem label="Event Name" value={event.name} />
      <DetailItem label="Login Type" value={parameters.login_type} />
      <DetailItem
        label="Login Challenge Method"
        value={parameters.login_challenge_method}
      />

      <SectionHeader>Context</SectionHeader>
      <DetailItem label="IP Address" value={log.ipAddress} />
      <DetailItem label="Actor Email" value={log.actor.email} />
    </dl>
  );
};

const GoogleLogEntry = memo(({ log, isExpanded, onToggle }) => {
  const event = log.events[0];
  const isSuccess = event.name.includes("login_success");

  const getEventIcon = () => {
    if (isSuccess) return <Shield className="w-5 h-5 text-green-500" />;
    return <Shield className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">{getEventIcon()}</div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                {event.name.replace(/_/g, " ")}
              </p>
              <div className="flex-shrink-0 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    isSuccess
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  {isSuccess ? "Success" : "Failure"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDateTime(log.id.time)}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <Server size={14} /> {log.ipAddress || "N/A"}
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
                <GoogleLogDetailView log={log} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const GoogleLogPage = ({ logs, loading, error }) => {
  const [expandedLogRowId, setExpandedLogRowId] = useState(null);

  const toggleRowExpansion = (logId) => {
    setExpandedLogRowId((prevId) => (prevId === logId ? null : logId));
  };

  if (loading)
    return (
      <div className="text-center p-8">Loading Google Workspace logs...</div>
    );
  if (error)
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!logs || logs.length === 0)
    return (
      <div className="text-center p-8 text-gray-500">
        No Google Workspace login logs found for this user in the last 30 days.
      </div>
    );

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {logs.map((log) => (
        <GoogleLogEntry
          key={log.id.uniqueQualifier}
          log={log}
          isExpanded={expandedLogRowId === log.id.uniqueQualifier}
          onToggle={() => toggleRowExpansion(log.id.uniqueQualifier)}
        />
      ))}
    </div>
  );
};
