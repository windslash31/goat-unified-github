import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter as FilterIcon, ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { FilterPopover } from '../components/ui/FilterPopover';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

const useFetchFilterOptions = (endpoint) => {
    const [options, setOptions] = useState([]);
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!endpoint || !token) return;
        const fetchOptions = async () => {
            try {
                const url = `${process.env.REACT_APP_API_BASE_URL}/api/${endpoint}`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) setOptions(await response.json());
            } catch (error) {
                console.error(`Failed to fetch filter options for ${endpoint}:`, error);
            }
        };
        fetchOptions();
    }, [endpoint]);
    return options;
};


const Pagination = ({ pagination, setPagination }) => {
    const { currentPage, totalPages, totalCount, limit } = pagination;
    if (totalCount === 0) return null;
    const from = (currentPage - 1) * limit + 1;
    const to = Math.min(currentPage * limit, totalCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
                Showing <span className="font-semibold">{from}</span> to <span className="font-semibold">{to}</span> of <span className="font-semibold">{totalCount}</span> results
            </span>
            <div className="flex items-center gap-2">
                <button onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"><ChevronRight className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

const StatusQuickFilters = ({ currentStatus, onStatusChange }) => {
    const statuses = ['all', 'active', 'escalation', 'inactive'];
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {statuses.map(status => (
                <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap ${
                        currentStatus === status
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    {capitalize(status).replace('_', ' ')}
                </button>
            ))}
        </div>
    );
};

const FilterPills = ({ filters, setFilters, setSearchInputValue, options }) => {
    const removeFilter = (key) => {
        if (key === 'search') setSearchInputValue('');
        const newFilters = { ...filters };
        delete newFilters[key];
        if (key === 'status') newFilters.status = 'all';
        setFilters(newFilters);
    };
    
    const filterLabels = {
        jobTitle: "Job Title",
        manager: "Manager",
        legal_entity_id: "Legal Entity",
        office_location_id: "Office",
        employee_type_id: "Type",
        employee_sub_type_id: "Sub-Type",
        application_id: "Application"
    };

    const optionsMap = {
        legal_entity_id: options.legalEntities,
        office_location_id: options.officeLocations,
        employee_type_id: options.employeeTypes,
        employee_sub_type_id: options.employeeSubTypes,
        application_id: options.applications
    };
    
    const activeFilters = Object.entries(filters)
        .filter(([key, value]) => value && value !== 'all' && key !== 'status' && key !== 'search')
        .map(([key, value]) => {
            let displayValue = value;
            if (optionsMap[key]) {
                const foundOption = optionsMap[key]?.find(opt => String(opt.id) === String(value));
                if (foundOption) displayValue = foundOption.name;
            }
            return { key, label: filterLabels[key] || key, value: displayValue };
        });

    if (activeFilters.length === 0) return <div className="h-8"></div>;

    return (
        <div className="flex items-center gap-2 h-auto flex-wrap py-2">
            <span className="text-sm font-medium">Active Filters:</span>
            {activeFilters.map(({ key, label, value }) => (
                <span key={key} className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400">
                    {label}: {String(value).substring(0, 20)}
                    <button onClick={() => removeFilter(key)} className="ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50"><X className="w-3 h-3"/></button>
                </span>
            ))}
        </div>
    );
};

export const EmployeeListPage = ({ employees, filters, setFilters, pagination, setPagination, sorting, setSorting }) => {
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState(filters.search);
    const debouncedSearchTerm = useDebounce(searchInputValue, 500);
    const filterButtonRef = useRef(null);
    const popoverRef = useRef(null);
    
    const filterOptions = {
        legalEntities: useFetchFilterOptions('employees/options/legal_entities'),
        officeLocations: useFetchFilterOptions('employees/options/office_locations'),
        employeeTypes: useFetchFilterOptions('employees/options/employee_types'),
        employeeSubTypes: useFetchFilterOptions('employees/options/employee_sub_types'),
        applications: useFetchFilterOptions('applications'),
    };
    
    useEffect(() => {
        setFilters(prev => ({ ...prev, search: debouncedSearchTerm }));
        // --- FIX: Added missing dependency ---
        if (pagination.currentPage !== 1) {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    }, [debouncedSearchTerm, setFilters, setPagination, pagination.currentPage]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isFilterPopoverOpen && filterButtonRef.current && !filterButtonRef.current.contains(event.target) && popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsFilterPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterPopoverOpen]);
    
    const handleClearFilters = () => {
        setFilters({ 
            status: 'all', search: '', jobTitle: '', manager: '',
            legal_entity_id: '', office_location_id: '', employee_type_id: '', employee_sub_type_id: '',
            application_id: ''
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        setSearchInputValue('');
    };
    
    const areAdvancedFiltersActive = useMemo(() => {
        return Object.entries(filters).some(([key, value]) => {
            if (key === 'status') return value !== 'all';
            if (key === 'search') return false; 
            return !!value;
        });
    }, [filters]);

    const TableHeader = ({ children, columnKey }) => {
        const isSorted = sorting.sortBy === columnKey;
        const handleSort = () => {
            setSorting(prev => ({ sortBy: columnKey, sortOrder: isSorted && prev.sortOrder === 'asc' ? 'desc' : 'asc' }));
        };
        return (
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button onClick={handleSort} className="flex items-center w-full text-left">
                    <span>{children}</span>
                    <span className="ml-1.5">{isSorted ? (sorting.sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : (<ChevronsUpDown className="w-4 h-4 opacity-30" />)}</span>
                </button>
            </th>
        );
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white self-start sm:self-center">Employees</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search employees..." value={searchInputValue} onChange={e => setSearchInputValue(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                    </div>
                    <div className="relative">
                        <button ref={filterButtonRef} onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)} className={`flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${areAdvancedFiltersActive || isFilterPopoverOpen ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <FilterIcon size={16} />
                            <span>Advanced</span>
                            {areAdvancedFiltersActive && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                        </button>
                        <div ref={popoverRef}>
                            {isFilterPopoverOpen && (
                                <FilterPopover 
                                    initialFilters={filters} 
                                    onApply={setFilters} 
                                    onClear={handleClearFilters} 
                                    onClose={() => setIsFilterPopoverOpen(false)}
                                    options={filterOptions}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <FilterPills filters={filters} setFilters={setFilters} setSearchInputValue={setSearchInputValue} options={filterOptions} />
            
            <div className="mt-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <StatusQuickFilters currentStatus={filters.status} onStatusChange={(status) => { setFilters(prev => ({ ...prev, status })); setPagination(prev => ({...prev, currentPage: 1})); }}/>
                    
                    {/* --- FIX: Restored the Mobile Card View --- */}
                    <div className="md:hidden">
                        {employees.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {employees.map(emp => {
                                    const fullName = [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ');
                                    return (
                                        <div key={emp.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{fullName}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{emp.employee_email}</p>
                                                </div>
                                                <StatusBadge status={emp.status} />
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                <p>{emp.position_name}</p>
                                            </div>
                                            <div className="mt-3">
                                                <Link to={`/employees/${emp.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                    View Profile →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400"><p className="font-semibold">No employees found</p><p className="text-sm mt-1">Try adjusting your search or filter criteria.</p></div>
                        )}
                    </div>

                    {/* --- FIX: Ensured the Desktop Table is hidden on mobile --- */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <TableHeader columnKey="first_name">Employee</TableHeader>
                                    <TableHeader columnKey="employee_email">Email</TableHeader>
                                    <TableHeader columnKey="position_name">Job Title</TableHeader>
                                    <TableHeader columnKey="status">Status</TableHeader>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {employees.length > 0 ? employees.map(emp => {
                                    const fullName = [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ');
                                    return (
                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900 dark:text-white">{fullName}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{emp.employee_email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{emp.position_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={emp.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Link to={`/employees/${emp.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                    View Profile
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="5" className="text-center py-16 text-gray-500 dark:text-gray-400"><p className="font-semibold">No employees found</p><p className="text-sm mt-1">Try adjusting your search or filter criteria.</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={pagination} setPagination={setPagination} />
                </div>
            </div>
        </div>
    );
};