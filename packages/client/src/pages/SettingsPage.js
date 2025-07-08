import React from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { User, Shield, ArrowRight, Briefcase } from "lucide-react";
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
      <ArrowRight className="w-5 h-5 text-gray-400" />
    </motion.div>
  );
};

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];
  const location = useLocation();

  const canViewUsers = permissions.includes("admin:view_users");
  const canViewRoles = permissions.includes("admin:view_roles");

  // Only show the settings cards on the main /settings page
  const isSettingsHome = location.pathname === "/settings";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage application users and their permissions.
        </p>
      </div>
      {isSettingsHome ? (
        <div className="max-w-2xl mx-auto space-y-4">
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
          <SettingsCard
            title="Application Management"
            description="Add or remove internal applications."
            icon={<Briefcase className="w-6 h-6" />}
            path="/settings/applications"
          />
        </div>
      ) : (
        <Outlet />
      )}
    </motion.div>
  );
};
