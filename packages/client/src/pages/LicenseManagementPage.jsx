// packages/client/src/pages/LicenseManagementPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Check,
  X,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/api";
import { useModalStore } from "../stores/modalStore";
import { LicenseTierModal } from "../components/ui/LicenseTierModal";
import { ApplicationManagementSkeleton } from "../components/ui/ApplicationManagementSkeleton";

const fetchAllApps = () => api.get("/api/applications").then((res) => res.data);
const setLicensableStatus = ({ appId, is_licensable }) =>
  api.put(`/api/applications/${appId}/licensable`, { is_licensable });

const StatusPill = ({ isLicensable }) => (
  <span
    className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${
      isLicensable
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
    }`}
  >
    {isLicensable ? <Check size={14} /> : <X size={14} />}
    {isLicensable ? "Licensable" : "Not Licensable"}
  </span>
);

const AppCard = ({ app, onManageTiers, onToggleLicensable, isToggling }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
    >
      <div className="flex-grow">
        <p className="font-bold text-lg text-gray-900 dark:text-white">
          {app.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
          {app.key}
        </p>
        <div className="mt-3">
          <StatusPill isLicensable={app.is_licensable} />
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={() => onManageTiers(app)}
          disabled={!app.is_licensable}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors bg-kredivo-primary border-kredivo-primary text-white hover:bg-kredivo-primary-hover focus:ring-kredivo-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Tag className="w-4 h-4" /> Manage Tiers
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((p) => !p)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-20"
              >
                <ul>
                  <li>
                    <button
                      onClick={() => {
                        onToggleLicensable({
                          appId: app.id,
                          is_licensable: !app.is_licensable,
                        });
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {isToggling ? (
                        <Loader size={16} className="animate-spin" />
                      ) : app.is_licensable ? (
                        <ToggleLeft size={16} />
                      ) : (
                        <ToggleRight size={16} />
                      )}
                      <span>
                        Mark as{" "}
                        {app.is_licensable ? "Not Licensable" : "Licensable"}
                      </span>
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export const LicenseManagementPage = () => {
  const { openModal, closeModal, modal, data: modalData } = useModalStore();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["allApplications"],
    queryFn: fetchAllApps,
  });

  const { mutate: toggleLicensable, isPending: isToggling } = useMutation({
    mutationFn: setLicensableStatus,
    onSuccess: () => {
      toast.success("Application status updated!");
      queryClient.invalidateQueries({ queryKey: ["allApplications"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Failed to update status."),
  });

  if (isLoading) return <ApplicationManagementSkeleton />;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">License Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Set licensable status and manage cost tiers for all applications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {applications?.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onManageTiers={() => openModal("licenseTierManagement", app)}
                onToggleLicensable={toggleLicensable}
                isToggling={isToggling}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {modal === "licenseTierManagement" && (
        <LicenseTierModal application={modalData} onClose={closeModal} />
      )}
    </>
  );
};
