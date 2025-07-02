import React, { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, AlertTriangle, Download } from "lucide-react";
import api from "../../api/api";
import * as Papa from "papaparse";

export const ImportEmployeesModal = ({ onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        first_name: "John",
        last_name: "Doe",
        employee_email: "john.doe@example.com",
        position_name: "Software Engineer",
        join_date: "2024-01-15",
      },
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setImportResults(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/api/employees/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Import process completed!");
      setImportResults(data);
      onImportComplete();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to import employees."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-xl font-semibold">
                Import Employees from CSV
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Upload a CSV file with the required headers to bulk create
                employees.
              </p>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="font-semibold">Required Headers:</p>
                <code className="text-blue-800 dark:text-blue-300">
                  first_name, last_name, employee_email, position_name,
                  join_date
                </code>
                <Button
                  onClick={handleDownloadTemplate}
                  type="button"
                  variant="secondary"
                  className="mt-2 text-xs py-1 px-2"
                >
                  <Download className="w-3 h-3 mr-1" /> Download Template
                </Button>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="file-upload"
                  className="block text-sm font-medium mb-1"
                >
                  CSV File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-kredivo-primary hover:text-kredivo-primary-hover focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    {file ? (
                      <p className="text-xs text-gray-500">
                        <File className="w-4 h-4 inline-block mr-1" />
                        {file.name}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">CSV up to 10MB</p>
                    )}
                  </div>
                </div>
              </div>

              {importResults && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold">Import Results</h4>
                  <p className="text-sm text-green-600">
                    Successfully imported: {importResults.success.length}{" "}
                    employees.
                  </p>
                  {importResults.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      <p className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" /> Failed to
                        import: {importResults.errors.length} employees.
                      </p>
                      <ul className="list-disc pl-5 mt-1">
                        {importResults.errors.slice(0, 5).map((err) => (
                          <li key={err.row}>
                            Row {err.row} ({err.email}): {err.error}
                          </li>
                        ))}
                        {importResults.errors.length > 5 && (
                          <li>...and more.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3">
              <Button type="button" onClick={onClose} variant="secondary">
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !file}
              >
                {isSubmitting ? "Importing..." : "Start Import"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
