import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmationText,
}) => {
  const [inputValue, setInputValue] = useState("");

  // Reset input when the modal opens or confirmationText changes
  useEffect(() => {
    if (isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  const isConfirmationRequired = !!confirmationText;
  const isConfirmDisabled =
    isConfirmationRequired && inputValue !== confirmationText;

  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3">
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                </div>
              </div>
              {isConfirmationRequired && (
                <div className="mt-4 text-left">
                  <label
                    htmlFor="confirmationInput"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Please type{" "}
                    <strong className="text-gray-900 dark:text-white">
                      {confirmationText}
                    </strong>{" "}
                    to confirm.
                  </label>
                  <input
                    id="confirmationInput"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-kredivo-primary"
                  />
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                onClick={onClose}
                variant="secondary"
                className="w-full justify-center sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                variant="danger"
                className="w-full justify-center sm:w-auto"
                disabled={isConfirmDisabled}
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
