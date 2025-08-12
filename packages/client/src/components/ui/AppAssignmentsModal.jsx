import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, User, UserCog } from "lucide-react";
import api from "../../api/api";
import { EmployeeListSkeleton } from "./EmployeeListSkeleton";

const fetchAssignments = async (applicationId) => {
  if (!applicationId) return [];
  const { data } = await api.get(`/api/licenses/${applicationId}/assignments`);
  return data;
};

export const AppAssignmentsModal = ({ app, onClose }) => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["appAssignments", app?.id],
    queryFn: () => fetchAssignments(app?.id),
    enabled: !!app,
  });

  return (
    <AnimatePresence>
      {app && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users /> Licensed Users for {app.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {isLoading ? (
                <EmployeeListSkeleton count={5} />
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {assignments?.map((item, index) => (
                    <li key={index} className="py-3 flex items-center gap-3">
                      {item.principal_type === "EMPLOYEE" ? (
                        <User className="text-gray-400" />
                      ) : (
                        <UserCog className="text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.principal_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.principal_identifier}
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
