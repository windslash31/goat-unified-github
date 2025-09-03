import React, { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import api from "../../api/api";
import { Button } from "./Button";

const bulkUpdateEmployees = (updatePayload) =>
  api.post("/api/employees/bulk-update", updatePayload);

export const BulkUpdateStatusModal = ({ selectedIds, onClose, onSuccess }) => {
  const [newStatus, setNewStatus] = useState(null); // Will be 'true' or 'false'

  const { mutate, isPending } = useMutation({
    mutationFn: bulkUpdateEmployees,
    onSuccess: (data) => {
      toast.success(data.message || "Employees updated successfully!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStatus === null) {
      toast.error("Please select a new status.");
      return;
    }
    mutate({
      employeeIds: selectedIds,
      updateData: { is_active: newStatus },
    });
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold">Bulk Change Status</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are about to change the status for{" "}
                <span className="font-bold text-kredivo-primary">
                  {selectedIds.length}
                </span>{" "}
                selected employee(s).
              </p>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Status
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 dark:bg-gray-900 p-1">
                  <button
                    type="button"
                    onClick={() => setNewStatus(true)}
                    className={`w-full text-center rounded-md p-2 text-sm font-semibold transition-colors ${
                      newStatus === true
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus(false)}
                    className={`w-full text-center rounded-md p-2 text-sm font-semibold transition-colors ${
                      newStatus === false
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 shadow"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || newStatus === null}>
                {isPending
                  ? "Updating..."
                  : `Update ${selectedIds.length} Employees`}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
