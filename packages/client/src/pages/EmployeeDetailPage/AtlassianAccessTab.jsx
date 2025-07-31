import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  Book,
  Code,
  GitBranch,
  ChevronDown,
  Search,
  Filter,
  X,
} from "lucide-react";
import api from "../../api/api";
import { EmployeeDetailSkeleton } from "../../components/ui/EmployeeDetailSkeleton";
import { motion, AnimatePresence } from "framer-motion";

const fetchAtlassianAccess = async (employeeId) => {
  const { data } = await api.get(
    `/api/employees/${employeeId}/atlassian-access`
  );
  return data;
};

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

const PermissionBadge = ({ level }) => {
  if (!level) return null;
  const lowerLevel = level.toLowerCase();
  let color = "bg-blue-500"; // Default
  if (lowerLevel.includes("admin")) color = "bg-red-500";
  else if (lowerLevel.includes("delete")) color = "bg-yellow-600";
  else if (lowerLevel.includes("read") || lowerLevel.includes("view"))
    color = "bg-gray-500";
  else if (lowerLevel.includes("export")) color = "bg-green-600";

  return (
    <span
      className={`text-xs text-white capitalize ${color} px-2 py-0.5 rounded-full whitespace-nowrap`}
    >
      {level.replace(/_/g, " ")}
    </span>
  );
};

const FilterDropdown = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  const handleSelect = (option) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Filter size={14} />
        <span>Filter</span>
        {selected.length > 0 && (
          <span className="text-xs bg-kredivo-primary text-white rounded-full px-1.5 py-0.5">
            {selected.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-20"
          >
            <div className="p-2">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => handleSelect(option)}
                    className="h-4 w-4 rounded border-gray-300 text-kredivo-primary focus:ring-kredivo-primary"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CollapsibleSection = ({
  title,
  icon,
  items,
  renderItem,
  itemKeyFn,
  nameKey,
  permissionKey,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const permissionOptions = useMemo(() => {
    const allPermissions = items.flatMap((item) => item[permissionKey] || []);
    return [...new Set(allPermissions)].sort();
  }, [items, permissionKey]);

  const displayedItems = useMemo(() => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item[nameKey]
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPermissions.length > 0) {
      filtered = filtered.filter((item) => {
        const itemPerms = Array.isArray(item[permissionKey])
          ? item[permissionKey]
          : [item[permissionKey]];
        return selectedPermissions.some((sp) => itemPerms.includes(sp));
      });
    }

    filtered.sort((a, b) => {
      const [key, order] = sortOption.split("-");
      const valA = a[key] || "";
      const valB = b[key] || "";
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    items,
    searchTerm,
    sortOption,
    selectedPermissions,
    nameKey,
    permissionKey,
  ]);

  const hasContent = items && items.length > 0;

  return (
    <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
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
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${title}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="p-2 border rounded-md text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
                      >
                        <option value={`${nameKey}-asc`}>Sort A-Z</option>
                        <option value={`${nameKey}-desc`}>Sort Z-A</option>
                      </select>
                      <FilterDropdown
                        options={permissionOptions}
                        selected={selectedPermissions}
                        onChange={setSelectedPermissions}
                      />
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {displayedItems.map((item) => (
                      <li
                        key={itemKeyFn(item)}
                        className="py-2.5 flex justify-between items-center gap-2"
                      >
                        {renderItem(item)}
                      </li>
                    ))}
                    {displayedItems.length === 0 && (
                      <li className="py-4 text-center text-gray-500">
                        No results found for your criteria.
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
  if (isError)
    return (
      <p className="text-red-500 text-center p-6">Error: {error.message}</p>
    );

  return (
    <div className="p-4 sm:p-0">
      <CollapsibleSection
        title="Jira Projects"
        icon={<Code size={20} />}
        items={data.jiraProjects || []}
        itemKeyFn={(project) => `${project.project_id}-${project.role_name}`}
        nameKey="project_name"
        permissionKey="role_name"
        renderItem={(project) => (
          <>
            <span className="truncate">
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
        itemKeyFn={(repo) => `${repo.repo_uuid}-${repo.permission_level}`}
        nameKey="full_name"
        permissionKey="permission_level"
        renderItem={(repo) => (
          <>
            <span className="truncate">{repo.full_name}</span>
            <PermissionBadge level={repo.permission_level} />
          </>
        )}
      />

      <CollapsibleSection
        title="Confluence Spaces"
        icon={<Book size={20} />}
        items={data.confluenceSpaces || []}
        itemKeyFn={(space) => space.id}
        nameKey="name"
        permissionKey="permissions"
        renderItem={(space) => (
          <>
            <span className="truncate">
              {space.name} ({space.key})
            </span>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {Array.isArray(space.permissions) &&
                space.permissions.map((p) => (
                  <PermissionBadge key={p} level={p} />
                ))}
            </div>
          </>
        )}
      />
    </div>
  );
};

export default AtlassianAccessTab;
