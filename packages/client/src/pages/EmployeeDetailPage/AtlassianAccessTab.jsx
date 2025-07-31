import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Book, Code, GitBranch } from "lucide-react";
import api from "../../api/api";
import { EmployeeDetailSkeleton } from "../../components/ui/EmployeeDetailSkeleton";

const fetchAtlassianAccess = async (employeeId) => {
  const { data } = await api.get(
    `/api/employees/${employeeId}/atlassian-access`
  );
  return data;
};

const Section = ({ title, icon, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const AccessList = ({ items, renderItem, emptyText }) => {
  if (!items || items.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {items.map(renderItem)}
    </ul>
  );
};

const AtlassianAccessTab = () => {
  const { employeeId } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["atlassianAccess", employeeId],
    queryFn: () => fetchAtlassianAccess(employeeId),
  });

  if (isLoading) {
    return <EmployeeDetailSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-red-500 text-center p-6">
        Error fetching Atlassian access information: {error.message}
      </p>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <Section title="Jira Projects" icon={<Code size={20} />}>
        <AccessList
          items={data.jiraProjects}
          emptyText="No Jira project access found for this user."
          renderItem={(project) => (
            <li key={project.project_id} className="py-2.5">
              <span className="font-medium">{project.project_name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                ({project.project_key})
              </span>
            </li>
          )}
        />
      </Section>

      <Section title="Bitbucket Repositories" icon={<GitBranch size={20} />}>
        <AccessList
          items={data.bitbucketRepositories}
          emptyText="No Bitbucket repository access found for this user."
          renderItem={(repo) => (
            <li
              key={repo.repo_uuid}
              className="py-2.5 flex justify-between items-center"
            >
              <span className="font-medium">{repo.full_name}</span>
              <span className="text-sm text-white capitalize bg-blue-500 px-2 py-0.5 rounded-full">
                {repo.permission_level}
              </span>
            </li>
          )}
        />
      </Section>

      <Section title="Confluence Spaces" icon={<Book size={20} />}>
        <AccessList
          items={data.confluenceSpaces}
          emptyText="No Confluence space access found for this user."
          renderItem={(space) => (
            <li
              key={space.id}
              className="py-2.5 flex justify-between items-center"
            >
              <span className="font-medium">{space.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({space.key})
              </span>
            </li>
          )}
        />
      </Section>
    </div>
  );
};

export default AtlassianAccessTab;
