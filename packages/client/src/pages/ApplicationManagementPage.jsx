import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import api from "../api/api";
import { useModalStore } from "../stores/modalStore";
import { useDebounce } from "../hooks/useDebounce";
import { Button } from "../components/ui/Button";
import { ApplicationManagementSkeleton } from "../components/ui/ApplicationManagementSkeleton";
import { AddApplicationModal } from "../components/ui/AddApplicationModal";
import { EditApplicationModal } from "../components/ui/EditApplicationModal";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import ApplicationManagementTable from "./ApplicationManagementPage/ApplicationManagementTable";

const fetchApplications = async (searchTerm = "") => {
  const params = new URLSearchParams();
  if (searchTerm) {
    params.append("search", searchTerm);
  }
  const { data } = await api.get(`/applications?${params.toString()}`);
  return data;
};

const deleteApplication = (id) => api.delete(`/applications/${id}`);

export const ApplicationManagementPage = () => {
  const { openModal, closeModal, modal, data: modalData } = useModalStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: applications,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["managedApplications", debouncedSearchTerm],
    queryFn: () => fetchApplications(debouncedSearchTerm),
    keepPreviousData: true,
  });

  const { mutate: deleteAppMutation } = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      toast.success("Application deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: ["managedApplications", debouncedSearchTerm],
      });
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Application Management</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and onboard all applications managed by G.O.A.T.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
              />
            </div>
            <Button
              onClick={() => openModal("addApplication")}
              className="justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Onboard
            </Button>
          </div>
        </div>

        {isLoading ? (
          <ApplicationManagementSkeleton />
        ) : (
          <ApplicationManagementTable
            applications={applications || []}
            onEdit={(app) => openModal("editApplication", app)}
            onDelete={(app) => openModal("deleteApplication", app)}
            isSearching={isFetching}
          />
        )}
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
