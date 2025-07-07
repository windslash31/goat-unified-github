import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "./Button";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";

export const EmployeeImportModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast.error("Please select a valid .csv file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/api/employees/bulk-import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadResult(data);
      toast.success("File processed successfully!");
      queryClient.invalidateQueries(["employees"]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An error occurred during upload.";
      setUploadResult({ errors: [{ message: errorMessage }] });
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    onClose();
  };

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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Bulk Import Employees</h3>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!uploadResult ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload a CSV file with employee data. The required columns
                    are: `first_name`, `last_name`, and `employee_email`.
                  </p>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          CSV (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-md">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2">Import Results</h4>
                  <div className="max-h-60 overflow-y-auto p-3 bg-gray-100 dark:bg-gray-900 rounded-md space-y-2">
                    {uploadResult.errors &&
                      uploadResult.errors.map((err, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-red-600 dark:text-red-400"
                        >
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">
                            {err.row ? `Row ${err.row}: ` : ""}
                            {err.message}
                          </p>
                        </div>
                      ))}
                    {uploadResult.created > 0 && (
                      <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          Successfully created {uploadResult.created} employees.
                        </p>
                      </div>
                    )}
                    {uploadResult.updated > 0 && (
                      <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          Successfully updated {uploadResult.updated} employees.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3">
              <Button onClick={handleClose} variant="secondary">
                Close
              </Button>
              {!uploadResult && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !file}
                  variant="primary"
                >
                  {isUploading ? "Uploading..." : "Upload & Process"}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
