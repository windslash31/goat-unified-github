// In packages/client/src/pages/LicenseManagementPage.jsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tag, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import { Button } from "../components/ui/Button";
import { useModalStore } from "../stores/modalStore";
import { LicenseTierModal } from "../components/ui/LicenseTierModal";

const fetchAllApps = () => api.get("/api/applications").then((res) => res.data);
const setLicensableStatus = ({ appId, is_licensable }) =>
  api.put(`/api/applications/${appId}/licensable`, { is_licensable });

export const LicenseManagementPage = () => {
  const { openModal, closeModal, modal, data: modalData } = useModalStore();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["allApplications"],
    queryFn: fetchAllApps,
  });

  const mutation = useMutation({
    mutationFn: setLicensableStatus,
    onSuccess: () => {
      toast.success("Application status updated!");
      queryClient.invalidateQueries({ queryKey: ["allApplications"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to update status."),
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">License Management</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Set licensable status and manage tiers for all applications.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading && <p>Loading applications...</p>}
          {applications?.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{app.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {app.is_licensable ? (
                    <span className="flex items-center text-xs text-green-600">
                      <Check size={14} /> Licensable
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-red-600">
                      <X size={14} /> Non-Licensable
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {app.is_licensable ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        mutation.mutate({ appId: app.id, is_licensable: false })
                      }
                    >
                      Mark as Non-Licensable
                    </Button>
                    <Button
                      onClick={() => openModal("licenseTierManagement", app)}
                    >
                      <Tag className="w-4 h-4 mr-2" /> Manage Tiers
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() =>
                      mutation.mutate({ appId: app.id, is_licensable: true })
                    }
                  >
                    Mark as Licensable
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {modal === "licenseTierManagement" && (
        <LicenseTierModal application={modalData} onClose={closeModal} />
      )}
    </>
  );
};
