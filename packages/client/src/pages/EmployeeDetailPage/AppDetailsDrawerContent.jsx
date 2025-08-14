import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/api";
import { formatDateTime } from "../../utils/formatters";
import { DetailItem } from "../../components/ui/DetailItem";
import { PermissionBadge } from "../../components/ui/PermissionBadge";
import {
  CheckCircle2,
  X,
  Code,
  GitBranch,
  Book,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

// Helper function to fetch the access path via JumpCloud groups
const fetchJumpCloudAccessPath = (employeeId, managedAppId) => {
  if (!employeeId || !managedAppId) {
    return Promise.resolve([]);
  }
  return api
    .get(`/api/employees/${employeeId}/managed-app-access/${managedAppId}`)
    .then((res) => res.data);
};

// This function remains for fetching Atlassian/main JumpCloud platform details
const fetchDetailedAccess = (id, type) => {
  const endpoint =
    type === "employee"
      ? `/api/employees/${id}/application-access`
      : `/api/managed-accounts/${id}/application-access`;
  return api.get(endpoint).then((res) => res.data);
};

export const AppDetailsDrawerContent = ({
  app,
  employeeId,
  accountId,
  platformStatus,
}) => {
  const id = employeeId || accountId;
  const type = employeeId ? "employee" : "account";

  const {
    data: detailedAccess,
    isLoading: isLoadingLegacyDetails,
    isError: isErrorLegacy,
  } = useQuery({
    queryKey: ["detailedAccess", id, app.appName],
    queryFn: () => fetchDetailedAccess(id, type),
    enabled: !!app && app.ax.connected,
    retry: false, // Prevent retrying on auth errors
  });

  const {
    data: jumpcloudGroups,
    isLoading: isLoadingJcGroups,
    isError: isErrorJc,
  } = useQuery({
    queryKey: ["jumpcloudAccessPath", employeeId, app.id],
    queryFn: () => fetchJumpCloudAccessPath(employeeId, app.id),
    enabled: !!app?.jumpcloud_app_id,
    retry: false, // Prevent retrying on auth errors
  });

  const formatBoolean = (value) =>
    value ? (
      <span className="flex items-center justify-end gap-1 text-green-600 dark:text-green-400 font-medium">
        <CheckCircle2 size={14} /> Yes
      </span>
    ) : (
      <span className="flex items-center justify-end gap-1 text-red-600 dark:text-red-400 font-medium">
        <X size={14} /> No
      </span>
    );

  const renderObjectDetails = (obj, prefix = "") => {
    // This function can remain the same
    return Object.entries(obj).flatMap(([key, value]) => {
      const formattedKey = key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      const displayKey = prefix ? `${prefix} - ${formattedKey}` : formattedKey;
      if (value === null || key === "last_synced_at") return [];
      if (typeof value === "object" && !Array.isArray(value))
        return renderObjectDetails(value, displayKey);
      let formattedValue = String(value);
      if (typeof value === "boolean") formattedValue = formatBoolean(value);
      else if (
        key.toLowerCase().includes("time") ||
        key.toLowerCase().includes("date")
      )
        formattedValue = formatDateTime(value);
      return [
        <DetailItem
          key={displayKey}
          label={displayKey}
          value={formattedValue}
        />,
      ];
    });
  };

  const renderAccessContent = () => {
    const isLoading = isLoadingLegacyDetails || isLoadingJcGroups;
    const isError = isErrorLegacy || isErrorJc;

    if (isLoading) {
      return <p>Loading access details...</p>;
    }

    // --- START: THE FIX IS HERE ---
    if (isError) {
      return (
        <div className="text-center text-yellow-600 dark:text-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">Could not load details.</p>
          <p className="text-xs">
            Your session may have expired. Please try refreshing the page.
          </p>
        </div>
      );
    }
    // --- END: THE FIX IS HERE ---

    if (app?.jumpcloud_app_id) {
      return (
        <div className="space-y-4 text-sm">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <KeyRound size={16} /> Access via JumpCloud User Group(s)
          </h4>
          {jumpcloudGroups && jumpcloudGroups.length > 0 ? (
            jumpcloudGroups.map((group) => (
              <DetailItem
                key={group.id}
                label={group.name}
                value={<PermissionBadge level="Member" />}
              />
            ))
          ) : (
            <p className="text-xs text-neutral-500">
              No specific user group grants access. Access might be granted by
              default policies.
            </p>
          )}
        </div>
      );
    }

    if (app.ax.connected && detailedAccess?.accessData) {
      if (app.appName === "Atlassian" && detailedAccess.accessData.atlassian) {
        const { jiraProjects, bitbucketRepositories, confluenceSpaces } =
          detailedAccess.accessData.atlassian;
        return (
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Code size={16} /> Jira Projects
              </h4>
              {jiraProjects?.length > 0 ? (
                jiraProjects.map((p) => (
                  <DetailItem
                    key={p.project_id}
                    label={p.project_name}
                    value={<PermissionBadge level={p.role_name} />}
                  />
                ))
              ) : (
                <p className="text-xs text-neutral-500">
                  No Jira access found.
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <GitBranch size={16} /> Bitbucket Repositories
              </h4>
              {bitbucketRepositories?.length > 0 ? (
                bitbucketRepositories.map((r) => (
                  <DetailItem
                    key={r.repo_uuid}
                    label={r.full_name}
                    value={<PermissionBadge level={r.permission_level} />}
                  />
                ))
              ) : (
                <p className="text-xs text-neutral-500">
                  No Bitbucket access found.
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Book size={16} /> Confluence Spaces
              </h4>
              {confluenceSpaces?.length > 0 ? (
                confluenceSpaces.map((s) => (
                  <DetailItem
                    key={s.id}
                    label={s.name}
                    value={
                      <div className="flex flex-wrap gap-1 justify-end">
                        {(s.permissions || []).map((p) => (
                          <PermissionBadge key={p} level={p} />
                        ))}
                      </div>
                    }
                  />
                ))
              ) : (
                <p className="text-xs text-neutral-500">
                  No Confluence access found.
                </p>
              )}
            </div>
          </div>
        );
      }
    }

    return (
      <p className="text-neutral-500 text-sm">
        No specific access details available for this application.
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {platformStatus?.details &&
        Object.keys(platformStatus.details).length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-2">
              Platform User Details
            </h3>
            {isLoadingLegacyDetails ? (
              <p>Loading...</p>
            ) : (
              renderObjectDetails(platformStatus.details)
            )}
          </div>
        )}
      <div>
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-2">
          Application Access Details
        </h3>
        {renderAccessContent()}
      </div>
    </div>
  );
};
