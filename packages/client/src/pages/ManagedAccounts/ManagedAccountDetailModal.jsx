import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCog, KeyRound, Briefcase, Info } from "lucide-react";
import api from "../../api/api";
import { DetailRow } from "../../components/ui/DetailRow";
import { EmployeeListSkeleton } from "../../components/ui/EmployeeListSkeleton";

const fetchAccountLicenses = async (accountId) => {
  if (!accountId) return [];
  const { data } = await api.get(`/api/managed-accounts/${accountId}/licenses`);
  return data;
};

const ManagedAccountDetailModal = ({ account, onClose }) => {
  const { data: licenses, isLoading } = useQuery({
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCog />
                {account.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Account Details Section */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Account Details
                </h4>
                <DetailRow
                  icon={<Info className="w-4 h-4 mr-2.5 text-gray-400" />}
                  label="Identifier"
                  value={account.account_identifier}
                />
                <DetailRow
                  icon={<Info className="w-4 h-4 mr-2.5 text-gray-400" />}
                  label="Type"
                  value={account.account_type.replace(/_/g, " ")}
                />
                <DetailRow
                  icon={<Info className="w-4 h-4 mr-2.5 text-gray-400" />}
                  label="Status"
                  value={account.status}
                />
                <DetailRow
                  icon={<Info className="w-4 h-4 mr-2.5 text-gray-400" />}
                  label="Owner (PIC)"
                  value={
                    `${account.owner_first_name || ""} ${
                      account.owner_last_name || ""
                    }`.trim() || "Unassigned"
                  }
                />
              </div>

              {/* Licenses Section */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Assigned Licenses
                </h4>
                {isLoading ? (
                  <EmployeeListSkeleton count={2} />
                ) : licenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    No licenses assigned.
                  </p>
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManagedAccountDetailModal;
