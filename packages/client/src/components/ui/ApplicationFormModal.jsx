// packages/client/src/components/ui/ApplicationFormModal.jsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";
// --- 1. IMPORT THE PORTAL COMPONENT ---
import { Portal } from "./Portal";

// A simple Switch component for the toggle
const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`${
      checked ? "bg-kredivo-primary" : "bg-gray-300 dark:bg-gray-600"
    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
  >
    <span
      className={`${
        checked ? "translate-x-6" : "translate-x-1"
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </button>
);

export const ApplicationFormModal = ({ app, onClose, onSave, isSaving }) => {
  const isEditMode = Boolean(app?.id);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    type: "EXTERNAL",
    is_licensable: true,
  });

  useEffect(() => {
    if (isEditMode) {
      // Ensure is_licensable has a boolean value
      setFormData({ ...app, is_licensable: app.is_licensable ?? true });
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        type: "EXTERNAL",
        is_licensable: true,
      });
    }
  }, [app, isEditMode]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSelectChange = (name, value) =>
    setFormData({ ...formData, [name]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const typeOptions = [
    { id: "EXTERNAL", name: "External" },
    { id: "INTERNAL", name: "Internal" },
  ];

  return (
    // --- 2. WRAP EVERYTHING IN THE PORTAL ---
    <Portal>
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
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
          >
            <form onSubmit={handleSubmit}>
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isEditMode ? "Edit" : "Create"} Application
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <CustomSelect
                    value={formData.type}
                    options={typeOptions}
                    onChange={(val) => handleSelectChange("type", val)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <input
                    name="category"
                    value={formData.category || ""}
                    onChange={handleChange}
                    placeholder="e.g., Core, Design, Productivity"
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 min-h-[60px]"
                  ></textarea>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600">
                  <div>
                    <label className="font-medium">
                      Track Licenses & Costs
                    </label>
                    <p className="text-sm text-gray-500">
                      Show this app on the Licenses & Costs page.
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_licensable}
                    onChange={(val) => handleSelectChange("is_licensable", val)}
                  />
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};
