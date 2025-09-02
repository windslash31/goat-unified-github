import React, { useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import api from "../../api/api";
import { Button } from "./Button";

const updateApplication = ({ id, ...updateData }) =>
  api.put(`/api/applications/${id}`, updateData);

export const EditApplicationModal = ({ application, onClose }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(application.name);

  const mutation = useMutation({
    mutationFn: updateApplication,
    onSuccess: () => {
      toast.success("Application updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["managedApplications"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === application.name) {
      toast("No changes were made.");
      onClose();
      return;
    }
    mutation.mutate({ id: application.id, name: name.trim() });
  };

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
            <h3 className="text-xl font-semibold">Edit Application</h3>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="key" className={labelStyle}>
                  Unique Key (Read-only)
                </label>
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={application.key}
                  readOnly
                  className={`${inputClasses} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
                />
              </div>
              <div>
                <label htmlFor="integration_mode" className={labelStyle}>
                  Integration Type (Read-only)
                </label>
                <input
                  type="text"
                  id="integration_mode"
                  name="integration_mode"
                  value={application.integration_mode}
                  readOnly
                  className={`${inputClasses} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
                />
              </div>
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
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
