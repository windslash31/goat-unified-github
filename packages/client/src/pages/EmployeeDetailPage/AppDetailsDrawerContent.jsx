import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/api";
import { formatDateTime } from "../../utils/formatters";
import { DetailItem } from "../../components/ui/DetailItem";
import { PermissionBadge } from "../../components/ui/PermissionBadge";
import { CheckCircle2, X, Code, GitBranch, Book, KeyRound } from "lucide-react";

// This component now fetches its own data based on the ID it's given
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
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["detailedAccess", id, app.appName],
    queryFn: () => fetchDetailedAccess(id, type),
    enabled: !!app && app.ax.connected,
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

  let accessContent = (
    <p className="text-neutral-500 text-sm">
      No specific access details available.
    </p>
  );

  if (app.appName === "Atlassian" && detailedAccess?.accessData?.atlassian) {
    const { jiraProjects, bitbucketRepositories, confluenceSpaces } =
      detailedAccess.accessData.atlassian;
    accessContent = (
      <div className="space-y-6 text-sm">
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Code size={16} /> Jira Projects
          </h4>
          {jiraProjects?.length > 0 ? (
            [...jiraProjects]
              .sort((a, b) => a.project_name.localeCompare(b.project_name))
              .map((p) => (
                <DetailItem
                  key={p.project_id}
                  label={p.project_name}
                  value={<PermissionBadge level={p.role_name} />}
                />
              ))
          ) : (
            <p className="text-xs text-neutral-500">No Jira access found.</p>
          )}
        </div>
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <GitBranch size={16} /> Bitbucket Repositories
          </h4>
          {bitbucketRepositories?.length > 0 ? (
            [...bitbucketRepositories]
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
              .map((r) => (
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
            [...confluenceSpaces]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
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
  } else if (
    app.appName === "JumpCloud" &&
    detailedAccess?.accessData?.jumpcloud
  ) {
    accessContent = (
      <div className="space-y-4 text-sm">
        <h4 className="font-semibold flex items-center gap-2 mb-2">
          <KeyRound size={16} /> SSO Applications
        </h4>
        {detailedAccess.accessData.jumpcloud?.length > 0 ? (
          [...detailedAccess.accessData.jumpcloud]
            .sort((a, b) => a.display_label.localeCompare(b.display_label))
            .map((app) => (
              <DetailItem
                key={app.id}
                label={app.display_label}
                value={<PermissionBadge level="Granted" />}
              />
            ))
        ) : (
          <p className="text-xs text-neutral-500">
            No JumpCloud SSO access found.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {platformStatus?.details &&
        Object.keys(platformStatus.details).length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-2">
              Platform User Details
            </h3>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              renderObjectDetails(platformStatus.details)
            )}
          </div>
        )}
      <div>
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-2">
          Application Access
        </h3>
        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p className="text-red-500">Could not load access details.</p>
        ) : (
          accessContent
        )}
      </div>
    </div>
  );
};
