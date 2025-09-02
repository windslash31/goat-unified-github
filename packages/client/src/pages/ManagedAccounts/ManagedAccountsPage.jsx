import React, { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PlusCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import api from "../../api/api";
import { useModalStore } from "../../stores/modalStore";
import ManagedAccountsTable from "./ManagedAccountsTable";
import { Button } from "../../components/ui/Button";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import ManagedAccountFormModal from "./ManagedAccountFormModal";
import { useDebounce } from "../../hooks/useDebounce";

const fetchManagedAccounts = async (searchTerm = "") => {
  const params = new URLSearchParams();
  if (searchTerm) {
    params.append("search", searchTerm);
  }
  const { data } = await api.get(`/api/managed-accounts?${params.toString()}`);
  return data;
};

const deleteAccount = (id) => {
  return api.delete(`/api/managed-accounts/${id}`);
};

const ManagedAccountsPage = () => {
  const { openModal, closeModal, modal, data: modalData } = useModalStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: accountsData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["managedAccounts", debouncedSearchTerm],
    queryFn: () => fetchManagedAccounts(debouncedSearchTerm),
    keepPreviousData: true,
  });

  const { mutate: deleteAccountMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["managedAccounts"] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete account.");
      closeModal();
    },
  });

  const handleDeleteConfirm = () => {
    if (modalData?.id) {
      deleteAccountMutation(modalData.id);
    }
  };

  if (error) {
    return (
      <p className="p-6 text-center text-red-500">
        Error fetching accounts: {error.message}
      </p>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Managed Accounts
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage shared, service, and bot accounts.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-kredivo-primary focus:outline-none"
              />
            </div>
            <Button
              onClick={() => openModal("managedAccountForm")}
              className="justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </div>
        </div>

        {isLoading ? (
          <EmployeeListSkeleton count={5} />
        ) : (
          <ManagedAccountsTable
            accounts={accountsData?.data || []}
            onEdit={(account) => openModal("managedAccountForm", account)}
            onDelete={(account) => openModal("deleteManagedAccount", account)}
            isSearching={isFetching}
          />
        )}
      </motion.div>

      {modal === "managedAccountForm" && (
        <ManagedAccountFormModal
          account={modalData}
          onClose={closeModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["managedAccounts"] });
            closeModal();
          }}
        />
      )}

      {modal === "deleteManagedAccount" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={handleDeleteConfirm}
          title="Delete Managed Account"
          message={`Are you sure you want to delete the account "${modalData?.name}"? This action cannot be undone.`}
          confirmationText={modalData?.name}
        />
      )}
    </>
  );
};

export default ManagedAccountsPage;
