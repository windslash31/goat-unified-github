import React, { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "./Button";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";

export const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { oldPassword, newPassword } = formData;
      await api.post("/api/users/change-password", {
        oldPassword,
        newPassword,
      });
      toast.success("Password changed successfully!");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = [
    "At least 8 characters long",
    "Contains at least one uppercase letter",
    "Contains at least one lowercase letter",
    "Contains at least one number",
    "Contains at least one special character",
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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h3>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="oldPassword">Old Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    id="oldPassword"
                    required
                    value={formData.oldPassword}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="font-semibold">
                    Password must meet the following requirements:
                  </p>
                  <ul className="list-disc list-inside">
                    {passwordRequirements.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="primary">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
