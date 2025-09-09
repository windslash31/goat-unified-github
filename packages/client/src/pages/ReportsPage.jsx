import React from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader } from "lucide-react"; // <-- Import Loader
import { Button } from "../components/ui/Button";
import api from "../api/api"; // <-- Import api
import toast from "react-hot-toast"; // <-- Import toast

const ReportCard = ({ title, description, onDownload, isDownloading }) => {
  // <-- Add isDownloading prop
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-kredivo-light text-kredivo-primary mr-4">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <Button
        onClick={onDownload}
        variant="secondary"
        className="w-full sm:w-auto justify-center"
        disabled={isDownloading} // <-- Disable button while downloading
      >
        {isDownloading ? (
          <Loader className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {isDownloading ? "Generating..." : "Download PDF"}
      </Button>
    </div>
  );
};

export const ReportsPage = () => {
  // --- MODIFICATION START: Add downloading state and API call logic ---
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadUAR = async () => {
    setIsDownloading(true);
    toast.loading("Generating your report...", { id: "uar-report" });

    try {
      const response = await api.get(
        "/api/employees/reports/user-access-review",
        {
          responseType: "blob", // Important: tells axios to handle the response as a file
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from content-disposition header
      const disposition = response.headers["content-disposition"];
      let filename = `UAR-Report-${new Date().toISOString().split("T")[0]}.pdf`;
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully!", { id: "uar-report" });
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report.", { id: "uar-report" });
    } finally {
      setIsDownloading(false);
    }
  };
  // --- MODIFICATION END ---

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Generate and download reports for audit, compliance, and analysis.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Audit & Compliance
        </h2>
        <ReportCard
          title="User Access Review (UAR)"
          description="A detailed report of all users and their access to all applications. Essential for ISO 27001 and SOC2 audits."
          onDownload={handleDownloadUAR}
          isDownloading={isDownloading} // Pass state to the card
        />
      </div>
    </motion.div>
  );
};
