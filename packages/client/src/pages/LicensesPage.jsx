import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { DollarSign, Edit3, Save, X, Search, Download } from "lucide-react";

import api from "../api/api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import { EmployeeListSkeleton } from "../components/ui/EmployeeListSkeleton";
import { useDebounce } from "../hooks/useDebounce";
import { AppAssignmentsModal } from "../components/ui/AppAssignmentsModal";

// --- Helper Functions ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
};

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    toast.error("No data to export.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csv = [headers.join(",")]
    .concat(
      data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const fetchLicenseData = async () => {
  const { data } = await api.get("/api/licenses");
  return data.filter((app) => app.name !== "Atlassian");
};

const updateLicenseCost = ({ applicationId, cost, total_seats }) => {
  return api.put(`/api/licenses/${applicationId}`, { cost, total_seats });
};

export const LicensesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];

  const [editingRowId, setEditingRowId] = useState(null);
  const [editingData, setEditingData] = useState({ cost: 0, seats: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const {
    data: licenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["licenses"],
    queryFn: fetchLicenseData,
  });

  const { mutate: updateCostMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateLicenseCost,
    onSuccess: () => {
      toast.success("License cost updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setEditingRowId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update cost.");
    },
  });

  const filteredData = useMemo(() => {
    if (!licenses) return [];
    return licenses.filter((app) => {
      const typeMatch = typeFilter === "ALL" || app.type === typeFilter;
      const searchMatch =
        !debouncedSearch ||
        app.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [licenses, typeFilter, debouncedSearch]);

  const handleEditClick = (app) => {
    setEditingRowId(app.id);
    setEditingData({
      cost: app.cost_per_seat_monthly,
      seats: app.total_seats,
    });
  };

  const handleSaveClick = (applicationId) => {
    updateCostMutation({
      applicationId,
      cost: parseFloat(editingData.cost),
      total_seats: parseInt(editingData.seats, 10),
    });
  };

  const handleExport = () => {
    const dataToExport = filteredData.map((app) => ({
      Application: app.name,
      Type: app.type,
      AssignedSeats: app.assigned_seats,
      TotalSeats: app.total_seats,
      CostPerSeatMonthly: app.cost_per_seat_monthly,
      EstAnnualCost: app.assigned_seats * app.cost_per_seat_monthly * 12,
    }));
    downloadCSV(dataToExport, "license_report.csv");
  };

  if (isLoading) return <EmployeeListSkeleton count={8} />;
  if (error)
    return (
      <p className="p-6 text-center text-red-500">Error: {error.message}</p>
    );

  return (
    <>
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
            Manage seat counts and estimated costs for all applications.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={typeFilter === "ALL" ? "primary" : "secondary"}
              onClick={() => setTypeFilter("ALL")}
            >
              All
            </Button>
            <Button
              variant={typeFilter === "EXTERNAL" ? "primary" : "secondary"}
              onClick={() => setTypeFilter("EXTERNAL")}
            >
              External
            </Button>
            <Button
              variant={typeFilter === "INTERNAL" ? "primary" : "secondary"}
              onClick={() => setTypeFilter("INTERNAL")}
            >
              Internal
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download size={16} /> Export
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Application
                  </th>
                  {/* --- NEW COLUMN HEADER --- */}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Cost/Seat (Mo)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Est. Annual Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData?.map((app) => {
                  const isEditing = editingRowId === app.id;
                  const utilization =
                    app.total_seats > 0
                      ? (app.assigned_seats / app.total_seats) * 100
                      : 0;
                  const annualCost =
                    app.assigned_seats * app.cost_per_seat_monthly * 12;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="hover:underline text-left"
                        >
                          {app.name}
                        </button>
                      </td>
                      {/* --- NEW TABLE CELL FOR THE TYPE --- */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            app.type === "INTERNAL"
                              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {app.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{app.assigned_seats}</td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.seats}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                seats: e.target.value,
                              })
                            }
                            className="w-24 px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            disabled={
                              app.name.includes("Jira") ||
                              app.name.includes("Confluence")
                            }
                            title={
                              app.name.includes("Jira") ||
                              app.name.includes("Confluence")
                                ? "Seat count is synced automatically"
                                : ""
                            }
                          />
                        ) : (
                          <span>
                            {app.total_seats > 0 ? app.total_seats : "N/A"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingData.cost}
                            onChange={(e) =>
                              setEditingData({
                                ...editingData,
                                cost: e.target.value,
                              })
                            }
                            className="w-24 px-2 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            step="0.01"
                          />
                        ) : (
                          <span>
                            {formatCurrency(app.cost_per_seat_monthly)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {formatCurrency(annualCost)}
                          </span>
                          {permissions.includes("license:manage") &&
                            (isEditing ? (
                              <div className="flex items-center gap-1">
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
                                  onClick={() => setEditingRowId(null)}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(app)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                              >
                                <Edit3 size={14} />
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AppAssignmentsModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </>
  );
};
