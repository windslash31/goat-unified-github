import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import {
  Search,
  Filter as FilterIcon,
  Trash2,
  X,
  Download,
  Upload,
  Loader,
  MoreVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { FilterPopover } from "../components/ui/FilterPopover";
import { Pagination } from "../components/ui/Pagination";
import { StatusQuickFilters } from "../components/ui/StatusQuickFilters";
import { FilterPills } from "../components/ui/FilterPills";
import { EmptyState } from "../components/ui/EmptyState";
import { useFetchFilterOptions } from "../hooks/useFetchFilterOptions";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useEmployeeTable } from "../hooks/useEmployeeTable";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { EmployeeImportModal } from "../components/ui/EmployeeImportModal";
import { EmployeeListSkeleton } from "../components/ui/EmployeeListSkeleton";
import { DesktopTable } from "../components/employees/DesktopTable";
import { MobileList } from "../components/employees/MobileList";
import { useDebounce } from "../hooks/useDebounce";

const SearchAndFilterActions = memo(
  ({
    initialSearch,
    onSearchChange,
    isLoading,
    areAdvancedFiltersActive,
    filterOptions,
    filters,
    setFilters,
    handleClearFilters,
    handleExport,
    setIsImportModalOpen,
    isMobile,
    isMinimized,
  }) => {
    const [searchInputValue, setSearchInputValue] = useState(initialSearch);
    const debouncedSearchTerm = useDebounce(searchInputValue, 500);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const filterButtonRef = useRef(null);
    const [isMobileActionMenuOpen, setIsMobileActionMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
      onSearchChange(debouncedSearchTerm);
    }, [debouncedSearchTerm, onSearchChange]);

    useEffect(() => {
      if (initialSearch !== searchInputValue) {
        setSearchInputValue(initialSearch);
      }
    }, [initialSearch]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          mobileMenuRef.current &&
          !mobileMenuRef.current.contains(event.target)
        ) {
          setIsMobileActionMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <>
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none ${
              isMinimized ? "sm:w-full" : "sm:w-64"
            }`}
          />
          {isLoading && (
            <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
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
              {!isMinimized && <span>Advanced</span>}
              {areAdvancedFiltersActive && !isMinimized && (
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
                isAccessMatrix={false}
              />
            )}
          </div>
          {!isMinimized && !isMobile && (
            <>
              <Button onClick={handleExport} variant="secondary">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" /> Import
              </Button>
            </>
          )}
          {isMobile && !isMinimized && (
            <div className="relative" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileActionMenuOpen((prev) => !prev)}
                className="p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <MoreVertical size={20} />
              </button>
              <AnimatePresence>
                {isMobileActionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20"
                  >
                    <ul>
                      <li>
                        <button
                          onClick={() => {
                            handleExport();
                            setIsMobileActionMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Download className="w-4 h-4" /> Export
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setIsImportModalOpen(true);
                            setIsMobileActionMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Upload className="w-4 h-4" /> Import
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </>
    );
  }
);

export const EmployeeListPage = () => {
  const {
    employees,
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    isLoading,
  } = useEmployeeTable();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isBulkActionMenuOpen, setIsBulkActionMenuOpen] = useState(false);
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const pageRef = useRef(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filterOptions = {
    legalEntities: useFetchFilterOptions("employees/options/legal_entities"),
    officeLocations: useFetchFilterOptions(
      "employees/options/office_locations"
    ),
    employeeTypes: useFetchFilterOptions("employees/options/employee_types"),
    employeeSubTypes: useFetchFilterOptions(
      "employees/options/employee_sub_types"
    ),
    applications: useFetchFilterOptions("applications"),
  };

  useEffect(() => {
    const mainContent = document.querySelector("main");
    if (!mainContent) return;
    const handleScroll = () => {
      setIsHeaderMinimized(mainContent.scrollTop > 50);
    };
    mainContent.addEventListener("scroll", handleScroll);
    return () => mainContent.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSelectedRows(new Set());
  }, [filters, pagination.currentPage, employees]);

  const handleSearchChange = useCallback(
    (searchTerm) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        search: searchTerm,
      }));
    },
    [setFilters]
  );

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
  };

  const handleExport = async () => {
    const sanitizedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ""
      )
    );
    const queryParams = new URLSearchParams(sanitizedFilters);
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
    return Object.entries(filters)
      .filter(([key]) => key !== "search") // Exclude the 'search' filter
      .some(([, value]) => !!value && value !== "all");
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
    const promise = api.post(`/api/employees/bulk-deactivate`, {
      employeeIds: Array.from(selectedRows),
      platforms: ["google", "slack", "jumpcloud", "atlassian"],
    });

    toast.promise(promise, {
      loading: "Processing bulk deactivation...",
      success: "Bulk deactivation complete!",
      error: "An error occurred during bulk deactivation.",
    });

    promise.finally(() => {
      setSelectedRows(new Set());
    });
  };

  if (isLoading && !employees.length) {
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

  const searchFilterProps = {
    initialSearch: filters.search,
    onSearchChange: handleSearchChange,
    isLoading: isLoading,
    areAdvancedFiltersActive: areAdvancedFiltersActive,
    filterOptions: filterOptions,
    filters: filters,
    setFilters: setFilters,
    handleClearFilters: handleClearFilters,
    handleExport: handleExport,
    setIsImportModalOpen: setIsImportModalOpen,
  };
  // --- MODIFICATION END ---

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6"
      ref={pageRef}
    >
      {!isDesktop && (
        <AnimatePresence>
          {isHeaderMinimized && (
            <motion.div
              key="sticky-header"
              initial={{ y: -70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -70, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed top-16 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-20 flex items-center gap-2"
            >
              <SearchAndFilterActions
                {...searchFilterProps}
                isMinimized={true}
                isMobile={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

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
            <AnimatePresence>
              {!isHeaderMinimized || isDesktop ? (
                <motion.div
                  key="full-header"
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex flex-col sm:flex-row justify-between items-center gap-4"
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white self-start sm:self-center">
                    Employees
                  </h1>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <SearchAndFilterActions
                      {...searchFilterProps}
                      isMobile={!isDesktop}
                    />
                  </div>
                </motion.div>
              ) : (
                <div className="min-h-[56px] w-full" />
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <FilterPills
        filters={filters}
        setFilters={setFilters}
        options={filterOptions}
        onClear={handleClearFilters}
      />

      <div className="mt-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <StatusQuickFilters
            currentStatus={filters.status}
            onStatusChange={(status) => {
              setFilters((prev) => ({ ...prev, status }));
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
