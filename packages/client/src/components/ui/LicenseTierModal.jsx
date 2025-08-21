// In packages/client/src/components/ui/LicenseTierModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
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

  const handleAddTier = () => {
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
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm";
  const labelStyle =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <motion.div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
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

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <h4 className="font-semibold">Add New Tier</h4>
          <div className="grid grid-cols-2 gap-4">
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
              className={`${inputClasses} disabled:bg-gray-200 dark:disabled:bg-gray-800`}
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
            <label htmlFor="is_unlimited" className={labelStyle}>
              This tier has unlimited seats
            </label>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddTier}
            className="w-full justify-center"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              "Adding..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Tier
              </>
            )}
          </Button>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold">Existing Tiers</h4>
            {isLoading && <p>Loading tiers...</p>}
            {licenses && licenses.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No license tiers have been added for this application yet.
              </p>
            )}
            {licenses?.map((lic) => (
              <div
                key={lic.id}
                className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md"
              >
                <p>
                  {lic.tier_name} - $
                  {parseFloat(lic.monthly_cost || 0).toFixed(2)} (
                  {lic.is_unlimited ? "Unlimited" : `${lic.total_seats} seats`})
                </p>
                {/* Edit/Delete buttons can be added here in the future */}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
