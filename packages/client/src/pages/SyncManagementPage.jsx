import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader,
  Clock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import api from "../api/api";
import { Button } from "../components/ui/Button";
import { formatDateTime } from "../utils/formatters";

const fetchSyncStatuses = async () => {
  const { data } = await api.get("/api/sync/status");
  return data;
};

const triggerSync = async () => {
  const { data } = await api.post("/api/sync/trigger");
  return data;
};

const StatusBadge = ({ status }) => {
  const styles = {
    RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    SUCCESS:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    IDLE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };
  const icons = {
    RUNNING: <Loader className="w-4 h-4 animate-spin" />,
    SUCCESS: <CheckCircle className="w-4 h-4" />,
    FAILED: <XCircle className="w-4 h-4" />,
    IDLE: <Clock className="w-4 h-4" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-sm font-semibold rounded-full ${
        styles[status] || styles["IDLE"]
      }`}
    >
      {icons[status]}
      {status}
    </span>
  );
};

const JobStatusCard = ({ job }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRunning = job.status === "RUNNING";

  // Get the most recent timestamp for the "Last Activity" display
  const lastActivity = [
    job.last_success_at,
    job.last_failure_at,
    job.last_run_at,
  ]
    .filter(Boolean) // Remove null/undefined values
    .map((ts) => new Date(ts)) // Convert to Date objects
    .sort((a, b) => b - a)[0]; // Sort descending and get the latest

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        className="w-full p-6 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {job.job_name.replace("_", " ")}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last Activity:{" "}
              {lastActivity ? formatDateTime(lastActivity) : "Never"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={job.status} />
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Expandable details section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {isRunning && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {job.current_step}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <motion.div
                      className="bg-blue-600 h-2.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Last Success:</span>
                    <span className="ml-1 text-gray-600 dark:text-gray-300">
                      {job.last_success_at
                        ? formatDateTime(job.last_success_at)
                        : "Never"}
                    </span>
                  </div>
                </div>
                {job.last_failure_at && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Last Failure:</span>
                      <span className="ml-1 text-gray-600 dark:text-gray-300">
                        {formatDateTime(job.last_failure_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {job.status === "FAILED" && job.details?.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Error Details
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono whitespace-pre-wrap">
                    {job.details.error}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SyncManagementPage = () => {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["syncStatuses"],
    queryFn: fetchSyncStatuses,
    refetchInterval: (data) =>
      data?.some((job) => job.status === "RUNNING") ? 5000 : false,
  });

  const { mutate: runSync, isPending: isTriggering } = useMutation({
    mutationFn: triggerSync,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["syncStatuses"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to trigger sync.");
    },
  });

  const isAnyJobRunning = jobs?.some((job) => job.status === "RUNNING");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Data Synchronization
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor and manually trigger background data synchronization jobs.
          </p>
        </div>
        <Button
          onClick={() => runSync()}
          disabled={isTriggering || isAnyJobRunning}
          className="w-full mt-4 sm:mt-0 sm:w-auto justify-center"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              isTriggering || isAnyJobRunning ? "animate-spin" : ""
            }`}
          />
          {isAnyJobRunning ? "Sync in Progress..." : "Sync All Now"}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {isLoading && <p>Loading job statuses...</p>}
        {jobs?.map((job) => (
          <JobStatusCard key={job.job_name} job={job} />
        ))}
      </div>
    </motion.div>
  );
};

export default SyncManagementPage;
