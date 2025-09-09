import {
  MoreVertical,
  ChevronFirst,
  ChevronLast,
  LayoutDashboard,
  User,
  Users,
  Settings,
  FileText,
  LogOut,
  UserCircle,
  UserCog,
  Tag,
} from "lucide-react";
import { createContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";
import { SidebarItem } from "./SidebarItem";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/logo.png";

export const SidebarContext = createContext();

export function Sidebar({ onLogout, isMobileOpen, setMobileOpen }) {
  const { isSidebarCollapsed: expanded, toggleSidebar: setExpanded } =
    useUIStore();
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];
  const navigate = useNavigate();

  const hasSettingsAccess =
    permissions.includes("admin:view_users") ||
    permissions.includes("admin:view_roles");

  const navItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      visible: permissions.includes("dashboard:view"),
    },
    {
      id: "profile",
      path: "/profile",
      label: "Profile",
      icon: <UserCircle size={20} />,
      visible: true,
    },
    {
      id: "employees",
      path: "/employees",
      label: "Employees",
      icon: <Users size={20} />,
      visible: permissions.includes("employee:read:all"),
    },
    {
      id: "managed-accounts",
      path: "/managed-accounts",
      label: "Managed Accounts",
      icon: <UserCog size={20} />,
      visible: permissions.includes("managed_account:manage"),
    },
    {
      id: "licenses",
      path: "/licenses",
      label: "License Management",
      icon: <Tag size={20} />,
      visible: permissions.includes("admin:manage_applications"),
    },
    {
      id: "logs",
      path: "/logs/activity",
      label: "Activity Log",
      icon: <FileText size={20} />,
      visible: permissions.includes("log:read"),
    },
    {
      id: "reports",
      path: "/reports",
      label: "Reports",
      icon: <FileText size={20} />,
      visible: permissions.includes("log:read"),
    },
    {
      id: "settings",
      path: "/settings",
      label: "Settings",
      icon: <Settings size={20} />,
      visible: hasSettingsAccess,
    },
  ];

  const logoutItem = {
    id: "logout",
    label: "Logout",
    icon: <LogOut size={20} />,
    onClick: onLogout,
  };

  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <>
      <aside className="h-screen hidden md:block">
        <nav className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 pb-2 flex justify-between items-center">
            <img
              src={logo}
              className={`overflow-hidden transition-all ${
                expanded ? "w-32" : "w-0"
              }`}
              alt="Company Logo"
            />
            <button
              onClick={setExpanded}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {expanded ? <ChevronFirst /> : <ChevronLast />}
            </button>
          </div>

          <SidebarContext.Provider value={{ expanded }}>
            <ul className="flex-1 px-3">
              {navItems
                .filter((item) => item.visible)
                .map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
            </ul>

            <div className="mt-auto p-3 flex justify-center">
              <ThemeSwitcher isCollapsed={!expanded} />
            </div>
          </SidebarContext.Provider>
        </nav>
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full z-40 md:hidden"
          >
            <nav
              className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg"
              style={{ width: "270px" }}
            >
              <div className="p-4 pb-2 flex justify-between items-center">
                <img src={logo} className="w-32" alt="Company Logo" />
              </div>

              <SidebarContext.Provider value={{ expanded: true }}>
                <ul className="flex-1 px-3">
                  {navItems
                    .filter((item) => item.visible)
                    .map((item) => (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                </ul>
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div
                    className="flex cursor-pointer items-center p-3 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      navigate("/profile");
                      setMobileOpen(false);
                    }}
                  >
                    <img
                      src={`https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true&name=${encodeURIComponent(
                        user?.name || "User"
                      )}`}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-md"
                    />
                    <div className="ml-3 flex flex-col">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {user?.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 pb-2">
                    <SidebarItem
                      item={logoutItem}
                      onClick={() => {
                        onLogout();
                        setMobileOpen(false);
                      }}
                    />
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                    <ThemeSwitcher isCollapsed={false} />
                  </div>
                </div>
              </SidebarContext.Provider>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
