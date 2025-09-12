import React from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { User, Shield, ChevronRight, Briefcase, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/authStore";

const SettingsCard = ({ title, description, icon, path }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={() => navigate(path)}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer flex justify-between items-center"
    >
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
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </motion.div>
  );
};

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];
  const location = useLocation();

  const canViewUsers = permissions.includes("admin:view_users");
  const canViewRoles = permissions.includes("admin:view_roles");

  const isSettingsHome = location.pathname === "/settings";

  if (!isSettingsHome) {
    return <Outlet />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage application users, permissions, and system configurations.
        </p>
      </div>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Access Control Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Access Control
          </h2>
          <div className="space-y-4">
            {canViewUsers && (
              <SettingsCard
                title="User Management"
                description="Create users and assign them to roles."
                icon={<User className="w-6 h-6" />}
                path="/settings/users"
              />
            )}
            {canViewRoles && (
              <SettingsCard
                title="Roles & Permissions"
                description="Define what users can see and do."
                icon={<Shield className="w-6 h-6" />}
                path="/settings/roles"
              />
            )}
          </div>
        </div>

        {/* System Administration Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            System Administration
          </h2>
          <div className="space-y-4">
            <SettingsCard
              title="Application Management"
              description="Add or remove internal applications."
              icon={<Briefcase className="w-6 h-6" />}
              path="/settings/applications"
            />
            <SettingsCard
              title="Data Synchronization"
              description="Monitor and manage background sync jobs."
              icon={<RefreshCw className="w-6 h-6" />}
              path="/settings/sync"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
