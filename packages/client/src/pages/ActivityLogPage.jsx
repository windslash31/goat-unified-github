import React, { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronRight,
  Plus,
  Minus,
  Edit,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserPlus,
  UserX,
  Info,
  LogIn,
  LogOut,
  Eye,
  Download,
  KeyRound,
  HardDrive,
  PlusCircle,
  FilePlus,
  Filter as FilterIcon,
  // ✨ FIX: Import Trash2 icon
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { FilterPopover } from "../components/ui/FilterPopover";
import { FilterPills } from "../components/ui/FilterPills";
import api from "../api/api";
import { motion } from "framer-motion";
import { ActivityLogSkeleton } from "../components/ui/ActivityLogSkeleton";
import { CustomSelect } from "../components/ui/CustomSelect";
import { formatDate, formatDateTime } from "../utils/formatters";

const formatValue = (value) => {
  if (value === null || typeof value === "undefined") return '""';
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return `"${formatDate(value)}"`;
  }
  try {
    const obj = JSON.parse(value);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return `"${String(value)}"`;
  }
};

// --- (Other detail components like ApplicationAccessDetail, etc. remain here) ---

const ApplicationAccessDetail = ({ details }) => (
  <div className="flex items-start">
    <FilePlus className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
    <div>
      <p>
        Granted access to{" "}
        <span className="font-semibold">{details.application}</span>
      </p>
      <p className="text-sm text-gray-500">
        Role: <span className="font-medium">{details.role}</span>
      </p>
      <p className="text-sm text-gray-500">
        Source: <span className="font-medium">{details.source_ticket}</span>
      </p>
    </div>
  </div>
);

const EmployeeCreateDetail = ({ details }) => (
  <div className="flex items-start">
    <UserPlus className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
    <div>
      <p>
        New employee record created for{" "}
        <span className="font-semibold">{details.details.employee_email}</span>
      </p>
      <p className="text-sm text-gray-500">
        Source Ticket:{" "}
        <span className="font-medium">{details.details.source_ticket}</span>
      </p>
    </div>
  </div>
);

const PasswordChangeSuccessDetail = () => (
  <div className="flex items-center">
    <KeyRound className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
    <span>Password changed successfully.</span>
  </div>
);

const AdminPasswordResetDetail = ({ details }) => (
  <div className="flex items-center">
    <KeyRound className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
    <span>
      Password was reset for user{" "}
      <span className="font-semibold">{details.targetUserEmail}</span>.
    </span>
  </div>
);

const ApiKeyCreateDetail = ({ details }) => (
  <div className="flex items-start">
    <PlusCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
    <div>
      <p>API Key created</p>
      <p className="text-sm text-gray-500">
        Expires:{" "}
        <span className="font-medium">
          {details.expires ? formatDateTime(details.expires) : "Never"}
        </span>
      </p>
    </div>
  </div>
);

const ApiKeyDeleteDetail = () => (
  <div className="flex items-center">
    <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
    <span>API Key was revoked.</span>
  </div>
);

const LogoutSuccessDetail = () => (
  <div className="flex items-center">
    <LogOut className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
    <span>User successfully logged out.</span>
  </div>
);

const RoleCreateDetail = ({ details }) => (
  <div className="flex items-center">
    <PlusCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
    <span>
      New role created:{" "}
      <span className="font-semibold">{details.roleName}</span>
    </span>
  </div>
);

const RoleDeleteDetail = ({ details }) => (
  <div className="flex items-center">
    <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
    <span>
      Role deleted: <span className="font-semibold">{details.roleName}</span>
    </span>
  </div>
);

const PermissionChangeDetail = ({ changes }) => (
  <div className="space-y-2">
    {changes.added?.length > 0 && (
      <div className="flex items-start">
        <Plus className="w-4 h-4 text-green-500 mr-2 mt-1 shrink-0" />
        <div>
          <strong className="font-semibold">Added:</strong>
          <div className="flex flex-wrap gap-2 mt-1">
            {changes.added.map((p) => (
              <span
                key={p}
                className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-md"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
    {changes.removed?.length > 0 && (
      <div className="flex items-start">
        <Minus className="w-4 h-4 text-red-500 mr-2 mt-1 shrink-0" />
        <div>
          <strong className="font-semibold">Removed:</strong>
          <div className="flex flex-wrap gap-2 mt-1">
            {changes.removed.map((p) => (
              <span
                key={p}
                className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-md"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);

const RoleChangeDetail = ({ changes, targetUser }) => (
  <div className="flex items-center gap-2">
    {targetUser && (
      <span className="font-semibold text-gray-800 dark:text-gray-200">
        {targetUser}:
      </span>
    )}
    <span className="line-through text-red-500 dark:text-red-400">
      {changes.role.from}
    </span>
    <ChevronRight className="w-4 h-4 text-gray-400" />
    <span className="font-bold text-green-600 dark:text-green-400">
      {changes.role.to}
    </span>
  </div>
);

const EmployeeUpdateDetail = ({ changes }) => (
  <div className="space-y-2">
    {Object.keys(changes).map((field) => (
      <div key={field} className="flex items-start">
        <Edit className="w-4 h-4 text-blue-500 mr-2 mt-1 shrink-0" />
        <div>
          <strong className="font-semibold">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
          </strong>
          <div className="flex items-center gap-2 mt-1">
            <span className="line-through text-red-500 dark:text-red-400">
              {formatValue(changes[field].from)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-green-600 dark:text-green-400">
              {formatValue(changes[field].to)}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const LoginFailDetail = ({ details }) => (
  <div className="flex items-center">
    <AlertCircle className="w-4 h-4 text-red-500 mr-2 shrink-0" />
    <span>
      Reason: {details.reason} for user attempt{" "}
      <span className="font-semibold text-red-500 dark:text-red-400">
        {details.emailAttempt}
      </span>
      .
    </span>
  </div>
);

const SuspensionDetail = ({ results }) => (
  <div className="space-y-2">
    {results.map((result) => (
      <div key={result.platform} className="flex items-center">
        {result.status === "SUCCESS" ? (
          <CheckCircle className="w-4 h-4 text-green-500 mr-2 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 mr-2 shrink-0" />
        )}
        <span className="font-semibold capitalize w-28">
          {result.platform}:
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {result.message}
        </span>
      </div>
    ))}
  </div>
);

const UserCreateDetail = ({ details, roles }) => {
  const roleName =
    roles.find((r) => String(r.id) === String(details.createdUser?.roleId))
      ?.name || "Unknown Role";
  return (
    <div className="flex items-start">
      <UserPlus className="w-4 h-4 text-green-500 mr-2 mt-1 shrink-0" />
      <div>
        <p>
          New user created:{" "}
          <span className="font-semibold text-green-500 dark:text-green-400">
            {details.targetUserEmail}
          </span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Assigned Role: <span className="font-medium">{roleName}</span>
        </p>
      </div>
    </div>
  );
};

const UserDeleteDetail = ({ details }) => (
  <div className="flex items-center">
    <UserX className="w-4 h-4 text-red-500 mr-2 shrink-0" />
    <span>
      User deleted:{" "}
      <span className="font-semibold text-red-500 dark:text-red-400">
        {details.targetUserEmail}
      </span>
    </span>
  </div>
);

const GenericDetail = ({ details }) => (
  <div className="flex items-start">
    <Info className="w-4 h-4 text-gray-500 mr-2 mt-1 shrink-0" />
    <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded-md flex-1">
      {JSON.stringify(details, null, 2)}
    </pre>
  </div>
);

const UserLoginSuccessDetail = () => (
  <div className="flex items-center">
    <LogIn className="w-4 h-4 text-green-500 mr-2 shrink-0" />
    <span>User successfully logged in.</span>
  </div>
);

const EmployeeProfileViewDetail = ({ targetUser }) => (
  <div className="flex items-center">
    <Eye className="w-4 h-4 text-blue-500 mr-2 shrink-0" />
    <span>
      Viewed the profile of{" "}
      <span className="font-semibold text-blue-500 dark:text-blue-400">
        {targetUser}
      </span>
      .
    </span>
  </div>
);

// ✨ FIX: Add new components for Managed Account logs
const ManagedAccountCreateDetail = ({ details }) => (
  <div className="flex items-start">
    <PlusCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
    <div>
      <p>
        Created new managed account:{" "}
        <span className="font-semibold">{details.name}</span>
      </p>
      <p className="text-sm text-gray-500">
        Identifier:{" "}
        <span className="font-medium">{details.account_identifier}</span>
      </p>
      <p className="text-sm text-gray-500">
        Type:{" "}
        <span className="font-medium">
          {details.account_type.replace(/_/g, " ")}
        </span>
      </p>
    </div>
  </div>
);

const ManagedAccountDeleteDetail = ({ details }) => (
  <div className="flex items-start">
    <Trash2 className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
    <div>
      <p>
        Deleted managed account:{" "}
        <span className="font-semibold">{details.name}</span>
      </p>
      <p className="text-sm text-gray-500">
        Identifier:{" "}
        <span className="font-medium">{details.account_identifier}</span>
      </p>
    </div>
  </div>
);

const ManagedAccountUpdateDetail = ({ changes }) => {
  const { from, to } = changes;
  const changedFields = Object.keys(to).filter((key) => {
    if (key === "id" || key === "created_at" || key === "updated_at")
      return false;
    return String(from[key]) !== String(to[key]);
  });

  if (changedFields.length === 0) {
    return (
      <div className="flex items-start">
        <Info className="w-4 h-4 text-gray-500 mr-2 mt-1 shrink-0" />
        <p>An update was made with no changes to the data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {changedFields.map((field) => (
        <div key={field} className="flex items-start">
          <Edit className="w-4 h-4 text-blue-500 mr-2 mt-1 shrink-0" />
          <div>
            <strong className="font-semibold">
              {field
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
              :
            </strong>
            <div className="flex items-center gap-2 mt-1">
              <span className="line-through text-red-500 dark:text-red-400">
                {formatValue(from[field])}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatValue(to[field])}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const LogDetailContent = ({ log, roles }) => {
  if (!log.details || Object.keys(log.details).length === 0) return null;

  const detailComponents = {
    APPLICATION_ACCESS_CREATE: (
      <ApplicationAccessDetail details={log.details.details} />
    ),
    EMPLOYEE_CREATE: <EmployeeCreateDetail details={log.details} />,
    USER_PASSWORD_CHANGE_SUCCESS: <PasswordChangeSuccessDetail />,
    ADMIN_PASSWORD_RESET: <AdminPasswordResetDetail details={log.details} />,
    API_KEY_CREATE: <ApiKeyCreateDetail details={log.details} />,
    API_KEY_DELETE: <ApiKeyDeleteDetail />,
    USER_LOGOUT_SUCCESS: <LogoutSuccessDetail />,
    ROLE_CREATE: <RoleCreateDetail details={log.details} />,
    ROLE_DELETE: <RoleDeleteDetail details={log.details} />,
    USER_LOGIN_SUCCESS: <UserLoginSuccessDetail />,
    EMPLOYEE_PROFILE_VIEW: (
      <EmployeeProfileViewDetail targetUser={log.target_employee_email} />
    ),
    USER_CREATE: <UserCreateDetail details={log.details} roles={roles} />,
    USER_DELETE: <UserDeleteDetail details={log.details} />,
    USER_LOGIN_FAIL: <LoginFailDetail details={log.details} />,
    USER_ROLE_UPDATE: (
      <RoleChangeDetail
        changes={log.details.changes}
        targetUser={log.details.targetUserEmail}
      />
    ),
    ROLE_PERMISSIONS_UPDATE: (
      <PermissionChangeDetail changes={log.details.changes} />
    ),
    EMPLOYEE_UPDATE: <EmployeeUpdateDetail changes={log.details.changes} />,
    MANUAL_PLATFORM_SUSPENSION: (
      <SuspensionDetail results={log.details.deactivation_results} />
    ),
    // ✨ FIX: Add Managed Account action types to the component map
    MANAGED_ACCOUNT_CREATE: (
      <ManagedAccountCreateDetail details={log.details.createdAccount} />
    ),
    MANAGED_ACCOUNT_UPDATE: (
      <ManagedAccountUpdateDetail changes={log.details.changes} />
    ),
    MANAGED_ACCOUNT_DELETE: (
      <ManagedAccountDeleteDetail details={log.details.deletedAccount} />
    ),
  };

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-900/70 rounded-lg shadow-inner text-sm space-y-2">
      <div>
        <h4 className="font-semibold mb-1 text-gray-800 dark:text-gray-200">
          Details:
        </h4>
        {detailComponents[log.action_type] || (
          <GenericDetail details={log.details} />
        )}
      </div>
      {log.details.context && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-1 text-gray-800 dark:text-gray-200">
            Context:
          </h4>
          <p className="text-xs text-gray-500">
            <strong>IP Address:</strong>{" "}
            {log.details.context.ipAddress || "N/A"}
          </p>
          <p className="text-xs text-gray-500">
            <strong>User Agent:</strong>{" "}
            {log.details.context.userAgent || "N/A"}
          </p>
        </div>
      )}
    </div>
  );
};

// --- (The rest of the ActivityLogPage component remains the same) ---
const ActivityLogItem = ({ log, roles, isExpanded, onToggle }) => {
  const getActionIcon = (actionType) => {
    if (
      actionType.includes("SUCCESS") ||
      actionType.includes("CREATE") ||
      actionType.includes("API_KEY_CREATE")
    )
      return <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-500" />;
    if (
      actionType.includes("FAIL") ||
      actionType.includes("DELETE") ||
      actionType.includes("SUSPENSION") ||
      actionType.includes("API_KEY_DELETE")
    )
      return <XCircle className="w-6 h-6 flex-shrink-0 text-red-500" />;
    if (
      actionType.includes("UPDATE") ||
      actionType.includes("VIEW") ||
      actionType.includes("RESET")
    )
      return <Edit className="w-6 h-6 flex-shrink-0 text-blue-500" />;
    return <HardDrive className="w-6 h-6 flex-shrink-0 text-gray-400" />;
  };

  const getTargetDisplayName = (log) => {
    if (log.action_type === "MANUAL_PLATFORM_SUSPENSION")
      return log.target_employee_email || "N/A";
    if (log.action_type === "EMPLOYEE_PROFILE_VIEW")
      return log.target_employee_email || "N/A";
    if (log.action_type.startsWith("USER_"))
      return log.target_user_email || log.details?.targetUserEmail || "N/A";
    if (log.action_type.startsWith("EMPLOYEE_"))
      return log.target_employee_email || "N/A";
    if (log.action_type.startsWith("ROLE_"))
      return `Role: ${log.details?.roleName}`;
    if (log.action_type.startsWith("API_KEY"))
      return log.target_user_email || "N/A";
    // ✨ FIX: Add display name for managed account logs
    if (log.action_type.startsWith("MANAGED_ACCOUNT_")) {
      const account =
        log.details?.createdAccount ||
        log.details?.changes?.to ||
        log.details?.deletedAccount;
      return account?.name || "Managed Account";
    }
    return "System";
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex-shrink-0">
            {getActionIcon(log.action_type)}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize pr-4">
                {log.action_type.replace(/_/g, " ")}
              </p>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              by{" "}
              <span className="font-medium">{log.actor_email || "System"}</span>{" "}
              on{" "}
              <span className="font-medium">{getTargetDisplayName(log)}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {formatDateTime(log.timestamp)}
            </p>
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="pt-3">
          <LogDetailContent log={log} roles={roles} />
        </div>
      )}
    </div>
  );
};

export const ActivityLogPage = () => {
  const [filters, setFilters] = useState({
    actionType: "",
    actorEmail: "",
    startDate: "",
    endDate: "",
    limit: 100,
  });
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const [expandedLogRowId, setExpandedLogRowId] = useState(null);

  const limitOptions = [
    { id: 10, name: "10" },
    { id: 100, name: "100" },
    { id: 500, name: "500" },
    { id: 1000, name: "1000" },
  ];

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get("/api/roles")).data,
  });

  const { data: logData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["activityLogs", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/api/logs/activity?${params}`);
      return data;
    },
    keepPreviousData: true,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["activityLogFilters"],
    queryFn: async () => (await api.get("/api/logs/activity/filters")).data,
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/api/logs/activity/export?${params}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "activity-log.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Failed to export logs:", error);
      toast.error("Failed to export logs.");
    }
  };

  const clearFilters = () => {
    setFilters({
      actionType: "",
      actorEmail: "",
      startDate: "",
      endDate: "",
      limit: 100,
    });
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: newLimit }));
  };

  const toggleRowExpansion = (logId) => {
    setExpandedLogRowId(expandedLogRowId === logId ? null : logId);
  };

  const popoverOptions = useMemo(
    () => ({
      actionTypes:
        filterOptions?.actionTypes.map((a) => ({
          id: a,
          name: a.replace(/_/g, " "),
        })) || [],
      actors: filterOptions?.actors.map((a) => ({ id: a, name: a })) || [],
    }),
    [filterOptions]
  );

  if (isLoadingLogs) {
    return <ActivityLogSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Recent events recorded in the system.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto flex-wrap">
          <div className="w-40">
            <CustomSelect
              id="limit"
              value={filters.limit}
              options={limitOptions}
              onChange={handleLimitChange}
            />
          </div>
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FilterIcon size={16} />
              <span>Advanced</span>
            </button>
            {isFilterPopoverOpen && (
              <FilterPopover
                initialFilters={filters}
                onApply={setFilters}
                onClear={clearFilters}
                onClose={() => setIsFilterPopoverOpen(false)}
                options={popoverOptions}
                buttonRef={filterButtonRef}
                isActivityLog={true}
              />
            )}
          </div>
          <Button onClick={handleExport} variant="secondary">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <FilterPills
        filters={filters}
        setFilters={setFilters}
        setSearchInputValue={() => {}}
        options={popoverOptions}
        onClear={clearFilters}
        isActivityLog={true}
      />

      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {(logData || []).map((log) => (
            <ActivityLogItem
              key={log.id}
              log={log}
              roles={roles}
              isExpanded={expandedLogRowId === log.id}
              onToggle={() => toggleRowExpansion(log.id)}
            />
          ))}
          {!isLoadingLogs && (!logData || logData.length === 0) && (
            <div className="p-6 text-center text-gray-500">
              No activity found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
