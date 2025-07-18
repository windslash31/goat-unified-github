import React, { useState, memo } from "react";
import {
  MessageSquare,
  LogIn,
  LogOut,
  File,
  ChevronDown,
  User,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DetailRow = ({ label, value, icon }) => {
  if (value === null || typeof value === "undefined" || value === "")
    return null;
  return (
    <div className="flex items-start py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <dt className="w-1/3 text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </dt>
      <dd className="w-2/3 text-gray-800 dark:text-gray-200 text-right break-words">
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

const SlackLogDetailView = ({ log }) => (
  <dl>
    <SectionHeader>Actor</SectionHeader>
    <DetailRow icon={<User size={14} />} label="Type" value={log.actor?.type} />
    <DetailRow
      icon={<User size={14} />}
      label="User ID"
      value={log.actor?.user?.id}
    />
    <DetailRow
      icon={<User size={14} />}
      label="User Name"
      value={log.actor?.user?.name}
    />

    <SectionHeader>Entity</SectionHeader>
    <DetailRow
      icon={<Globe size={14} />}
      label="Type"
      value={log.entity?.type}
    />
    <DetailRow
      icon={<Globe size={14} />}
      label="Channel ID"
      value={log.entity?.channel?.id}
    />
    <DetailRow
      icon={<Globe size={14} />}
      label="Channel Name"
      value={log.entity?.channel?.name}
    />
    <DetailRow
      icon={<Globe size={14} />}
      label="Privacy"
      value={log.entity?.channel?.privacy}
    />

    <SectionHeader>Context</SectionHeader>
    <DetailRow
      icon={<Globe size={14} />}
      label="Session ID"
      value={log.context?.session_id}
    />
  </dl>
);

const SlackLogEntry = memo(({ log, isExpanded, onToggle }) => {
  const getEventIcon = (action) => {
    if (action.includes("login"))
      return <LogIn className="w-5 h-5 text-green-500" />;
    if (action.includes("logout"))
      return <LogOut className="w-5 h-5 text-red-500" />;
    if (action.includes("file"))
      return <File className="w-5 h-5 text-blue-500" />;
    return <MessageSquare className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">{getEventIcon(log.action)}</div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                {log.action.replace(/_/g, " ")}
              </p>
              <div className="flex-shrink-0 flex items-center gap-2">
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {new Date(log.date_create * 1000).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 truncate">
              {log.entity?.channel?.name
                ? `in #${log.entity.channel.name}`
                : "No specific entity"}
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
            <div className="pt-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-900/70 rounded-lg shadow-inner">
                <SlackLogDetailView log={log} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const SlackLogPage = ({ logs, loading, error }) => {
  const [expandedLogRowId, setExpandedLogRowId] = useState(null);

  const toggleRowExpansion = (logId) => {
    setExpandedLogRowId((prevId) => (prevId === logId ? null : logId));
  };

  if (loading)
    return <div className="text-center p-8">Loading Slack logs...</div>;
  if (error)
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!logs || logs.length === 0)
    return (
      <div className="text-center p-8 text-gray-500">
        No Slack audit logs found for this user (Note: Requires Enterprise Grid
        plan).
      </div>
    );

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {logs.map((log) => (
        <SlackLogEntry
          key={log.id}
          log={log}
          isExpanded={expandedLogRowId === log.id}
          onToggle={() => toggleRowExpansion(log.id)}
        />
      ))}
    </div>
  );
};
