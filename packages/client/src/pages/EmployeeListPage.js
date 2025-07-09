import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter as FilterIcon,
  MoreVertical,
  Edit,
  UserX,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Download,
  Upload,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { FilterPopover } from "../components/ui/FilterPopover";
import { Pagination } from "../components/ui/Pagination";
import { StatusQuickFilters } from "../components/ui/StatusQuickFilters";
import { FilterPills } from "../components/ui/FilterPills";
import { EmptyState } from "../components/ui/EmptyState";
import { useDebounce } from "../hooks/useDebounce";
import { useFetchFilterOptions } from "../hooks/useFetchFilterOptions";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion } from "framer-motion";
import api from "../api/api";
import { EmployeeImportModal } from "../components/ui/EmployeeImportModal"; // Import the new modal
import { EmployeeListSkeleton } from "../components/ui/EmployeeListSkeleton";

// --- MODIFICATION 1: Moved MobileList outside and wrapped in React.memo ---
const MobileList = React.memo(({ employees }) => (
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {employees.map((emp) => {
      const fullName = [emp.first_name, emp.middle_name, emp.last_name]
        .filter(Boolean)
        .join(" ");
      return (
        <Link
          to={`/employees/${emp.id}`}
          key={emp.id}
          className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {fullName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {emp.employee_email}
              </p>
            </div>
            <StatusBadge status={emp.status} />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>{emp.position_name || "No position specified"}</p>
          </div>
        </Link>
      );
    })}
  </div>
));

// --- MODIFICATION 2: Moved DesktopTable outside and wrapped in React.memo ---
const DesktopTable = React.memo(
  ({
    employees,
    sorting,
    setSorting,
    selectedRows,
    handleSelectAll,
    handleSelectRow,
    onEdit,
    onDeactivate,
  }) => {
    const parentRef = useRef(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const actionMenuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          actionMenuRef.current &&
          !actionMenuRef.current.contains(event.target)
        ) {
          setActiveActionMenu(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const rowVirtualizer = useVirtualizer({
      count: employees.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 65,
      overscan: 10,
    });

    const TableHeader = ({ children, columnKey }) => {
      const isSorted = sorting.sortBy === columnKey;
      const handleSort = () =>
        setSorting((prev) => ({
          sortBy: columnKey,
          sortOrder: isSorted && prev.sortOrder === "asc" ? "desc" : "asc",
        }));
      return (
        <button
          onClick={handleSort}
          className="flex items-center gap-2 w-full text-left font-bold"
        >
          <span>{children}</span>
          <span className="text-gray-400">
            {isSorted ? (
              sorting.sortOrder === "asc" ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            ) : (
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            )}
          </span>
        </button>
      );
    };

    const virtualItems = rowVirtualizer.getVirtualItems();
    const paddingTop =
      virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
    const paddingBottom =
      virtualItems.length > 0
        ? rowVirtualizer.getTotalSize() -
          (virtualItems[virtualItems.length - 1]?.end ?? 0)
        : 0;

    return (
      <div ref={parentRef} className="h-[600px] overflow-auto">
        <table className="min-w-full table-fixed">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 w-[5%] text-left text-xs uppercase text-gray-500">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    employees.length > 0 &&
                    selectedRows.size === employees.length
                  }
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 w-[25%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="first_name">Employee</TableHeader>
              </th>
              <th className="px-6 py-3 w-[30%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="employee_email">Email</TableHeader>
              </th>
              <th className="px-6 py-3 w-[20%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="position_name">Job Title</TableHeader>
              </th>
              <th className="px-6 py-3 w-[15%] text-left text-xs uppercase text-gray-500">
                <TableHeader columnKey="status">Status</TableHeader>
              </th>
              <th className="px-6 py-3 w-[5%] text-left text-xs uppercase text-gray-500"></th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {paddingTop > 0 && (
              <tr>
                <td colSpan={6} style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const employee = employees[virtualRow.index];
              const fullName = [
                employee.first_name,
                employee.middle_name,
                employee.last_name,
              ]
                .filter(Boolean)
                .join(" ");

              const itemVariants = {
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              };

              return (
                <motion.tr
                  key={virtualRow.key}
                  variants={itemVariants}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={`border-b border-gray-200 dark:border-gray-700 ${
                    selectedRows.has(employee.id)
                      ? "bg-kredivo-light text-kredivo-dark-text dark:bg-kredivo-primary/20 dark:text-kredivo-light"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      onChange={() => handleSelectRow(employee.id)}
                      checked={selectedRows.has(employee.id)}
                      className="rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap font-medium"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    {fullName}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    {employee.employee_email}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    {employee.position_name}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    <StatusBadge status={employee.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div
                      className="relative"
                      ref={
                        activeActionMenu === employee.id ? actionMenuRef : null
                      }
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenu((prev) =>
                            prev === employee.id ? null : employee.id
                          );
                        }}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeActionMenu === employee.id && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                          <ul>
                            <li>
                              <button
                                onClick={() => {
                                  onEdit(employee);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4" /> Edit Employee
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  onDeactivate(employee);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                              >
                                <UserX className="w-4 h-4" /> Suspend Access
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td colSpan={6} style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>
    );
  }
);

export const EmployeeListPage = ({
  employees,
  isLoading,
  filters,
  setFilters,
  pagination,
  setPagination,
  sorting,
  setSorting,
  onEdit,
  onDeactivate,
}) => {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // New state for import modal
  const [searchInputValue, setSearchInputValue] = useState(filters.search);
  const debouncedSearchTerm = useDebounce(searchInputValue, 500);
  const filterButtonRef = useRef(null);
  const token = localStorage.getItem("accessToken");

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filterOptions = {
    legalEntities: useFetchFilterOptions(
      "employees/options/legal_entities",
      token
    ),
    officeLocations: useFetchFilterOptions(
      "employees/options/office_locations",
      token
    ),
    employeeTypes: useFetchFilterOptions(
      "employees/options/employee_types",
      token
    ),
    employeeSubTypes: useFetchFilterOptions(
      "employees/options/employee_sub_types",
      token
    ),
    applications: useFetchFilterOptions("applications", token),
  };

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearchTerm }));
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [debouncedSearchTerm, setFilters, setPagination, pagination.currentPage]);

  useEffect(() => {
    setSelectedRows(new Set());
  }, [filters, pagination.currentPage, employees]);

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      search: "",
      jobTitle: "",
      manager: "",
      legal_entity_id: "",
      office_location_id: "",
      employee_type_id: "",
      employee_sub_type_id: "",
      application_id: "",
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setSearchInputValue("");
  };

  const handleExport = async () => {
    const queryParams = new URLSearchParams();
    for (const key in filters) {
      if (filters[key] && filters[key] !== "all") {
        queryParams.append(key, filters[key]);
      }
    }

    try {
      const response = await api.get(
        `/api/employees/export?${queryParams.toString()}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employees.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error("Failed to export employees.");
      console.error(error);
    }
  };

  const areAdvancedFiltersActive = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "status") return value !== "all";
      if (key === "search") return false;
      return !!value;
    });
  }, [filters]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(employees.map((emp) => emp.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (employeeId) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
    } else {
      newSelection.add(employeeId);
    }
    setSelectedRows(newSelection);
  };

  const handleBulkDeactivate = async () => {
    const promise = fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/employees/bulk-deactivate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeIds: Array.from(selectedRows),
          platforms: ["google", "slack", "jumpcloud", "atlassian"],
        }),
      }
    );

    toast.promise(promise, {
      loading: "Processing bulk deactivation...",
      success: "Bulk deactivation complete!",
      error: "An error occurred during bulk deactivation.",
    });

    promise.finally(() => {
      setSelectedRows(new Set());
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <StatusQuickFilters
            currentStatus={filters.status}
            onStatusChange={() => {}}
          />
          <EmployeeListSkeleton count={10} />
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2 min-h-[40px]">
        {isDesktop && selectedRows.size > 0 ? (
          <div className="w-full flex justify-between items-center bg-kredivo-light p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedRows(new Set())}
                className="p-2 text-kredivo-dark-text rounded-full hover:bg-kredivo-primary/20"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="font-semibold text-kredivo-dark-text">
                {selectedRows.size} selected
              </span>
            </div>
            <div className="relative">
              <Button
                onClick={() => setIsBulkActionMenuOpen((prev) => !prev)}
                variant="primary"
              >
                Actions
              </Button>
              {isBulkActionMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20">
                  <ul>
                    <li>
                      <button
                        onClick={handleBulkDeactivate}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        <Trash2 className="w-4 h-4" /> Deactivate Selected
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white self-start sm:self-center">
              Employees
            </h1>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    ref={filterButtonRef}
                    onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                      areAdvancedFiltersActive || isFilterPopoverOpen
                        ? "bg-kredivo-light text-kredivo-dark-text border-kredivo-primary/30"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <FilterIcon size={16} />
                    <span>Advanced</span>
                    {areAdvancedFiltersActive && (
                      <div className="w-2 h-2 bg-kredivo-primary rounded-full"></div>
                    )}
                  </button>
                  {isFilterPopoverOpen && (
                    <FilterPopover
                      initialFilters={filters}
                      onApply={setFilters}
                      onClear={handleClearFilters}
                      onClose={() => setIsFilterPopoverOpen(false)}
                      options={filterOptions}
                      buttonRef={filterButtonRef}
                    />
                  )}
                </div>
                <Button onClick={handleExport} variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="secondary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <FilterPills
        filters={filters}
        setFilters={setFilters}
        setSearchInputValue={setSearchInputValue}
        options={filterOptions}
        onClear={handleClearFilters}
      />

      <div className="mt-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <StatusQuickFilters
            currentStatus={filters.status}
            onStatusChange={(status) => {
              setFilters((prev) => ({ ...prev, status }));
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
          />

          {employees.length > 0 ? (
            isDesktop ? (
              <DesktopTable
                employees={employees}
                sorting={sorting}
                setSorting={setSorting}
                selectedRows={selectedRows}
                handleSelectAll={handleSelectAll}
                handleSelectRow={handleSelectRow}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
              />
            ) : (
              <MobileList employees={employees} />
            )
          ) : (
            <EmptyState />
          )}

          {employees.length > 0 && (
            <Pagination pagination={pagination} setPagination={setPagination} />
          )}
        </div>
      </div>
      <EmployeeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </motion.div>
  );
};
