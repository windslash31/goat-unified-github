import React, { useState } from "react";
import toast from "react-hot-toast";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";

const PlatformIcon = ({ platform }) => {
  const icons = { google: "G", slack: "S", jumpcloud: "J", atlassian: "A" };
  const colors = {
    google: "bg-red-500",
    slack: "bg-purple-500",
    jumpcloud: "bg-orange-500",
    atlassian: "bg-blue-500",
  };
  return (
    <div
      className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm ${
        colors[platform] || "bg-gray-500"
      }`}
    >
      {icons[platform] || "?"}
    </div>
  );
};

export const DeactivateEmployeeModal = ({
  employee,
  onClose,
  onDeactivateSuccess,
}) => {
  const platforms = ["google", "slack", "jumpcloud", "atlassian"];
  const [selectedPlatforms, setSelectedPlatforms] = useState(platforms);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleToggleAll = () => {
    if (selectedPlatforms.length === platforms.length) setSelectedPlatforms([]);
    else setSelectedPlatforms(platforms);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data } = await api.post(
        `/api/employees/${employee.id}/deactivate`,
        { platforms: selectedPlatforms }
      );

      const successCount = data.results.filter(
        (r) => r.status === "SUCCESS"
      ).length;
      const failCount = data.results.filter(
        (r) => r.status === "FAILED"
      ).length;
      toast.success(
        `Suspension process finished. Success: ${successCount}, Failed: ${failCount}.`
      );

      if (onDeactivateSuccess) {
        onDeactivateSuccess();
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manual Platform Suspension
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-start">
              <ShieldAlert className="h-8 w-8 text-red-500 mr-4 flex-shrink-0" />
              <div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manually suspend{" "}
                  <span className="font-bold">
                    {employee.first_name} {employee.last_name}
                  </span>
                  's access to external platforms. This is a failsafe and does
                  not change their status in this application.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="toggle-all" className="font-semibold text-sm">
                    Suspend All Platforms
                  </label>
                  <button
                    onClick={handleToggleAll}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedPlatforms.length === platforms.length
                        ? "bg-red-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedPlatforms.length === platforms.length
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 pt-3">
                  {platforms.map((platform) => (
                    <div
                      key={platform}
                      className="flex justify-between items-center p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={platform} />
                        <span className="font-medium capitalize">
                          {platform}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggle(platform)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          selectedPlatforms.includes(platform)
                            ? "bg-red-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            selectedPlatforms.includes(platform)
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full mt-3 sm:mt-0 sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedPlatforms.length === 0}
              className="w-full sm:w-auto sm:ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Suspending..."
                : `Confirm Suspension (${selectedPlatforms.length})`}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
