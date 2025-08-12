import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, User, UserCog, Trash2, PlusCircle } from "lucide-react";
import api from "../../api/api";
import { EmployeeListSkeleton } from "./EmployeeListSkeleton";
import { CustomSelect } from "./CustomSelect";
import { Button } from "./Button";
import toast from "react-hot-toast";
import { Portal } from "./Portal";

const fetchAssignments = async (applicationId) => {
  if (!applicationId) return [];
  const { data } = await api.get(`/api/licenses/${applicationId}/assignments`);
  return data;
};

const fetchUnassigned = async (applicationId) => {
  if (!applicationId) return [];
  const { data } = await api.get(
    `/api/assignments/unassigned/${applicationId}`
  );
  return data;
};

export const AppAssignmentsModal = ({ app, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedPrincipal, setSelectedPrincipal] = useState(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["appAssignments", app?.id],
    queryFn: () => fetchAssignments(app?.id),
    enabled: !!app,
  });

  const { data: unassignedPrincipals } = useQuery({
    queryKey: ["unassignedPrincipals", app?.id],
    queryFn: () => fetchUnassigned(app?.id),
    enabled: !!app,
  });

  const addMutation = useMutation({
    mutationFn: (newAssignment) =>
      api.post(`/api/assignments/${app.id}`, newAssignment),
    onSuccess: () => {
      toast.success("User assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["appAssignments", app?.id] });
      queryClient.invalidateQueries({
        queryKey: ["unassignedPrincipals", app?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      setSelectedPrincipal(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to assign user."),
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId) =>
      api.delete(`/api/assignments/${assignmentId}`),
    onSuccess: () => {
      toast.success("User unassigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["appAssignments", app?.id] });
      queryClient.invalidateQueries({
        queryKey: ["unassignedPrincipals", app?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to unassign user."),
  });

  const handleAddUser = () => {
    if (!selectedPrincipal) return;
    const [principalType, principalId] = selectedPrincipal.split("-");
    addMutation.mutate({ principalId, principalType });
  };

  const unassignedOptions =
    unassignedPrincipals?.map((p) => ({
      id: `${p.type}-${p.id}`,
      name: `${p.name} (${p.type})`,
    })) || [];

  return (
    <Portal>
      <AnimatePresence>
        {app && (
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
                  <Users /> Licensed Users for {app.name}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <CustomSelect
                      placeholder="Select a user or account to add..."
                      options={unassignedOptions}
                      value={selectedPrincipal}
                      onChange={setSelectedPrincipal}
                    />
                  </div>
                  <Button
                    onClick={handleAddUser}
                    disabled={!selectedPrincipal || addMutation.isPending}
                  >
                    <PlusCircle size={16} className="mr-2" /> Add User
                  </Button>
                </div>
              </div>
              <div className="p-4 border-t flex-1 overflow-y-auto">
                {isLoading ? (
                  <EmployeeListSkeleton count={3} />
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assignments?.map((item) => (
                      // --- FIX 1: ADDED THE UNIQUE KEY PROP ---
                      <li
                        key={item.assignment_id}
                        className="py-3 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
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
                        </div>
                        {/* --- FIX 2: THIS NOW RECEIVES A VALID ID --- */}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            removeMutation.mutate(item.assignment_id)
                          }
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </li>
                    ))}
                    {assignments?.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        No users are assigned to this application.
                      </p>
                    )}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};
