import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { KeyRound, Plus, Trash2, X } from "lucide-react";
import { Button } from "./Button";
import { ConfirmationModal } from "./ConfirmationModal";
import { NewApiKeyModal } from "./NewApiKeyModal";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/formatters";

export const ApiKeyManagerModal = ({ user, onClose }) => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [keyToDelete, setKeyToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/users/${user.id}/api-keys`);
      setKeys(data);
    } catch (error) {
      toast.error("Failed to load API keys.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please provide a description for the key.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/api/users/${user.id}/api-keys`, {
        description,
        expiresInDays,
      });
      setNewlyGeneratedKey(data.newKey); // Show the new key modal
      setDescription("");
      setExpiresInDays(30); // Reset to default
      fetchKeys(); // Refresh the list of keys
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate API key."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (key) => {
    setKeyToDelete(key);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;
    try {
      await api.delete(`/api/users/api-keys/${keyToDelete.id}`);
      toast.success("API Key revoked successfully!");
      fetchKeys(); // Refresh list
    } catch (error) {
      toast.error("Failed to revoke API key.");
    } finally {
      setIsDeleteModalOpen(false);
      setKeyToDelete(null);
    }
  };

  return (
    <>
      <AnimatePresence>
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                API Keys for {user.full_name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {loading ? (
                <p>Loading keys...</p>
              ) : keys.length > 0 ? (
                <ul className="space-y-3">
                  {keys.map((key) => (
                    <li
                      key={key.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{key.description}</p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(key.created_at)}
                          {key.expires_at
                            ? ` | Expires: ${formatDate(key.expires_at)}`
                            : " | No Expiration"}
                        </p>
                      </div>
                      <Button
                        onClick={() => openDeleteModal(key)}
                        variant="danger"
                        className="px-2 py-1 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Revoke
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <KeyRound className="mx-auto w-10 h-10 text-gray-400" />
                  <p className="font-semibold mt-4">No API Keys Found</p>
                  <p className="text-sm mt-1">
                    Generate a new key for this user below.
                  </p>
                </div>
              )}
            </div>

            <form
              onSubmit={handleGenerateKey}
              className="p-6 border-t border-gray-200 dark:border-gray-700"
            >
              <h4 className="font-semibold mb-2">Generate New Key</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., n8n workflow key"
                  className="flex-grow w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex-shrink-0 flex items-center gap-2">
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    min="1"
                    max="365"
                    className="w-20 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    days
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  className="w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Generating..." : "Generate"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteKey}
        title="Revoke API Key"
        message={`This will permanently revoke the key. This action is irreversible.`}
        confirmationText={keyToDelete?.description}
      />

      {newlyGeneratedKey && (
        <NewApiKeyModal
          apiKey={newlyGeneratedKey}
          onClose={() => setNewlyGeneratedKey(null)}
        />
      )}
    </>
  );
};
