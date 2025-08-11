import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { DollarSign, Edit3, Save, X, Users, Tag } from "lucide-react";

import api from "../api/api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import { EmployeeListSkeleton } from "../components/ui/EmployeeListSkeleton";

// Helper to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const fetchLicenseData = async () => {
  const { data } = await api.get("/api/licenses");
  return data;
};

const updateLicenseCost = ({ applicationId, cost }) => {
  return api.put(`/api/licenses/${applicationId}`, { cost });
};

export const LicensesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];

  const [editingRow, setEditingRow] = useState(null); // Will hold the ID of the app being edited
  const [currentCost, setCurrentCost] = useState(0);

  const {
    data: licenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["licenses"],
    queryFn: fetchLicenseData,
  });

  const { mutate: updateCost, isPending: isUpdating } = useMutation({
    mutationFn: updateLicenseCost,
    onSuccess: () => {
      toast.success("License cost updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setEditingRow(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update cost.");
    },
  });

  const handleEditClick = (app) => {
    setEditingRow(app.id);
    setCurrentCost(app.cost_per_seat_monthly);
  };

  const handleSaveClick = (applicationId) => {
    updateCost({ applicationId, cost: parseFloat(currentCost) });
  };

  if (isLoading) {
    return <EmployeeListSkeleton count={8} />;
  }

  if (error) {
    return (
      <p className="p-6 text-center text-red-500">
        Error fetching license data: {error.message}
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Licenses & Costs
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage seat counts and the estimated monthly cost per application.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Assigned Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Cost / Seat (Monthly)
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Est. Monthly Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Est. Annual Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {licenses.map((app) => {
                const isEditing = editingRow === app.id;
                const monthlyCost =
                  app.assigned_seats * app.cost_per_seat_monthly;
                const annualCost = monthlyCost * 12;

                return (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {app.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Users size={16} /> {app.assigned_seats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={currentCost}
                            onChange={(e) => setCurrentCost(e.target.value)}
                            className="w-24 px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            step="0.01"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveClick(app.id)}
                            disabled={isUpdating}
                          >
                            <Save size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingRow(null)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {formatCurrency(app.cost_per_seat_monthly)}
                          </span>
                          {permissions.includes("license:manage") && (
                            <button
                              onClick={() => handleEditClick(app)}
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(monthlyCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(annualCost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
