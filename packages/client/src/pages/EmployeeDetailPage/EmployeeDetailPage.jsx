import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  UserSquare,
  LayoutGrid,
  HardDrive,
  AlertTriangle,
  Bot,
  BookLock,
  Laptop,
  MoreVertical,
} from "lucide-react";
import { useBreadcrumb } from "../../context/BreadcrumbContext";
import { EmployeeDetailHeader } from "./EmployeeDetailHeader";
import { EmployeeDetailsTab } from "./EmployeeDetailsTab";
import { EmployeeApplicationsTab } from "./EmployeeApplicationsTab";
import { JiraTicketModal } from "../../components/ui/JiraTicketModal";
import { AssetDetailModal } from "../../components/ui/AssetDetailModal";
import { LicensesTab } from "./LicensesTab";
import { UnifiedTimelinePage } from "./UnifiedTimelinePage";
import { PlatformLogPage } from "./PlatformLogPage";
import { DevicesTab } from "./DevicesTab";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import api from "../../api/api";
import { EmployeeDetailSkeleton } from "../../components/ui/EmployeeDetailSkeleton";
import { useModalStore } from "../../stores/modalStore";

const fetchEmployeeById = async (employeeId) => {
  const { data } = await api.get(`/api/employees/${employeeId}`);
  return data;
};

const fetchTimelineData = async (employeeId) => {
  const { data } = await api.get(
    `/api/employees/${employeeId}/unified-timeline`
  );
  return data;
};

export const EmployeeDetailPage = ({ permissions, onLogout }) => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { setDynamicCrumbs } = useBreadcrumb();
  const { openModal } = useModalStore();
  const [activeTab, setActiveTab] = useState("details");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const {
    data: employee,
    isLoading: isEmployeeLoading,
    error: pageError,
  } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => fetchEmployeeById(employeeId),
    enabled: !!employeeId,
    onError: (err) => {
      console.error("Failed to fetch employee:", err);
    },
  });

  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    error: timelineError,
  } = useQuery({
    queryKey: ["timeline", employeeId],
    queryFn: () => fetchTimelineData(employeeId),
    enabled: !!employeeId && activeTab === "timeline",
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
      id: "licenses",
      label: "Licenses",
      icon: <BookLock size={16} />,
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

  useEffect(() => {
    if (employee) {
      const fullName = [
        employee.first_name,
        employee.middle_name,
        employee.last_name,
      ]
        .filter(Boolean)
        .join(" ");
      setDynamicCrumbs([
        { name: "Employees", path: "/employees" },
        { name: fullName, path: `/employees/${employeeId}` },
      ]);

      api
        .post("/api/employees/logs/view", { targetEmployeeId: employeeId })
        .catch((err) => console.error("Failed to log profile view:", err));
    }
    return () => {
      setDynamicCrumbs([]);
    };
  }, [employee, employeeId, setDynamicCrumbs]);

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

  const handleAssetClick = (asset) => {
    if (asset) {
      setSelectedAsset(asset);
      setIsAssetModalOpen(true);
    }
  };

  const handleEdit = () => {
    openModal("editEmployee", employee);
  };

  const handleDeactivate = () => {
    openModal("deactivateEmployee", employee);
  };

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
          navigate={navigate}
          permissions={permissions}
          onTicketClick={handleTicketClick}
          onAssetClick={handleAssetClick}
        />
      )}
      {activeTab === "devices" && <DevicesTab employeeId={employeeId} />}
      {activeTab === "platforms" && (
        <EmployeeApplicationsTab
          employeeId={employeeId}
          applications={employee.applications || []}
          platformStatuses={employee.platform_statuses || []}
          isLoading={isEmployeeLoading}
          onTicketClick={handleTicketClick}
        />
      )}
      {activeTab === "licenses" && <LicensesTab employeeId={employeeId} />}
      {activeTab === "platform-logs" && (
        <PlatformLogPage employeeId={employeeId} onLogout={onLogout} />
      )}
      {activeTab === "timeline" && (
        <UnifiedTimelinePage
          events={timelineData}
          loading={isTimelineLoading}
          error={timelineError}
        />
      )}
    </div>
  );

  if (isEmployeeLoading) return <EmployeeDetailSkeleton />;

  if (pageError)
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle className="mx-auto w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Could not load employee data</h2>
        <p>{pageError.message || "An unexpected error occurred."}</p>
      </div>
    );

  if (!employee) return null;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <EmployeeDetailHeader
          employee={employee}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          permissions={permissions}
          isOwnProfile={false}
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
      {isJiraModalOpen && (
        <JiraTicketModal
          ticketId={selectedTicketId}
          onClose={() => setIsJiraModalOpen(false)}
        />
      )}

      {isAssetModalOpen && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setIsAssetModalOpen(false)}
        />
      )}
    </>
  );
};
