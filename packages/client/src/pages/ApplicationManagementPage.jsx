import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, PlusCircle, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../api/api";
import { useModalStore } from "../stores/modalStore";
import { Button } from "../components/ui/Button";
import { ApplicationManagementSkeleton } from "../components/ui/ApplicationManagementSkeleton";
import { AddApplicationModal } from "../components/ui/AddApplicationModal";
import { EditApplicationModal } from "../components/ui/EditApplicationModal";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";

const fetchApplications = async () => {
  const { data } = await api.get("/api/applications");
  return data;
};

const deleteApplication = (id) => api.delete(`/api/applications/${id}`);

export const ApplicationManagementPage = () => {
  const { openModal, closeModal, modal, data: modalData } = useModalStore();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["managedApplications"],
    queryFn: fetchApplications,
  });

  const { mutate: deleteAppMutation } = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      toast.success("Application deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["managedApplications"] });
      closeModal();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete application."
      );
      closeModal();
    },
  });

  const handleDeleteConfirm = () => {
    if (modalData?.id) {
      deleteAppMutation(modalData.id);
    }
  };

  if (isLoading) return <ApplicationManagementSkeleton />;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Application Management</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and onboard all applications managed by G.O.A.T.
            </p>
          </div>
          <Button
            onClick={() => openModal("addApplication")}
            className="w-full mt-4 sm:mt-0 sm:w-auto justify-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Onboard New Application
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase">
                    Integration Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {applications && applications.length > 0 ? (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {app.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {app.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-2 py-1 font-semibold leading-tight text-xs rounded-full bg-gray-100 dark:bg-gray-600">
                          {app.integration_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openModal("editApplication", app)}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-16 text-gray-500">
                      <Briefcase className="mx-auto w-12 h-12 text-gray-400" />
                      <p className="font-semibold mt-4">
                        No Applications Found
                      </p>
                      <p className="text-sm mt-1">
                        Click "Onboard New Application" to get started.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {modal === "addApplication" && (
        <AddApplicationModal onClose={closeModal} />
      )}
      {modal === "editApplication" && (
        <EditApplicationModal application={modalData} onClose={closeModal} />
      )}
      {modal === "deleteApplication" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={handleDeleteConfirm}
          title="Delete Application"
          message={`Are you sure you want to delete the application "${modalData?.name}"? This action cannot be undone.`}
          confirmationText={modalData?.name}
        />
      )}
    </>
  );
};
