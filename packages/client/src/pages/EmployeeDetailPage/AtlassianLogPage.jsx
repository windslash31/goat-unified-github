import React, { useState, memo } from "react";
import { Edit, User, Info, ChevronDown, Key } from "lucide-react";
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

const AtlassianLogDetailView = ({ log }) => (
  <dl>
    <SectionHeader>Event Details</SectionHeader>
    <DetailRow icon={<Info size={14} />} label="Summary" value={log.summary} />
    <DetailRow
      icon={<Info size={14} />}
      label="Category"
      value={log.category}
    />

    <SectionHeader>Author</SectionHeader>
    <DetailRow icon={<User size={14} />} label="Name" value={log.author.name} />
    <DetailRow icon={<User size={14} />} label="Type" value={log.author.type} />
    <DetailRow
      icon={<Key size={14} />}
      label="Account ID"
      value={log.author.accountId}
    />

    {log.changedValues && log.changedValues.length > 0 && (
      <>
        <SectionHeader>Changed Values</SectionHeader>
        {log.changedValues.map((change, index) => (
          <DetailRow
            key={index}
            icon={<Edit size={14} />}
            label={change.name}
            value={`From "${change.oldValue}" to "${change.newValue}"`}
          />
        ))}
      </>
    )}
  </dl>
);

const AtlassianLogEntry = memo(({ log, isExpanded, onToggle }) => {
  const getEventIcon = (category) => {
    if (category.toLowerCase().includes("user management"))
      return <User className="w-5 h-5 text-blue-500" />;
    if (category.toLowerCase().includes("permission"))
      return <Edit className="w-5 h-5 text-yellow-500" />;
    return <Info className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">{getEventIcon(log.category)}</div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                {log.category}
              </p>
              <div className="flex-shrink-0 flex items-center gap-2">
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            <p
              className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate"
              title={log.summary}
            >
              {log.summary}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {new Date(log.created).toLocaleString()}
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
                <AtlassianLogDetailView log={log} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const AtlassianLogPage = ({ logs, loading, error }) => {
  const [expandedLogRowId, setExpandedLogRowId] = useState(null);

  const toggleRowExpansion = (logId) => {
    setExpandedLogRowId((prevId) => (prevId === logId ? null : logId));
  };

  if (loading)
    return <div className="text-center p-8">Loading Atlassian logs...</div>;
  if (error)
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!logs || logs.length === 0)
    return (
      <div className="text-center p-8">
        No Atlassian audit logs found for this user.
      </div>
    );

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {logs.map((log) => (
        <AtlassianLogEntry
          key={log.id}
          log={log}
          isExpanded={expandedLogRowId === log.id}
          onToggle={() => toggleRowExpansion(log.id)}
        />
      ))}
    </div>
  );
};
