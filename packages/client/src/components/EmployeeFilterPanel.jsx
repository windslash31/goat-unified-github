import React from 'react';
import { X } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';

export const EmployeeFilterPanel = ({ filters, onFilterChange, onClear, onClose }) => {
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    const handleSelectChange = (name, value) => {
        onFilterChange({ ...filters, [name]: value });
    };

    const statusOptions = [
        { id: 'all', name: 'All' },
        { id: 'active', name: 'Active' },
        { id: 'escalation', name: 'For Escalation' },
        { id: 'inactive', name: 'Inactive' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={20} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <CustomSelect
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={(value) => handleSelectChange('status', value)}
                        options={statusOptions}
                    />
                </div>

                {/* Job Title Filter */}
                <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
                    <input
                        type="text"
                        name="jobTitle"
                        id="jobTitle"
                        value={filters.jobTitle}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"
                        placeholder="e.g., Engineer"
                    />
                </div>

                {/* Manager Filter */}
                <div>
                    <label htmlFor="manager" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manager Email</label>
                    <input
                        type="text"
                        name="manager"
                        id="manager"
                        value={filters.manager}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"
                        placeholder="manager@example.com"
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    onClick={onClear}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};