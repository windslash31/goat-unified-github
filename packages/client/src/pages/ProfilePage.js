import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  UserSquare,
  LayoutGrid,
  HardDrive,
  Bot,
  KeyRound,
  Laptop,
  MoreVertical,
} from "lucide-react";
import { EmployeeDetailHeader } from "./EmployeeDetailPage/EmployeeDetailHeader";
import { EmployeeDetailsTab } from "./EmployeeDetailPage/EmployeeDetailsTab";
import { EmployeeApplicationsTab } from "./EmployeeDetailPage/EmployeeApplicationsTab";
import { JiraTicketModal } from "../components/ui/JiraTicketModal";
import { WelcomePage } from "../components/ui/WelcomePage";
import { AccessDeniedPage } from "../components/ui/AccessDeniedPage";
import { UnifiedTimelinePage } from "./EmployeeDetailPage/UnifiedTimelinePage";
import { Button } from "../components/ui/Button";
import { ChangePasswordModal } from "../components/ui/ChangePasswordModal";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformLogPage } from "./EmployeeDetailPage/PlatformLogPage";
import { DevicesTab } from "./EmployeeDetailPage/DevicesTab";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import api from "../api/api";
import { EmployeeDetailSkeleton } from "../components/ui/EmployeeDetailSkeleton";

const fetchMe = async () => {
  const { data } = await api.get("/api/me");
  return data;
};

export const ProfilePage = ({
  employee,
  permissions,
  onEdit,
  onDeactivate,
  onLogout,
  user,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState("details");
  const [platformStatuses, setPlatformStatuses] = useState([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  const [tabData, setTabData] = useState({
    timeline: { data: null, loading: false, error: null, fetched: false },
  });

  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: currentUserEmployeeRecord, isLoading: isLoadingMe } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const allTabs = [
    {
      id: "details",
      label: "Details",
      icon: <UserSquare size={16} />,
      permission: true,
    },
    {
      id: "devices",
      label: "Devices",
      icon: <Laptop size={16} />,
      permission: true,
    },
    {
      id: "platforms",
      label: "Apps & Platforms",
      shortLabel: "Access",
      icon: <LayoutGrid size={16} />,
      permission: true,
    },
    {
      id: "platform-logs",
      label: "Platform Logs",
      shortLabel: "Logs",
      icon: <HardDrive size={16} />,
      permission: permissions.includes("log:read:platform"),
    },
    {
      id: "timeline",
      label: "Unified Timeline",
      shortLabel: "Timeline",
      icon: <Bot size={16} />,
      permission: permissions.includes("log:read:platform"),
    },
  ].filter((tab) => tab.permission);

  const VISIBLE_TABS_COUNT = 3;
  const visibleTabs = isDesktop
    ? allTabs
    : allTabs.slice(0, VISIBLE_TABS_COUNT);
  const overflowTabs = isDesktop ? [] : allTabs.slice(VISIBLE_TABS_COUNT);
  const isActiveTabInMoreMenu = overflowTabs.some(
    (tab) => tab.id === activeTab
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTimelineData = useCallback(
    (force = false) => {
      if (
        !employee ||
        !permissions.includes("log:read:platform") ||
        (!force && (tabData.timeline.fetched || tabData.timeline.loading))
      ) {
        return;
      }

      const token = localStorage.getItem("accessToken");
      let url = `${process.env.REACT_APP_API_BASE_URL}/api/employees/${employee.id}/unified-timeline`;

      setTabData((prev) => ({
        ...prev,
        timeline: { ...prev.timeline, loading: true },
      }));

      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) =>
          res.ok ? res.json() : res.json().then((err) => Promise.reject(err))
        )
        .then((data) => {
          setTabData((prev) => ({
            ...prev,
            timeline: { data, loading: false, error: null, fetched: true },
          }));
        })
        .catch((err) => {
          setTabData((prev) => ({
            ...prev,
            timeline: {
              data: [],
              loading: false,
              error: err.message,
              fetched: true,
            },
          }));
        });
    },
    [employee, permissions, tabData.timeline]
  );

  const fetchInitialData = useCallback(async () => {
    if (!employee) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      onLogout();
      return;
    }

    setIsLoadingPlatforms(true);
    fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/employees/${employee.id}/platform-statuses`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((statusData) => setPlatformStatuses(statusData))
      .catch((err) => console.error("Failed to fetch platform statuses:", err))
      .finally(() => setIsLoadingPlatforms(false));
  }, [employee, onLogout]);

  useEffect(() => {
    if (employee) {
      fetchInitialData();
    }
  }, [employee, fetchInitialData]);

  useEffect(() => {
    if (employee && activeTab === "timeline") {
      fetchTimelineData();
    }
  }, [employee, activeTab, fetchTimelineData]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMoreMenuOpen(false);
  };

  const handleTicketClick = (ticketId) => {
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setIsJiraModalOpen(true);
    }
  };

  if (isLoadingMe) return <EmployeeDetailSkeleton />;

  if (!permissions.includes("profile:read:own")) {
    return <AccessDeniedPage />;
  }
  if (!employee) {
    return <WelcomePage user={user} />;
  }

  const TabButton = ({ id, label, shortLabel, icon }) => (
    <button
      onClick={() => handleTabClick(id)}
      className={`flex-shrink-0 flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
        activeTab === id
          ? "border-kredivo-primary text-kredivo-primary"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {icon} {isDesktop ? label : shortLabel || label}
    </button>
  );

  const TabContent = (
    <div className="mt-6">
      {activeTab === "details" && (
        <EmployeeDetailsTab
          employee={employee}
          permissions={permissions}
          onTicketClick={handleTicketClick}
        />
      )}
      {activeTab === "devices" && <DevicesTab employeeId={employee.id} />}
      {activeTab === "platforms" && (
        <EmployeeApplicationsTab
          applications={employee.applications || []}
          platformStatuses={platformStatuses}
          isLoading={isLoadingPlatforms}
          onTicketClick={handleTicketClick}
        />
      )}
      {activeTab === "platform-logs" && (
        <PlatformLogPage employeeId={employee.id} onLogout={onLogout} />
      )}
      {activeTab === "timeline" && (
        <UnifiedTimelinePage
          events={tabData.timeline.data}
          loading={tabData.timeline.loading}
          error={tabData.timeline.error}
        />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              This is your personal employee record and application access list.
            </p>
          </div>
          <Button
            onClick={() => setIsChangePasswordModalOpen(true)}
            variant="secondary"
            className="mt-4 md:mt-0"
          >
            <KeyRound className="w-4 h-4 mr-2" /> Change Password
          </Button>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          <EmployeeDetailHeader
            employee={employee}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
            permissions={permissions}
            isOwnProfile={true}
          />
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <nav
                className="-mb-px flex items-center overflow-x-auto"
                aria-label="Tabs"
              >
                {visibleTabs.map((tab) => (
                  <TabButton key={tab.id} {...tab} />
                ))}
              </nav>
              {overflowTabs.length > 0 && (
                <div ref={moreMenuRef} className="relative ml-auto pl-2">
                  <button
                    onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                    className={`flex-shrink-0 flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                      isActiveTabInMoreMenu
                        ? "border-kredivo-primary text-kredivo-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <MoreVertical size={16} /> More
                  </button>
                  <AnimatePresence>
                    {isMoreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                      >
                        <div className="py-1">
                          {overflowTabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => handleTabClick(tab.id)}
                              className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${
                                activeTab === tab.id
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              {tab.icon} {tab.shortLabel || tab.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
          {TabContent}
        </div>
      </div>
      {isJiraModalOpen && (
        <JiraTicketModal
          ticketId={selectedTicketId}
          onClose={() => setIsJiraModalOpen(false)}
        />
      )}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </motion.div>
  );
};