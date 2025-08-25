// packages/client/src/components/ui/LicenseTierModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Loader, Tag } from "lucide-react";
import api from "../../api/api";
import { Button } from "./Button";

const fetchLicenses = (appId) =>
  api.get(`/api/licenses/${appId}`).then((res) => res.data);
const addLicense = ({ appId, licenseData }) =>
  api.post(`/api/licenses/${appId}`, licenseData);

export const LicenseTierModal = ({ application, onClose }) => {
  const queryClient = useQueryClient();
  const appId = application.id;

  const { data: licenses, isLoading } = useQuery({
    queryKey: ["licenses", appId],
    queryFn: () => fetchLicenses(appId),
  });

  const [currentLicense, setCurrentLicense] = useState({
    tier_name: "",
    monthly_cost: "",
    total_seats: "",
    is_unlimited: false,
  });

  const mutation = useMutation({
    mutationFn: addLicense,
    onSuccess: () => {
      toast.success("License tier added successfully!");
      queryClient.invalidateQueries({ queryKey: ["licenses", appId] });
      setCurrentLicense({
        tier_name: "",
        monthly_cost: "",
        total_seats: "",
        is_unlimited: false,
      });
    },
    onError: (error) =>
      toast.error(
        error.response?.data?.message || "Failed to add license tier."
      ),
  });

  const handleLicenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setCurrentLicense((prev) => ({ ...prev, [name]: val }));
  };

  const handleAddTier = (e) => {
    e.preventDefault();
    if (!currentLicense.tier_name || !currentLicense.monthly_cost) {
      toast.error("Tier Name and Cost are required.");
      return;
    }
    if (!currentLicense.is_unlimited && !currentLicense.total_seats) {
      toast.error("Please provide the total number of seats.");
      return;
    }
    mutation.mutate({ appId, licenseData: currentLicense });
  };

  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500";
  const labelStyle =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              Manage License Tiers for {application.name}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-8">
            <form
              onSubmit={handleAddTier}
              className="p-4 border border-dashed dark:border-gray-700 rounded-lg space-y-4"
            >
              <h4 className="font-semibold text-lg">Add New Tier</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tier_name" className={labelStyle}>
                    Tier Name
                  </label>
                  <input
                    type="text"
                    name="tier_name"
                    value={currentLicense.tier_name}
                    onChange={handleLicenceChange}
                    className={inputClasses}
                    placeholder="e.g., E5, Pro"
                  />
                </div>
                <div>
                  <label htmlFor="monthly_cost" className={labelStyle}>
                    Monthly Cost (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="monthly_cost"
                    value={currentLicense.monthly_cost}
                    onChange={handleLicenceChange}
                    className={inputClasses}
                    placeholder="e.g., 57.00"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="total_seats" className={labelStyle}>
                  Total Seats
                </label>
                <input
                  type="number"
                  name="total_seats"
                  value={currentLicense.total_seats}
                  onChange={handleLicenceChange}
                  className={`${inputClasses} disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed`}
                  placeholder="e.g., 100"
                  disabled={currentLicense.is_unlimited}
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_unlimited"
                  name="is_unlimited"
                  checked={currentLicense.is_unlimited}
                  onChange={handleLicenceChange}
                  className="h-4 w-4 rounded accent-kredivo-primary"
                />
                <label
                  htmlFor="is_unlimited"
                  className={`${labelStyle} cursor-pointer`}
                >
                  This tier has unlimited seats
                </label>
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="w-full sm:w-auto justify-center"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {mutation.isPending ? "Adding..." : "Add Tier"}
              </Button>
            </form>

            <div className="space-y-3 pt-6 border-t dark:border-gray-700">
              <h4 className="font-semibold text-lg">Existing Tiers</h4>
              {isLoading && (
                <p className="text-sm text-center py-4">Loading tiers...</p>
              )}
              {!isLoading && licenses?.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <Tag className="mx-auto w-12 h-12 text-gray-400" />
                  <p className="font-semibold mt-4">No Tiers Found</p>
                  <p className="text-sm mt-1">
                    Add a license tier to get started.
                  </p>
                </div>
              )}
              {licenses?.map((lic) => (
                <div
                  key={lic.id}
                  className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md"
                >
                  <div>
                    <p className="font-semibold">{lic.tier_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lic.is_unlimited
                        ? "Unlimited Seats"
                        : `${lic.total_seats} seats`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${parseFloat(lic.monthly_cost || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
