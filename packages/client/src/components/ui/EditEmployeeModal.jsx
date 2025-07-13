import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { CustomSelect } from "./CustomSelect";
import { motion, AnimatePresence } from "framer-motion";
import { useFetchFilterOptions } from "../../hooks/useFetchFilterOptions"; // Corrected import
import api from "../../api/api";

// The local 'useFetchOptions' hook should be removed from here if it still exists.

export const EditEmployeeModal = ({ employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...employee });

  // These calls will now work correctly because the hook is properly imported.
  const legalEntities = useFetchFilterOptions(
    "employees/options/legal_entities"
  );
  const officeLocations = useFetchFilterOptions(
    "employees/options/office_locations"
  );
  const employeeTypes = useFetchFilterOptions(
    "employees/options/employee_types"
  );
  const employeeSubTypes = useFetchFilterOptions(
    "employees/options/employee_sub_types"
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const changes = {};
    for (const key in formData) {
      const originalValue = employee[key] ?? "";
      const currentValue = formData[key] ?? "";
      if (key === "is_active" && originalValue !== currentValue) {
        changes[key] = currentValue;
      } else if (String(originalValue) !== String(currentValue)) {
        changes[key] = currentValue === "" ? null : currentValue;
      }
    }

    if (Object.keys(changes).length === 0) {
      toast("No changes were made.");
      onClose();
      return;
    }

    const promise = api.put(`/api/employees/${employee.id}`, changes);

    toast.promise(promise, {
      loading: "Saving changes...",
      success: "Employee updated successfully!",
      error: (err) =>
        err.response?.data?.message || "Could not update employee.",
    });

    promise
      .then((res) => onSave(res.data.employee))
      .catch((err) => console.error(err));
  };

  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kredivo-primary focus:border-kredivo-primary text-gray-900 dark:text-gray-200";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit {employee.first_name}'s Profile
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              <Section title="Identity & Role">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      id="first_name"
                      value={formData.first_name || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="middle_name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middle_name"
                      id="middle_name"
                      value={formData.middle_name || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      id="last_name"
                      value={formData.last_name || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="position_name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Position
                    </label>
                    <input
                      type="text"
                      name="position_name"
                      id="position_name"
                      value={formData.position_name || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="position_level"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Position Level
                    </label>
                    <input
                      type="text"
                      name="position_level"
                      id="position_level"
                      value={formData.position_level || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="manager_email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Manager Email
                    </label>
                    <input
                      type="email"
                      name="manager_email"
                      id="manager_email"
                      value={formData.manager_email || ""}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="manager@example.com"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Employment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="legal_entity_id"
                      className="block text-sm font-medium"
                    >
                      Legal Entity
                    </label>
                    <div className="mt-1">
                      <CustomSelect
                        id="legal_entity_id"
                        options={legalEntities}
                        value={formData.legal_entity_id}
                        onChange={(value) =>
                          handleSelectChange("legal_entity_id", value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="office_location_id"
                      className="block text-sm font-medium"
                    >
                      Office Location
                    </label>
                    <div className="mt-1">
                      <CustomSelect
                        id="office_location_id"
                        options={officeLocations}
                        value={formData.office_location_id}
                        onChange={(value) =>
                          handleSelectChange("office_location_id", value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="employee_type_id"
                      className="block text-sm font-medium"
                    >
                      Employee Type
                    </label>
                    <div className="mt-1">
                      <CustomSelect
                        id="employee_type_id"
                        options={employeeTypes}
                        value={formData.employee_type_id}
                        onChange={(value) =>
                          handleSelectChange("employee_type_id", value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="employee_sub_type_id"
                      className="block text-sm font-medium"
                    >
                      Employee Sub-Type
                    </label>
                    <div className="mt-1">
                      <CustomSelect
                        id="employee_sub_type_id"
                        options={employeeSubTypes}
                        value={formData.employee_sub_type_id}
                        onChange={(value) =>
                          handleSelectChange("employee_sub_type_id", value)
                        }
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="asset_name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Asset Name
                    </label>
                    <input
                      type="text"
                      name="asset_name"
                      id="asset_name"
                      value={formData.asset_name || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Timeline & Status">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <label
                      htmlFor="is_active_toggle"
                      className="block text-sm font-medium mr-4"
                    >
                      Employee Status
                    </label>
                    <button
                      type="button"
                      id="is_active_toggle"
                      onClick={() =>
                        handleToggleChange("is_active", !formData.is_active)
                      }
                      className={`${
                        formData.is_active
                          ? "bg-kredivo-primary"
                          : "bg-gray-200 dark:bg-gray-600"
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                      <span
                        className={`${
                          formData.is_active ? "translate-x-6" : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                    <span
                      className={`ml-3 text-sm font-semibold ${
                        formData.is_active
                          ? "text-kredivo-primary"
                          : "text-gray-500"
                      }`}
                    >
                      {formData.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div></div>
                  <div>
                    <label
                      htmlFor="join_date"
                      className="block text-sm font-medium"
                    >
                      Join Date
                    </label>
                    <input
                      type="date"
                      name="join_date"
                      id="join_date"
                      value={formatDateForInput(formData.join_date)}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="date_of_exit_at_date"
                      className="block text-sm font-medium"
                    >
                      Exit Date
                    </label>
                    <input
                      type="date"
                      name="date_of_exit_at_date"
                      id="date_of_exit_at_date"
                      value={formatDateForInput(formData.date_of_exit_at_date)}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="access_cut_off_date_at_date"
                      className="block text-sm font-medium"
                    >
                      Access Cut-off Date
                    </label>
                    <input
                      type="date"
                      name="access_cut_off_date_at_date"
                      id="access_cut_off_date_at_date"
                      value={formatDateForInput(
                        formData.access_cut_off_date_at_date
                      )}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Related Tickets">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="onboarding_ticket"
                      className="block text-sm font-medium"
                    >
                      Onboarding Ticket
                    </label>
                    <input
                      type="text"
                      name="onboarding_ticket"
                      id="onboarding_ticket"
                      value={formData.onboarding_ticket || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="offboarding_ticket"
                      className="block text-sm font-medium"
                    >
                      Offboarding Ticket
                    </label>
                    <input
                      type="text"
                      name="offboarding_ticket"
                      id="offboarding_ticket"
                      value={formData.offboarding_ticket || ""}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </Section>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={onClose} variant="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Section = ({ title, children }) => (
  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 first:border-t-0 first:pt-0">
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {title}
    </h4>
    {children}
  </div>
);
