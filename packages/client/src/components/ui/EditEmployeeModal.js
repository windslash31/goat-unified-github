import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// A helper to fetch data for our dropdowns
const useFetchOptions = (tableName, token) => {
    const [options, setOptions] = useState([]);
    useEffect(() => {
        const fetchOptions = async () => {
            if (!tableName || !token) return;
            try {
                const url = `${process.env.REACT_APP_API_BASE_URL}/api/employees/options/${tableName}`;
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setOptions(data);
            } catch (error) {
                console.error(`Failed to fetch options from ${tableName}:`, error);
                setOptions([]);
            }
        };
        fetchOptions();
    }, [tableName, token]);
    return options;
};

export const EditEmployeeModal = ({ employee, onClose, onSave }) => {
    const [formData, setFormData] = useState({ ...employee });
    const token = localStorage.getItem('accessToken');

    const legalEntities = useFetchOptions('legal_entities', token);
    const officeLocations = useFetchOptions('office_locations', token);
    const employeeTypes = useFetchOptions('employee_types', token);
    const employeeSubTypes = useFetchOptions('employee_sub_types', token);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleToggleChange = (field, value) => {
        setFormData(prev => ({...prev, [field]: value }));
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const changes = {};
        for (const key in formData) {
            const originalValue = employee[key] ?? '';
            const currentValue = formData[key] ?? '';
            if (key === 'is_active' && originalValue !== currentValue) {
                 changes[key] = currentValue;
            } else if (String(originalValue) !== String(currentValue)) {
                changes[key] = currentValue === '' ? null : currentValue;
            }
        }
        
        if (Object.keys(changes).length === 0) {
            toast('No changes were made.');
            onClose();
            return;
        }

        const promise = fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employee.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(changes)
        });

        toast.promise(promise, {
            loading: 'Saving changes...',
            success: 'Employee updated successfully!',
            error: (err) => err.message || 'Could not update employee.',
        });

        promise
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.message) });
                }
                return res.json();
            })
            .then(data => onSave(data.employee))
            .catch(err => console.error(err));
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-200";
    const baseButtonStyles = "px-4 py-2 text-sm font-semibold rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
    const primaryButtonStyles = "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
    const secondaryButtonStyles = "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-gray-500";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit {employee.first_name}'s Profile</h3>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        <Section title="Identity & Role">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                                    <input type="text" name="first_name" id="first_name" value={formData.first_name || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                                    <input type="text" name="middle_name" id="middle_name" value={formData.middle_name || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                                    <input type="text" name="last_name" id="last_name" value={formData.last_name || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label htmlFor="position_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
                                    <input type="text" name="position_name" id="position_name" value={formData.position_name || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="position_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position Level</label>
                                    <input type="text" name="position_level" id="position_level" value={formData.position_level || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="manager_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manager Email</label>
                                    <input type="email" name="manager_email" id="manager_email" value={formData.manager_email || ''} onChange={handleChange} className={inputClasses} placeholder="manager@example.com"/>
                                </div>
                            </div>
                        </Section>

                        <Section title="Employment Details">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                    <label htmlFor="legal_entity_id" className="block text-sm font-medium">Legal Entity</label>
                                    <select name="legal_entity_id" id="legal_entity_id" value={formData.legal_entity_id || ''} onChange={handleChange} className={inputClasses}>
                                        <option value="">Select...</option>
                                        {legalEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="office_location_id" className="block text-sm font-medium">Office Location</label>
                                    <select name="office_location_id" id="office_location_id" value={formData.office_location_id || ''} onChange={handleChange} className={inputClasses}>
                                        <option value="">Select...</option>
                                        {officeLocations.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="employee_type_id" className="block text-sm font-medium">Employee Type</label>
                                    <select name="employee_type_id" id="employee_type_id" value={formData.employee_type_id || ''} onChange={handleChange} className={inputClasses}>
                                         <option value="">Select...</option>
                                        {employeeTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="employee_sub_type_id" className="block text-sm font-medium">Employee Sub-Type</label>
                                    <select name="employee_sub_type_id" id="employee_sub_type_id" value={formData.employee_sub_type_id || ''} onChange={handleChange} className={inputClasses}>
                                         <option value="">Select...</option>
                                        {employeeSubTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="asset_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</label>
                                    <input type="text" name="asset_name" id="asset_name" value={formData.asset_name || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                            </div>
                        </Section>

                        <Section title="Timeline & Status">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <label htmlFor="is_active_toggle" className="block text-sm font-medium mr-4">Employee Status</label>
                                    <button
                                        type="button"
                                        id="is_active_toggle"
                                        onClick={() => handleToggleChange('is_active', !formData.is_active)}
                                        className={`${formData.is_active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                                    >
                                        <span className={`${formData.is_active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                    </button>
                                    <span className={`ml-3 text-sm font-semibold ${formData.is_active ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {formData.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div></div>
                                <div>
                                    <label htmlFor="join_date" className="block text-sm font-medium">Join Date</label>
                                    <input type="date" name="join_date" id="join_date" value={formatDateForInput(formData.join_date)} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="date_of_exit_at_date" className="block text-sm font-medium">Exit Date</label>
                                    <input type="date" name="date_of_exit_at_date" id="date_of_exit_at_date" value={formatDateForInput(formData.date_of_exit_at_date)} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="access_cut_off_date_at_date" className="block text-sm font-medium">Access Cut-off Date</label>
                                    <input type="date" name="access_cut_off_date_at_date" id="access_cut_off_date_at_date" value={formatDateForInput(formData.access_cut_off_date_at_date)} onChange={handleChange} className={inputClasses}/>
                                </div>
                            </div>
                        </Section>

                        <Section title="Related Tickets">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="onboarding_ticket" className="block text-sm font-medium">Onboarding Ticket</label>
                                    <input type="text" name="onboarding_ticket" id="onboarding_ticket" value={formData.onboarding_ticket || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                                <div>
                                    <label htmlFor="offboarding_ticket" className="block text-sm font-medium">Offboarding Ticket</label>
                                    <input type="text" name="offboarding_ticket" id="offboarding_ticket" value={formData.offboarding_ticket || ''} onChange={handleChange} className={inputClasses}/>
                                </div>
                            </div>
                        </Section>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                         <button
                            type="button"
                            onClick={onClose}
                            className={`${baseButtonStyles} ${secondaryButtonStyles}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`${baseButtonStyles} ${primaryButtonStyles}`}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// A simple component to visually group sections of the form
const Section = ({ title, children }) => (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 first:border-t-0 first:pt-0">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h4>
        {children}
    </div>
);