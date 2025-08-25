import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader } from "lucide-react";
import api from "../../api/api";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";

// API fetching functions
const fetchLicensableApps = () =>
  api.get("/api/applications?is_licensable=true").then((res) => res.data);

const fetchAppTiers = (appId) => {
  if (!appId) return Promise.resolve([]);
  return api.get(`/api/licenses/${appId}`).then((res) => res.data);
};

const assignLicenseMutationFn = (assignmentData) =>
  api.post("/api/licenses/assignments", assignmentData);

export const AssignLicenseModal = ({ employee, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedTierName, setSelectedTierName] = useState("");

  // Fetch licensable applications
  const { data: apps, isLoading: isLoadingApps } = useQuery({
    queryKey: ["licensableApps"],
    queryFn: fetchLicensableApps,
  });

  // Fetch license tiers when an application is selected
  const { data: tiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ["licenseTiers", selectedAppId],
    queryFn: () => fetchAppTiers(selectedAppId),
    enabled: !!selectedAppId,
  });

  // Mutation for assigning the license
  const mutation = useMutation({
    mutationFn: assignLicenseMutationFn,
    onSuccess: () => {
      toast.success("License assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to assign license.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      employeeId: employee.id,
      applicationId: selectedAppId,
      tierName: selectedTierName,
    });
  };

  const appOptions =
    apps?.map((app) => ({ id: app.id.toString(), name: app.name })) || [];

  const tierOptions =
    tiers?.map((tier) => ({ id: tier.tier_name, name: tier.tier_name })) || [];

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
            <h3 className="text-xl font-semibold">
              Assign License to {employee.first_name}
            </h3>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Application
                </label>
                <CustomSelect
                  options={appOptions}
                  value={selectedAppId}
                  onChange={(val) => {
                    setSelectedAppId(val);
                    setSelectedTierName(""); // Reset tier when app changes
                  }}
                  placeholder={
                    isLoadingApps ? "Loading..." : "Select an application"
                  }
                  disabled={isLoadingApps}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  License Tier
                </label>
                <CustomSelect
                  options={tierOptions}
                  value={selectedTierName}
                  onChange={setSelectedTierName}
                  placeholder={isLoadingTiers ? "Loading..." : "Select a tier"}
                  disabled={!selectedAppId || isLoadingTiers}
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
              <Button
                type="submit"
                disabled={!selectedTierName || mutation.isPending}
              >
                {mutation.isPending ? "Assigning..." : "Assign License"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
