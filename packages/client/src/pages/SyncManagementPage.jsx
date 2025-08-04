import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, XCircle, Loader, Clock } from "lucide-react";
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

const JobStatusCard = ({ job }) => {
  const isRunning = job.status === "RUNNING";

  const getStatusIcon = () => {
    if (isRunning)
      return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    if (job.status === "SUCCESS")
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (job.status === "FAILED")
      return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const lastRunTime =
    job.last_success_at || job.last_failure_at || job.last_run_at;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {job.job_name.replace("_", " ")}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm font-semibold">
            {getStatusIcon()}
            <span>{job.status}</span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <p>Last Run</p>
          <p>{lastRunTime ? formatDateTime(lastRunTime) : "Never"}</p>
        </div>
      </div>

      {isRunning && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {job.current_step}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <motion.div
              className="bg-blue-600 h-2.5 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${job.progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      {job.status === "FAILED" && job.details?.error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Error Details
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
            {job.details.error}
          </p>
        </div>
      )}
    </div>
  );
};

const SyncManagementPage = () => {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["syncStatuses"],
    queryFn: fetchSyncStatuses,
    // Poll every 5 seconds ONLY if a job is currently running
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
