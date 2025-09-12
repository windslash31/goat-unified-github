import React, { useMemo, useState, useEffect, useRef, memo } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DollarSign,
  AlertCircle,
  Cpu,
  User,
  PenSquare,
  ChevronDown,
  Loader,
  ExternalLink,
  PlusCircle,
  Trash2,
  UserX,
  MoreVertical,
  KeyRound,
} from "lucide-react";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "../../utils/formatters";
import { useModalStore } from "../../stores/modalStore";
import { Button } from "../../components/ui/Button";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
const SourceBadge = ({ mode }) => {
  const styles = {
    API_INTEGRATED: {
      icon: <Cpu size={12} />,
      label: "API Synced",
      classes: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    MANUAL_INTERNAL: {
      icon: <User size={12} />,
      label: "Manual",
      classes: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    },
    MANUAL_LICENSED: {
      icon: <PenSquare size={12} />,
      label: "Manual License",
      classes:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
    SSO_JUMPCLOUD: {
      icon: <KeyRound size={12} />,
      label: "JumpCloud SSO",
      classes:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    },
  };
  const style = styles[mode] || styles.MANUAL_INTERNAL;
  return (
    <span
      className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${style.classes}`}
    >
      {style.icon}
      {style.label}
    </span>
  );
};

const fetchAccessDetails = async (employeeId, platformKey) => {
  const platformRouteKey = {
    "Google Workspace": "google",
    Slack: "slack",
    JumpCloud: "jumpcloud",
    Atlassian: "atlassian",
  }[platformKey];
  const finalKey = platformRouteKey || platformKey;
  const { data } = await api.get(
    `/employees/${employeeId}/access-details/${encodeURIComponent(finalKey)}`
  );
  return data;
};

// Detail View Component
const DetailView = ({ employeeId, applicationName }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["accessDetails", employeeId, applicationName],
    queryFn: () => fetchAccessDetails(employeeId, applicationName),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader size={20} className="animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-xs text-red-500">
        Could not load details for this application.
      </div>
    );

  const DetailRow = ({ label, value }) => {
    if (value === null || typeof value === "undefined" || value === "")
      return null;
    return (
      <div className="py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 grid grid-cols-3 gap-2">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-1">
          {label}
        </dt>
        <dd className="text-sm text-gray-800 dark:text-gray-200 col-span-2">
          {String(value)}
        </dd>
      </div>
    );
  };

  const DetailSectionHeader = ({ title }) => (
    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2 first:mt-0">
      {title}
    </h4>
  );
  const JumpCloudSsoDetailView = ({ details }) => (
    <div>
      <DetailSectionHeader title="Access Granted Via Groups" />
      {details.user_groups && details.user_groups.length > 0 ? (
        <ul className="list-disc list-inside space-y-1">
          {details.user_groups.map((group) => (
            <li key={group} className="text-sm">
              {group}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No specific user groups found.</p>
      )}
    </div>
  );
  const GoogleDetailView = ({ details }) => (
    <dl>
      {" "}
      <DetailSectionHeader title="Google Workspace Details" />{" "}
      <DetailRow label="Admin" value={details.isAdmin ? "Yes" : "No"} />{" "}
      <DetailRow
        label="2-Step Verification"
        value={details.isEnrolledIn2Sv ? "Enrolled" : "Not Enrolled"}
      />{" "}
      <DetailRow label="Org Unit" value={details.orgUnitPath} />{" "}
      <DetailRow
        label="Last Login"
        value={
          details.lastLoginTime ? formatDateTime(details.lastLoginTime) : "N/A"
        }
      />{" "}
    </dl>
  );
  const SlackDetailView = ({ details }) => (
    <dl>
      {" "}
      <DetailSectionHeader title="Slack Details" />{" "}
      <DetailRow label="User ID" value={details.id} />{" "}
      <DetailRow label="Admin" value={details.is_admin ? "Yes" : "No"} />{" "}
      <DetailRow label="Owner" value={details.is_owner ? "Yes" : "No"} />{" "}
      <DetailRow label="Guest" value={details.is_guest ? "Yes" : "No"} />{" "}
    </dl>
  );
  const JumpCloudDetailView = ({ details }) => (
    <div>
      {" "}
      <DetailSectionHeader title="Core Identity" />{" "}
      <DetailRow label="Username" value={details.coreIdentity?.username} />{" "}
      <DetailRow label="Email" value={details.coreIdentity?.email} />{" "}
      <DetailSectionHeader title="Account Status" />{" "}
      <DetailRow label="State" value={details.accountStatus?.state} />{" "}
      <DetailRow
        label="Suspended"
        value={details.accountStatus?.suspended ? "Yes" : "No"}
      />{" "}
      <DetailRow label="MFA Status" value={details.accountStatus?.mfaStatus} />{" "}
    </div>
  );
  const AtlassianDetailView = ({ details }) => {
    const [activeTab, setActiveTab] = useState("jira");
    const tabs = [
      { id: "jira", label: "Jira", data: details.jiraProjects || [] },
      {
        id: "confluence",
        label: "Confluence",
        data: details.confluenceSpaces || [],
      },
      {
        id: "bitbucket",
        label: "Bitbucket",
        data: details.bitbucketRepositories || [],
      },
    ];
    const TabButton = ({ tab }) => (
      <button
        onClick={() => setActiveTab(tab.id)}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          activeTab === tab.id
            ? "bg-kredivo-primary text-white"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        {tab.label}{" "}
        <span className="text-xs opacity-75">{tab.data.length}</span>
      </button>
    );
    const renderContent = () => {
      const activeTabData = tabs.find((t) => t.id === activeTab)?.data;
      if (!activeTabData || activeTabData.length === 0)
        return (
          <p className="text-center text-sm text-gray-500 py-4">
            No access records found for this product.
          </p>
        );
      switch (activeTab) {
        case "jira":
          return (
            <ul className="space-y-2 pt-3">
              {activeTabData.map((p) => (
                <li
                  key={`${p.project_id}-${p.role_name}`}
                  className="text-sm flex justify-between items-center"
                >
                  <a
                    href={p.jira_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline flex items-center gap-1.5"
                  >
                    {p.project_name} <ExternalLink size={12} />
                  </a>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {p.role_name}
                  </span>
                </li>
              ))}
            </ul>
          );
        case "confluence":
          return (
            <ul className="space-y-2 pt-3">
              {activeTabData.map((s) => (
                <li
                  key={`${s.id}-${s.permissions.join("-")}`}
                  className="text-sm flex justify-between items-center"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {s.permissions.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          );
        case "bitbucket":
          return (
            <ul className="space-y-2 pt-3">
              {activeTabData.map((r) => (
                <li
                  key={`${r.repo_uuid}-${r.permission_level}`}
                  className="text-sm flex justify-between items-center"
                >
                  <a
                    href={`https://bitbucket.org/${r.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline flex items-center gap-1.5"
                  >
                    {r.full_name} <ExternalLink size={12} />
                  </a>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {r.permission_level}
                  </span>
                </li>
              ))}
            </ul>
          );
        default:
          return null;
      }
    };
    return (
      <div>
        <DetailSectionHeader title="Atlassian Access" />
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-2" aria-label="Tabs">
            {tabs.map(
              (tab) =>
                tab.data.length > 0 && <TabButton key={tab.id} tab={tab} />
            )}
          </nav>
        </div>
        <div className="mt-2 min-h-[100px]">{renderContent()}</div>
      </div>
    );
  };

  const renderDetails = () => {
    if (!data)
      return <p className="text-sm text-gray-500">No details available.</p>;
    if (data.user_groups) return <JumpCloudSsoDetailView details={data} />;
    if (data.details) {
      switch (applicationName) {
        case "Google Workspace":
          return <GoogleDetailView details={data.details} />;
        case "Slack":
          return <SlackDetailView details={data.details} />;
        case "JumpCloud":
          return <JumpCloudDetailView details={data.details} />;
        default:
          return (
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {JSON.stringify(data.details, null, 2)}
            </pre>
          );
      }
    }
    if (data.jiraProjects || data.confluenceSpaces)
      return <AtlassianDetailView details={data} />;
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-900/70 rounded-lg shadow-inner mt-3">
      {renderDetails()}
    </div>
  );
};

// --- START: NEW HELPER COMPONENTS ---

const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

const ActionMenu = memo(({ account, onRevoke, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setIsOpen(false));

  const canBeRevoked = !!account.license_assignment_id;
  const canBeRemoved = account.integration_mode?.startsWith("MANUAL");

  if (!canBeRevoked && !canBeRemoved) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
        title="Actions"
      >
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20"
          >
            <ul>
              {canBeRevoked && (
                <li>
                  <button
                    onClick={() => {
                      onRevoke();
                      setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4" /> Revoke License
                  </button>
                </li>
              )}
              {canBeRemoved && (
                <li>
                  <button
                    onClick={() => {
                      onRemove();
                      setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  >
                    <UserX className="w-4 h-4" /> Remove Access
                  </button>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// --- END: NEW HELPER COMPONENTS ---

export const EmployeeAccessTab = ({ employee }) => {
  const [expandedAccountId, setExpandedAccountId] = useState(null);
  const { openModal } = useModalStore();
  const queryClient = useQueryClient();
  const [actionTarget, setActionTarget] = useState(null);

  const { mutate: removeAssignmentMutation } = useMutation({
    mutationFn: (assignmentId) =>
      api.delete(`/licenses/assignments/${assignmentId}`),
    onSuccess: () => {
      toast.success("License revoked successfully!");
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      setActionTarget(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to revoke license.");
      setActionTarget(null);
    },
  });

  const { mutate: removeAccountMutation } = useMutation({
    mutationFn: ({ employeeId, accountId }) =>
      api.delete(`/employees/${employeeId}/accounts/${accountId}`),
    onSuccess: () => {
      toast.success("Application access removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      setActionTarget(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove access.");
      setActionTarget(null);
    },
  });

  const handleRevokeConfirm = () => {
    if (actionTarget?.license_assignment_id) {
      removeAssignmentMutation(actionTarget.license_assignment_id);
    }
  };

  const handleRemoveAccessConfirm = () => {
    if (actionTarget?.account_id) {
      removeAccountMutation({
        employeeId: employee.id,
        accountId: actionTarget.account_id,
      });
    }
  };

  const totalCost = (employee.provisioned_accounts || []).reduce(
    (sum, account) => sum + parseFloat(account.cost || 0),
    0
  );
  const provisionedAccounts = employee.provisioned_accounts || [];

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-kredivo-light text-kredivo-primary rounded-lg p-3">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Assigned License Cost
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalCost.toFixed(2)}
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Provisioned Accounts ({provisionedAccounts.length})
            </h3>
            <Button
              onClick={() => openModal("assignLicense", employee)}
              variant="secondary"
              className="h-9 px-3 text-sm"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Assign License
            </Button>
          </div>

          {provisionedAccounts.length > 0 ? (
            <div className="space-y-3">
              {provisionedAccounts.map((account) => {
                const isExpanded = expandedAccountId === account.account_id;
                return (
                  <div
                    key={account.account_id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() =>
                          setExpandedAccountId(
                            isExpanded ? null : account.account_id
                          )
                        }
                      >
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {account.application_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Instance: {account.instance_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                        <SourceBadge mode={account.integration_mode} />
                        {account.cost ? (
                          <div className="text-sm text-right">
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${parseFloat(account.cost).toFixed(2)}/mo
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {account.tier_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No License Cost
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            account.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {account.status}
                        </span>

                        <ActionMenu
                          account={account}
                          onRevoke={() =>
                            setActionTarget({ ...account, type: "revoke" })
                          }
                          onRemove={() =>
                            setActionTarget({ ...account, type: "remove" })
                          }
                        />
                        <button
                          className="p-2"
                          onClick={() =>
                            setExpandedAccountId(
                              isExpanded ? null : account.account_id
                            )
                          }
                        >
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <DetailView
                            employeeId={employee.id}
                            applicationName={account.application_name}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <AlertCircle className="mx-auto w-12 h-12 text-gray-400" />
              <p className="font-semibold mt-4">No Provisioned Accounts</p>
              <p className="text-sm mt-1">
                This employee has no application accounts detected by the
                system.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={
          actionTarget?.type === "remove"
            ? handleRemoveAccessConfirm
            : handleRevokeConfirm
        }
        title={
          actionTarget?.type === "remove"
            ? "Remove Application Access"
            : "Revoke License"
        }
        message={
          actionTarget?.type === "remove"
            ? `Are you sure you want to completely remove access to "${actionTarget?.application_name}" for this user? This will also revoke any assigned licenses and cannot be undone.`
            : `Are you sure you want to revoke the "${actionTarget?.tier_name}" license for "${actionTarget?.application_name}"? The user will still have access but it will be unlicensed.`
        }
        confirmationText={actionTarget?.type === "remove" ? "remove" : "revoke"}
      />
    </>
  );
};
