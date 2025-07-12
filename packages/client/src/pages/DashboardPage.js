import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity,
  Ticket,
  Globe,
  BarChart2,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardSkeleton } from "../components/ui/DashboardSkeleton";

const fetchDashboardData = async () => {
  const { data } = await api.get("/api/dashboard");
  return data;
};


const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${color}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

const BarChart = ({ data, title }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <BarChart2 className="w-5 h-5" /> {title}
    </h3>
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = (item.used / item.total) * 100;
        return (
          <div key={item.name}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {item.used} / {item.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <motion.div
                className="bg-kredivo-primary h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const DistributionList = ({ data, title }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Globe className="w-5 h-5" /> {title}
    </h3>
    <ul className="space-y-3">
      {data.map((item) => (
        <li
          key={item.name}
          className="flex justify-between items-center text-sm"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {item.name}
          </span>
          <span className="font-semibold text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const AlertsPanel = ({ forEscalationCount }) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Bell className="h-5 w-5 text-yellow-500" />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          You have <span className="font-bold">{forEscalationCount}</span>{" "}
          employee(s) needing escalation.
        </p>
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error)
    return (
      <div className="p-6 text-center text-red-500">
        Could not load dashboard data.
      </div>
    );

  const { stats, recentActivity, recentTickets, licenseStats, distribution } =
    data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Dashboard
      </h1>

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Employees"
              value={stats.total_employees}
              icon={<Users className="text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Employees"
              value={stats.active_employees}
              icon={<UserCheck className="text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Total Users"
              value={stats.total_users}
              icon={<Users className="text-white" />}
              color="bg-indigo-500"
            />
            <StatCard
              title="For Escalation"
              value={stats.for_escalation_employees}
              icon={<AlertTriangle className="text-white" />}
              color="bg-yellow-500"
            />
          </div>
          {stats.for_escalation_employees > 0 && (
            <div className="mb-6">
              <AlertsPanel
                forEscalationCount={stats.for_escalation_employees}
              />
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {licenseStats && (
            <BarChart data={licenseStats} title="License Utilization" />
          )}
          {distribution && (
            <DistributionList
              data={distribution}
              title="Active Employees by Location"
            />
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          {recentActivity && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity /> Recent Activity
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm">
                        {log.action_type.replace(/_/g, " ")} by{" "}
                        <span className="font-semibold">
                          {log.actor_email || "System"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recentTickets && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ticket /> Recent Tickets
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={`${ticket.ticket_type}-${ticket.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm">
                        <span
                          className={`font-semibold ${
                            ticket.ticket_type === "Onboarding"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {ticket.ticket_type}:
                        </span>{" "}
                        {ticket.first_name} {ticket.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.ticket_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
