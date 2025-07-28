import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import api from "../../api/api";
import { Button } from "../../components/ui/Button";
import { CustomSelect } from "../../components/ui/CustomSelect";

const fetchEmployees = async () => {
  try {
    const response = await api.get("/api/employees?limit=1000&status=active");
    return response.data?.employees || [];
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    toast.error("Could not load the list of owners.");
    return [];
  }
};

const createAccount = (newData) => api.post("/api/managed-accounts", newData);
const updateAccount = ({ id, ...updateData }) =>
  api.put(`/api/managed-accounts/${id}`, updateData);

const ManagedAccountFormModal = ({ account, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    account_identifier: "",
    account_type: "SHARED_ACCOUNT",
    description: "",
    owner_employee_id: "",
    status: "ACTIVE",
  });

  const isEditMode = Boolean(account?.id);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["activeEmployees"],
    queryFn: fetchEmployees,
  });

  const mutation = useMutation({
    mutationFn: isEditMode ? updateAccount : createAccount,
    onSuccess: () => {
      toast.success(
        `Account ${isEditMode ? "updated" : "created"} successfully!`
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    },
  });

  useEffect(() => {
    if (isEditMode && account) {
      setFormData({
        name: account.name || "",
        account_identifier: account.account_identifier || "",
        account_type: account.account_type || "SHARED_ACCOUNT",
        description: account.description || "",
        owner_employee_id: account.owner_employee_id?.toString() || "",
        status: account.status || "ACTIVE",
      });
    }
  }, [account, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      owner_employee_id: formData.owner_employee_id
        ? parseInt(formData.owner_employee_id, 10)
        : null,
    };
    mutation.mutate(
      isEditMode ? { id: account.id, ...submissionData } : submissionData
    );
  };

  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-kredivo-primary focus:border-kredivo-primary text-gray-900 dark:text-gray-200";
  const labelStyle =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const ownerOptions = employees.map((emp) => ({
    id: emp.id.toString(),
    name: `${emp.first_name} ${emp.last_name}`,
  }));

  const accountTypeOptions = [
    { id: "SHARED_ACCOUNT", name: "Shared Account" },
    { id: "SERVICE_ACCOUNT", name: "Service Account" },
    { id: "SYSTEM_BOT", name: "System Bot" },
  ];

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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? "Edit" : "Create"} Managed Account
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className={labelStyle}>
                  Account Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                  placeholder="e.g., Marketing Team Shared Login"
                />
              </div>
              <div>
                <label htmlFor="account_identifier" className={labelStyle}>
                  Account Identifier (e.g., email)
                </label>
                <input
                  type="text"
                  id="account_identifier"
                  name="account_identifier"
                  value={formData.account_identifier}
                  onChange={handleChange}
                  required
                  className={inputClasses}
                  placeholder="marketing@example.com"
                />
              </div>
              <div>
                <label htmlFor="account_type" className={labelStyle}>
                  Account Type
                </label>
                <CustomSelect
                  id="account_type"
                  value={formData.account_type}
                  options={accountTypeOptions}
                  onChange={(value) =>
                    handleSelectChange("account_type", value)
                  }
                />
              </div>
              <div>
                <label htmlFor="owner_employee_id" className={labelStyle}>
                  Owner (PIC)
                </label>
                <CustomSelect
                  id="owner_employee_id"
                  value={formData.owner_employee_id}
                  options={ownerOptions}
                  onChange={(value) =>
                    handleSelectChange("owner_employee_id", value)
                  }
                  placeholder={
                    isLoadingEmployees ? "Loading owners..." : "Select an owner"
                  }
                  disabled={isLoadingEmployees}
                />
              </div>
              <div>
                <label htmlFor="description" className={labelStyle}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`${inputClasses} min-h-[80px]`}
                  placeholder="Briefly describe the purpose of this account."
                />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Account"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ManagedAccountFormModal;
