import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  AlertCircle,
  Cpu,
  User,
  PenSquare,
  ChevronDown,
  Loader,
  ExternalLink,
} from "lucide-react";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "../../utils/formatters";

const fetchAccessDetails = async (employeeId, platformKey) => {
  const platformRouteKey = {
    "Google Workspace": "google",
    Slack: "slack",
    JumpCloud: "jumpcloud",
    Atlassian: "atlassian",
  }[platformKey];

  // If the app is a JumpCloud SSO app, it won't be in the map.
  // We use the platformKey directly in that case.
  const finalKey = platformRouteKey || platformKey;

  const { data } = await api.get(
    `/api/employees/${employeeId}/access-details/${encodeURIComponent(
      finalKey
    )}`
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

  // Reusable Row Component
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

  // Reusable Section Header
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
      <DetailSectionHeader title="Google Workspace Details" />
      <DetailRow label="Admin" value={details.isAdmin ? "Yes" : "No"} />
      <DetailRow
        label="2-Step Verification"
        value={details.isEnrolledIn2Sv ? "Enrolled" : "Not Enrolled"}
      />
      <DetailRow label="Org Unit" value={details.orgUnitPath} />
      <DetailRow
        label="Last Login"
        value={
          details.lastLoginTime ? formatDateTime(details.lastLoginTime) : "N/A"
        }
      />
    </dl>
  );

  const SlackDetailView = ({ details }) => (
    <dl>
      <DetailSectionHeader title="Slack Details" />
      <DetailRow label="User ID" value={details.id} />
      <DetailRow label="Admin" value={details.is_admin ? "Yes" : "No"} />
      <DetailRow label="Owner" value={details.is_owner ? "Yes" : "No"} />
      <DetailRow label="Guest" value={details.is_guest ? "Yes" : "No"} />
    </dl>
  );

  const JumpCloudDetailView = ({ details }) => (
    <div>
      <DetailSectionHeader title="Core Identity" />
      <DetailRow label="Username" value={details.coreIdentity?.username} />
      <DetailRow label="Email" value={details.coreIdentity?.email} />

      <DetailSectionHeader title="Account Status" />
      <DetailRow label="State" value={details.accountStatus?.state} />
      <DetailRow
        label="Suspended"
        value={details.accountStatus?.suspended ? "Yes" : "No"}
      />
      <DetailRow label="MFA Status" value={details.accountStatus?.mfaStatus} />
    </div>
  );

  // --- START OF NECESSARY CHANGES ---
  // This is the only component that has been changed.
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
      if (!activeTabData || activeTabData.length === 0) {
        return (
          <p className="text-center text-sm text-gray-500 py-4">
            No access records found for this product.
          </p>
        );
      }

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
  // --- END OF NECESSARY CHANGES ---

  const renderDetails = () => {
    if (!data)
      return <p className="text-sm text-gray-500">No details available.</p>;

    if (data.user_groups) {
      return <JumpCloudSsoDetailView details={data} />;
    }

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

    if (data.jiraProjects || data.confluenceSpaces) {
      return <AtlassianDetailView details={data} />;
    }

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

export const EmployeeAccessTab = ({ employee }) => {
  const [expandedAccountId, setExpandedAccountId] = useState(null);

  const totalCost = (employee.provisioned_accounts || []).reduce(
    (sum, account) => sum + parseFloat(account.cost || 0),
    0
  );

  const provisionedAccounts = employee.provisioned_accounts || [];

  return (
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Provisioned Accounts ({provisionedAccounts.length})
        </h3>
        {provisionedAccounts.length > 0 ? (
          <div className="space-y-3">
            {provisionedAccounts.map((account) => {
              const isExpanded = expandedAccountId === account.account_id;

              return (
                <div
                  key={account.account_id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer"
                    onClick={() =>
                      setExpandedAccountId(
                        isExpanded ? null : account.account_id
                      )
                    }
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {account.application_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Instance: {account.instance_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
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
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
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
              This employee has no application accounts detected by the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
