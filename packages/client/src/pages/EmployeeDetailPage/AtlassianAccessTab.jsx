import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Book, Code, GitBranch, ChevronDown, Search } from "lucide-react";
import api from "../../api/api";
import { EmployeeDetailSkeleton } from "../../components/ui/EmployeeDetailSkeleton";
import { motion, AnimatePresence } from "framer-motion";

const fetchAtlassianAccess = async (employeeId) => {
  const { data } = await api.get(
    `/api/employees/${employeeId}/atlassian-access`
  );
  return data;
};

const PermissionBadge = ({ level }) => {
  if (!level) return null;
  const lowerLevel = level.toLowerCase();
  let color = "bg-blue-500";
  if (lowerLevel.includes("admin")) color = "bg-red-500";
  else if (lowerLevel.includes("read") || lowerLevel.includes("view"))
    color = "bg-gray-500";

  return (
    <span
      className={`text-xs text-white capitalize ${color} px-2 py-0.5 rounded-full whitespace-nowrap`}
    >
      {level.replace(/_/g, " ")}
    </span>
  );
};

const CollapsibleSection = ({
  title,
  icon,
  items,
  renderItem,
  itemKeyFn,
  searchKeys,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      searchKeys.some((key) =>
        item[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [items, searchTerm, searchKeys]);

  const hasContent = items && items.length > 0;

  return (
    <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/80"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
          <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {hasContent ? (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${title}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
                    />
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {filteredItems.map((item) => (
                      <li
                        key={itemKeyFn(item)}
                        className="py-2.5 flex justify-between items-center"
                      >
                        {renderItem(item)}
                      </li>
                    ))}
                    {filteredItems.length === 0 && (
                      <li className="py-4 text-center text-gray-500">
                        No results found.
                      </li>
                    )}
                  </ul>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No access found.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AtlassianAccessTab = () => {
  const { employeeId } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["atlassianAccess", employeeId],
    queryFn: () => fetchAtlassianAccess(employeeId),
  });

  if (isLoading) return <EmployeeDetailSkeleton />;

  if (isError) {
    return (
      <p className="text-red-500 text-center p-6">
        Error fetching Atlassian access information: {error.message}
      </p>
    );
  }

  return (
    <div className="p-4 sm:p-0">
      <CollapsibleSection
        title="Jira Projects"
        icon={<Code size={20} />}
        items={data.jiraProjects || []}
        // --- FIX: Use a composite key function ---
        itemKeyFn={(project) => `${project.project_id}-${project.role_name}`}
        searchKeys={["project_name", "project_key"]}
        renderItem={(project) => (
          <>
            <span>
              {project.project_name} ({project.project_key})
            </span>
            <PermissionBadge level={project.role_name} />
          </>
        )}
      />

      <CollapsibleSection
        title="Bitbucket Repositories"
        icon={<GitBranch size={20} />}
        items={data.bitbucketRepositories || []}
        // --- FIX: Use a composite key function ---
        itemKeyFn={(repo) => `${repo.repo_uuid}-${repo.permission_level}`}
        searchKeys={["full_name"]}
        renderItem={(repo) => (
          <>
            <span>{repo.full_name}</span>
            <PermissionBadge level={repo.permission_level} />
          </>
        )}
      />

      <CollapsibleSection
        title="Confluence Spaces"
        icon={<Book size={20} />}
        items={data.confluenceSpaces || []}
        // --- FIX: Use a simple key function ---
        itemKeyFn={(space) => space.id}
        searchKeys={["name", "key"]}
        renderItem={(space) => (
          <>
            <span>
              {space.name} ({space.key})
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {Array.isArray(space.permissions) &&
              space.permissions.includes("ADMINISTER") ? (
                <PermissionBadge level="administer" />
              ) : null}
            </div>
          </>
        )}
      />
    </div>
  );
};

export default AtlassianAccessTab;
