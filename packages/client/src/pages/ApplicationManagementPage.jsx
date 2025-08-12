import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import api from "../api/api";
import { ApplicationManagementSkeleton } from "../components/ui/ApplicationManagementSkeleton";
import { useModalStore } from "../stores/modalStore";

const fetchApplications = async () => {
  const { data } = await api.get("/api/applications");
  return data;
};

export const ApplicationManagementPage = () => {
  const { openModal } = useModalStore();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  if (isLoading) return <ApplicationManagementSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Application Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage the catalog of all internal and external applications.
          </p>
        </div>
        <Button
          onClick={() => openModal("applicationForm")}
          className="mt-4 sm:mt-0"
        >
          <PlusCircle size={16} className="mr-2" /> Add Application
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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Licensable
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications?.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {app.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {app.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {app.category || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.is_licensable ? (
                      <CheckCircle className="text-green-500" />
                    ) : (
                      <XCircle className="text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openModal("applicationForm", app)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => openModal("deleteApplication", app)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
