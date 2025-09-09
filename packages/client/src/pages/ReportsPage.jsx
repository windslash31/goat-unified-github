import React from "react";
import { motion } from "framer-motion";
import { FileText, Shield } from "lucide-react";
import api from "../api/api";
import toast from "react-hot-toast";
import { DownloadDropdown } from "../components/ui/DownloadDropdown";

const ReportCard = ({
  title,
  description,
  onDownload,
  isDownloading,
  icon,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-kredivo-light text-kredivo-primary mr-4">
          {icon}
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
      <DownloadDropdown onSelect={onDownload} isDownloading={isDownloading} />
    </div>
  );
};

export const ReportsPage = () => {
  const [isDownloadingUAR, setIsDownloadingUAR] = React.useState(false);
  const [isDownloadingAdmin, setIsDownloadingAdmin] = React.useState(false);

  const handleDownload = async (format, reportType) => {
    let endpoint = "";
    const toastId = `report-${reportType}-${format}`;
    let isDownloadingSetter = () => {};
    let isDownloadingState = false;

    if (reportType === "uar") {
      endpoint = `/api/employees/reports/user-access-review?format=${format}`;
      isDownloadingSetter = setIsDownloadingUAR;
      isDownloadingState = isDownloadingUAR;
    } else if (reportType === "admin") {
      endpoint = `/api/logs/reports/admin-activity?format=${format}`;
      isDownloadingSetter = setIsDownloadingAdmin;
      isDownloadingState = isDownloadingAdmin;
    }

    if (isDownloadingState) return;

    isDownloadingSetter(true);
    toast.loading(`Generating your report...`, { id: toastId });

    try {
      const response = await api.get(endpoint, { responseType: "blob" });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const disposition = response.headers["content-disposition"];

      // --- THIS IS THE CORRECTED FILENAME LOGIC ---
      let filename;
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      } else {
        // Create a fallback filename if the header is not present
        const extension = format === "excel" ? "xlsx" : format;
        const reportName =
          reportType === "uar" ? "UAR-Report" : "Admin-Activity-Report";
        filename = `${reportName}-${
          new Date().toISOString().split("T")[0]
        }.${extension}`;
      }
      // --- END CORRECTION ---

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report.", { id: toastId });
    } finally {
      isDownloadingSetter(false);
    }
  };

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
          onDownload={(format) => handleDownload(format, "uar")}
          isDownloading={isDownloadingUAR}
          icon={<FileText className="w-6 h-6" />}
        />
        <ReportCard
          title="Administrator Activity Report"
          description="A log of all high-privilege actions performed by administrators, such as creating users or changing roles."
          onDownload={(format) => handleDownload(format, "admin")}
          isDownloading={isDownloadingAdmin}
          icon={<Shield className="w-6 h-6" />}
        />
      </div>
    </motion.div>
  );
};
