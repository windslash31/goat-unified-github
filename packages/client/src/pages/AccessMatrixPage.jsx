import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, UserSearch, Filter as FilterIcon } from "lucide-react";
import api from "../api/api";
import { EmployeeListSkeleton } from "../components/ui/EmployeeListSkeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Pagination } from "../components/ui/Pagination";
import { useDebounce } from "../hooks/useDebounce";
import { FilterPopover } from "../components/ui/FilterPopover";

const fetchAccessMatrix = async (page, limit, search, applicationId) => {
  const params = new URLSearchParams({ page, limit });
  if (search) {
    params.append("search", search);
  }
  if (applicationId) {
    params.append("application_id", applicationId);
  }
  const { data } = await api.get(
    `/employees/access-matrix?${params.toString()}`
  );
  return data;
};

const fetchAppNames = async () => {
  const { data } = await api.get("/applications/names");
  return data;
};

export const AccessMatrixPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef(null);

  const [filters, setFilters] = useState({
    application_id: "", // Now a single ID string
  });

  const { data: appOptions, isLoading: isLoadingApps } = useQuery({
    queryKey: ["appNamesForFilter"],
    queryFn: fetchAppNames,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 20,
    totalPages: 1,
    totalCount: 0,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "accessMatrix",
      pagination.currentPage,
      pagination.limit,
      debouncedSearchTerm,
      filters.application_id, // Add selected app to query key
    ],
    queryFn: () =>
      fetchAccessMatrix(
        pagination.currentPage,
        pagination.limit,
        debouncedSearchTerm,
        filters.application_id // Pass selected app to fetcher
      ),
    keepPreviousData: true,
    onSuccess: (responseData) => {
      setPagination((prev) => ({
        ...prev,
        ...responseData.pagination,
      }));
    },
  });

  const matrixData = data?.matrixData || [];

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: Could not load access matrix data.
      </div>
    );
  }

  const areFiltersActive = !!filters.application_id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Access Matrix</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            A global overview of which employees have access to which
            applications.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
            />
          </div>
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                areFiltersActive || isFilterOpen
                  ? "bg-kredivo-light text-kredivo-dark-text border-kredivo-primary/30"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <FilterIcon size={16} />
              <span>Filter</span>
              {areFiltersActive && (
                <div className="w-2 h-2 bg-kredivo-primary rounded-full"></div>
              )}
            </button>
            {isFilterOpen && (
              <FilterPopover
                isAccessMatrix={true}
                initialFilters={filters}
                onApply={setFilters}
                onClear={() => setFilters({ application_id: "" })}
                onClose={() => setIsFilterOpen(false)}
                options={{ applications: appOptions || [] }}
                buttonRef={filterButtonRef}
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading && !data ? (
            <EmployeeListSkeleton count={10} />
          ) : matrixData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-1/3">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-1/4">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-2/5">
                    Applications
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {matrixData.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/employees/${employee.id}`}
                        className="hover:underline text-kredivo-primary"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.employee_email}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={employee.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {employee.applications.map((app) => (
                          <span
                            key={app.name}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                          >
                            {app.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <UserSearch className="mx-auto w-12 h-12 text-gray-400" />
              <p className="font-semibold mt-4">No Employees Found</p>
              <p className="text-sm mt-1">
                Your search and filters returned no results.
              </p>
            </div>
          )}
        </div>
        {data && data.pagination.totalCount > 0 && (
          <Pagination pagination={pagination} setPagination={setPagination} />
        )}
      </div>
    </motion.div>
  );
};
