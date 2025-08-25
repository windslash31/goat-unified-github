import React, { useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import api from "../../api/api";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";

const onboardApplication = (newData) =>
  api.post("/api/applications/onboard", newData);

export const AddApplicationModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    integration_mode: "MANUAL",
    jumpcloud_app_id: null,
  });

  const mutation = useMutation({
    mutationFn: onboardApplication,
    onSuccess: () => {
      toast.success("Application onboarded successfully!");
      queryClient.invalidateQueries({ queryKey: ["managedApplications"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    },
  });

  const handleNameChange = (e) => {
    const name = e.target.value;
    const key = name
      .toUpperCase()
      .replace(/ /g, "_")
      .replace(/[^A-Z0-9_]/g, "");
    setFormData((prev) => ({ ...prev, name, key }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = { ...formData };
    if (submissionData.integration_mode !== "SSO_JUMPCLOUD") {
      submissionData.jumpcloud_app_id = null;
    }
    mutation.mutate(submissionData);
  };

  const integrationOptions = [
    { id: "MANUAL", name: "Manual" },
    { id: "SSO_JUMPCLOUD", name: "JumpCloud SSO" },
  ];

  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm";
  const labelStyle =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold">Onboard New Application</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className={labelStyle}>
                  Application Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className={inputClasses}
                  placeholder="e.g., Salesforce"
                />
              </div>
              <div>
                <label htmlFor="key" className={labelStyle}>
                  Unique Key (Auto-generated)
                </label>
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={formData.key}
                  onChange={handleChange}
                  required
                  className={`${inputClasses} bg-gray-100 dark:bg-gray-800`}
                />
              </div>
              <div>
                <label htmlFor="integration_mode" className={labelStyle}>
                  Integration Type
                </label>
                <CustomSelect
                  id="integration_mode"
                  value={formData.integration_mode}
                  options={integrationOptions}
                  onChange={(value) =>
                    handleSelectChange("integration_mode", value)
                  }
                />
              </div>

              {formData.integration_mode === "SSO_JUMPCLOUD" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label htmlFor="jumpcloud_app_id" className={labelStyle}>
                    JumpCloud Application ID
                  </label>
                  <input
                    type="text"
                    id="jumpcloud_app_id"
                    name="jumpcloud_app_id"
                    onChange={handleChange}
                    required
                    className={inputClasses}
                    placeholder="Paste the ID from JumpCloud URL"
                  />
                </motion.div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Onboard Application"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
