import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, KeyRound, Briefcase, Info } from "lucide-react";
import api from "../../api/api";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";

const fetchAccountLicenses = async (accountId) => {
  if (!accountId) return [];
  const { data } = await api.get(`/api/managed-accounts/${accountId}/licenses`);
  return data;
};

const ManagedAccountLicensesModal = ({ account, onClose }) => {
  const {
    data: licenses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["managedAccountLicenses", account?.id],
    queryFn: () => fetchAccountLicenses(account?.id),
    enabled: !!account?.id,
  });

  return (
    <AnimatePresence>
      {account && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <KeyRound /> Licenses for {account.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {isLoading ? (
                <EmployeeListSkeleton count={3} />
              ) : error ? (
                <p className="text-center text-red-500">
                  Could not load licenses.
                </p>
              ) : licenses.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <Info className="mx-auto w-12 h-12 text-gray-400" />
                  <p className="mt-4 font-semibold">No Licenses Found</p>
                  <p className="text-sm">
                    This account has no licenses assigned to it.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {licenses.map((lic) => (
                    <li
                      key={lic.assignment_id}
                      className="py-3 flex items-center gap-3"
                    >
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lic.application_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lic.application_category}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManagedAccountLicensesModal;
