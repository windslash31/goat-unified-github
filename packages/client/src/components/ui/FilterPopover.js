import React, { useState, useEffect } from 'react';
import { CustomSelect } from './CustomSelect';

const FilterDropdown = ({ label, name, value, onChange, options = [] }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <CustomSelect
            id={name}
            options={options}
            value={value}
            onChange={(val) => onChange({ target: { name, value: val }})}
            placeholder="All"
        />
    </div>
);

export const FilterPopover = ({ initialFilters, onApply, onClear, onClose, options }) => {
    const [localFilters, setLocalFilters] = useState(initialFilters);

    useEffect(() => {
        setLocalFilters(initialFilters);
    }, [initialFilters]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyClick = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClearClick = () => {
        onClear();
        onClose();
    };
    
    return (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20">
            <div className="p-5">
                <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
                
                <div className="space-y-4">
                    <FilterDropdown label="Internal Application" name="application_id" value={localFilters.application_id} onChange={handleInputChange} options={options.applications} />

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                            <input type="text" name="jobTitle" id="jobTitle" value={localFilters.jobTitle || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-kredivo-primary" placeholder="e.g., Engineer"/>
                        </div>
                        <div>
                            <label htmlFor="manager" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager Email</label>
                            <input type="text" name="manager" id="manager" value={localFilters.manager || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-kredivo-primary" placeholder="manager@example.com"/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <FilterDropdown label="Legal Entity" name="legal_entity_id" value={localFilters.legal_entity_id} onChange={handleInputChange} options={options.legalEntities} />
                        <FilterDropdown label="Office Location" name="office_location_id" value={localFilters.office_location_id} onChange={handleInputChange} options={options.officeLocations} />
                        <FilterDropdown label="Employee Type" name="employee_type_id" value={localFilters.employee_type_id} onChange={handleInputChange} options={options.employeeTypes} />
                        <FilterDropdown label="Employee Sub-Type" name="employee_sub_type_id" value={localFilters.employee_sub_type_id} onChange={handleInputChange} options={options.employeeSubTypes} />
                    </div>
                </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center rounded-b-lg">
                <button onClick={handleClearClick} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">Clear All</button>
                <button onClick={handleApplyClick} className="px-6 py-2 bg-kredivo-primary text-white font-semibold rounded-md shadow-sm hover:bg-kredivo-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kredivo-primary">
                    Apply Filters
                </button>
            </div>
        </div>
    );
};