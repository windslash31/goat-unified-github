import React from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import api from "../../api/api";
import { useModalStore } from "../../stores/modalStore";
import ManagedAccountsTable from "./ManagedAccountsTable";
import { Button } from "../../components/ui/Button";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import ManagedAccountFormModal from "./ManagedAccountFormModal";
import ManagedAccountDetailModal from "./ManagedAccountDetailModal";

const fetchManagedAccounts = async () => {
  const { data } = await api.get("/api/managed-accounts");
  return data;
};

const deleteAccount = (id) => {
  return api.delete(`/api/managed-accounts/${id}`);
};

const ManagedAccountsPage = () => {
  const { openModal, closeModal, modal, data: modalData } = useModalStore();
  const queryClient = useQueryClient();

  const {
    data: accountsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["managedAccounts"],
    queryFn: fetchManagedAccounts,
  });

  const { mutate: deleteAccountMutation } = useMutation({
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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Managed Accounts
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage shared, service, and bot accounts.
            </p>
          </div>
          <Button
            onClick={() => openModal("managedAccountForm")}
            className="w-full mt-4 sm:mt-0 sm:w-auto justify-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </div>

        {isLoading ? (
          <EmployeeListSkeleton count={5} />
        ) : (
          <ManagedAccountsTable
            accounts={accountsData?.data || []}
            onEdit={(account) => openModal("managedAccountForm", account)}
            onDelete={(account) => openModal("deleteManagedAccount", account)}
            // 👇 2. Pass the correct prop to the table to open the new detail modal
            onViewDetails={(account) =>
              openModal("managedAccountDetail", account)
            }
          />
        )}
      </motion.div>

      {/* Form Modal */}
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

      {/* Delete Confirmation Modal */}
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

      {/* 👇 3. Add the logic to render the new detail modal */}
      {modal === "managedAccountDetail" && (
        <ManagedAccountDetailModal account={modalData} onClose={closeModal} />
      )}
    </>
  );
};

export default ManagedAccountsPage;
