import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import api from "../api/api";
import { motion } from "framer-motion";
import { ApplicationManagementSkeleton } from "../components/ui/ApplicationManagementSkeleton";

const fetchApplications = async () => {
  const { data } = await api.get("/api/applications");
  return data;
};

export const ApplicationManagementPage = () => {
  const queryClient = useQueryClient();
  const [newAppName, setNewAppName] = useState("");
  const [editingApp, setEditingApp] = useState(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const createMutation = useMutation({
    mutationFn: (name) => api.post("/api/applications", { name }),
    onSuccess: () => {
      toast.success("Application created!");
      queryClient.invalidateQueries(["applications"]);
      setNewAppName("");
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.message || "Failed to create application.";
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => api.put(`/api/applications/${id}`, { name }),
    onSuccess: () => {
      toast.success("Application updated!");
      queryClient.invalidateQueries(["applications"]);
      setEditingApp(null);
    },
    onError: (err) => {
        const errorMessage = err.response?.data?.message || "Failed to update application.";
        toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/applications/${id}`),
    onSuccess: () => {
      toast.success("Application deleted!");
      queryClient.invalidateQueries(["applications"]);
    },
    onError: (err) => {
        const errorMessage = err.response?.data?.message || "Failed to delete application.";
        toast.error(errorMessage);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (newAppName.trim()) {
      createMutation.mutate(newAppName.trim());
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (editingApp && editingApp.name.trim()) {
      updateMutation.mutate({
        id: editingApp.id,
        name: editingApp.name.trim(),
      });
    }
  };

  if (isLoading) return <ApplicationManagementSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Applications
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Add, remove, or edit internal applications available for access
          requests.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Add New Application</h2>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="New application name"
              className="flex-grow px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
            <Button type="submit" disabled={createMutation.isLoading}>
              <PlusCircle size={16} className="mr-2" /> Add
            </Button>
          </form>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Existing Applications</h2>
          <ul className="space-y-2">
            {applications?.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md"
              >
                {editingApp?.id === app.id ? (
                  <form
                    onSubmit={handleUpdate}
                    className="flex-grow flex gap-2"
                  >
                    <input
                      type="text"
                      value={editingApp.name}
                      onChange={(e) =>
                        setEditingApp({ ...editingApp, name: e.target.value })
                      }
                      className="flex-grow px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateMutation.isLoading}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingApp(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <span>{app.name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingApp(app)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteMutation.mutate(app.id)}
                        disabled={deleteMutation.isLoading}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};