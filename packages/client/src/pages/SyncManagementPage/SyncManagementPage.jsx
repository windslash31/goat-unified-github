import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../api/api";
import { Button } from "../../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Database,
  Users,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Pause,
  Zap,
  Calendar,
  Shield,
  ChevronDown,
} from "lucide-react";
import { formatDateTime } from "../../utils/formatters";

// Helper to fetch job statuses from the backend
const fetchSyncStatuses = async () => {
  const { data } = await api.get("/sync/status");
  return data;
};

export default function SyncManagementPage() {
  const { data: allJobs, isLoading } = useQuery({
    queryKey: ["syncStatuses"],
    queryFn: fetchSyncStatuses,
    refetchInterval: (data) =>
      data?.some((job) => job.status === "RUNNING") ? 3000 : 15000,
  });

  // --- Data Processing ---
  const { manualJobs, scheduledJobs } = useMemo(() => {
    if (!allJobs) return { manualJobs: [], scheduledJobs: [] };

    const jobTypeMap = {
      jumpcloud_sync: { icon: Database, color: "text-blue-500" },
      slack_sync: { icon: Users, color: "text-purple-500" },
      manager_reconciliation: { icon: Shield, color: "text-green-500" },
      google_sync: { icon: BarChart3, color: "text-yellow-500" },
      gws_log_reconciliation: { icon: Database, color: "text-yellow-500" },
      reconciliation: { icon: Shield, color: "text-green-500" },
      atlassian_sync: { icon: Users, color: "text-sky-500" },
    };

    const formattedJobs = allJobs.map((job) => ({
      ...job,
      id: job.job_name,
      name: job.job_name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      status:
        job.status === "IDLE"
          ? job.last_failure_at
            ? "error"
            : "idle"
          : job.status.toLowerCase(),
      lastActivity: job.last_run_at
        ? new Date(job.last_run_at).toLocaleString("en-US", {
            timeZone: "Asia/Jakarta",
          })
        : "Never",
      ...(jobTypeMap[job.job_name] || {
        icon: Database,
        color: "text-gray-500",
      }),
    }));

    const manualKeys = [
      "reconciliation",
      "manager_reconciliation",
      "gws_log_reconciliation",
    ];
    return {
      manualJobs: formattedJobs.filter((job) => manualKeys.includes(job.id)),
      scheduledJobs: formattedJobs.filter(
        (job) => !manualKeys.includes(job.id)
      ),
    };
  }, [allJobs]);

  const isAnyJobRunning = allJobs?.some((job) => job.status === "RUNNING");

  // --- Action Handlers ---
  const handleTrigger = (jobNameOrNames) => {
    // This logic remains the same
    let promise;
    let loadingMessage = "Triggering job(s)...";
    if (jobNameOrNames === "all-reconciliation") {
      promise = Promise.all([
        api.post("/sync/trigger/reconciliation"),
        api.post("/employees/reconcile-managers"),
      ]);
      loadingMessage = "Triggering all reconciliation jobs...";
    } else if (jobNameOrNames === "manager_reconciliation") {
      promise = api.post("/employees/reconcile-managers");
      loadingMessage = "Triggering manager reconciliation...";
    } else {
      const jobs = Array.isArray(jobNameOrNames)
        ? jobNameOrNames
        : [jobNameOrNames];
      promise = api.post("/sync/trigger", { jobs });
    }
    toast.promise(promise, {
      loading: loadingMessage,
      success: "Jobs triggered successfully!",
      error: (err) =>
        err.response?.data?.message || "Failed to trigger job(s).",
    });
  };

  // --- UI Helper Functions ---
  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "idle":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      idle: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
          variants[status] || variants.idle
        }`}
      >
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    );
  };

  // --- UPDATED JobListItem component with dropdown ---
  const JobListItem = ({ job }) => {
    const Icon = job.icon;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${job.color}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {job.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last Activity:
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {job.lastActivity}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {getStatusBadge(job.status)}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTrigger(job.id)}
              disabled={isAnyJobRunning}
            >
              Run Now
            </Button>
            {/* --- ADDED: Chevron button to toggle details --- */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* --- ADDED: Expandable Details Section --- */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
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
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Last Failure:</span>
                        <span className="ml-1 text-gray-600 dark:text-gray-300">
                          {formatDateTime(job.last_failure_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {job.status === "error" && job.details?.error && (
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

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400">
          Loading Synchronization Status...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Data Synchronization
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor and manually trigger background data synchronization jobs.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => handleTrigger(scheduledJobs.map((j) => j.id))}
            disabled={isAnyJobRunning}
          >
            <RefreshCw className="h-4 w-4" />
            Sync All Scheduled
          </Button>
        </div>
      </div>

      {/* Manual Reconciliation Card */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Manual Reconciliation
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Use these actions to manually fix data inconsistencies without
            waiting for the daily sync.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => handleTrigger("all-reconciliation")}
            disabled={isAnyJobRunning}
          >
            <RefreshCw className="h-4 w-4" />
            Run All Reconciliations
          </Button>
          {manualJobs.map((job) => {
            const Icon = job.icon;
            return (
              <Button
                key={job.id}
                variant="secondary"
                className="gap-2"
                onClick={() => handleTrigger(job.id)}
                disabled={isAnyJobRunning}
              >
                {job.status === "running" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {job.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Scheduled Jobs */}
      <div className="p-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Scheduled Jobs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage automated synchronization tasks that run daily.
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:border-gray-700">
          {scheduledJobs.map((job) => (
            <JobListItem key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}
