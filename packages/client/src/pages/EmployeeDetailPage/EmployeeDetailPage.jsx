import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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
import { JiraTicketModal } from "../../components/ui/JiraTicketModal";
import { AssetDetailModal } from "../../components/ui/AssetDetailModal";
import { UnifiedTimelinePage } from "./UnifiedTimelinePage";
import { PlatformLogPage } from "./PlatformLogPage";
import { DevicesTab } from "./DevicesTab";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import api from "../../api/api";
import { EmployeeDetailSkeleton } from "../../components/ui/EmployeeDetailSkeleton";
import { useModalStore } from "../../stores/modalStore";

// --- CORRECTED IMPORTS ---
import ApplicationsTab from "./ApplicationsTab"; // Import our new consolidated component
import { LicensesTab } from "./LicensesTab";

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
  const { setDynamicCrumbs } = useBreadcrumb();
  const { openModal } = useModalStore();
  const [activeTab, setActiveTab] = useState("details");
  const moreMenuRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
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
      id: "applications",
      label: "Applications",
      shortLabel: "Apps",
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
      id: "devices",
      label: "Devices",
      icon: <Laptop size={16} />,
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

  const VISIBLE_TABS_COUNT = 4;
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
    }
  }, [employee, employeeId, setDynamicCrumbs]);

  const handleTabClick = (tabId) => setActiveTab(tabId);
  const handleTicketClick = (ticketId) => {
    setSelectedTicketId(ticketId);
    setIsJiraModalOpen(true);
  };
  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };
  const handleEdit = () => openModal("editEmployee", employee);
  const handleDeactivate = () => openModal("deactivateEmployee", employee);

  const TabButton = ({ id, label, shortLabel, icon }) => (
    <button
      onClick={() => handleTabClick(id)}
      className={`flex-shrink-0 flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
        activeTab === id
          ? "border-kredivo-primary text-kredivo-primary"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon} {isDesktop ? label : shortLabel || label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <EmployeeDetailsTab
            employee={employee}
            onTicketClick={handleTicketClick}
            onAssetClick={handleAssetClick}
            permissions={permissions}
          />
        );
      case "applications":
        return (
          <ApplicationsTab
            employee={employee}
            onTicketClick={handleTicketClick}
          />
        );
      case "licenses":
        return <LicensesTab employeeId={employeeId} />;
      case "devices":
        return <DevicesTab employeeId={employeeId} />;
      case "platform-logs":
        return <PlatformLogPage employeeId={employeeId} onLogout={onLogout} />;
      case "timeline":
        return (
          <UnifiedTimelinePage
            events={timelineData}
            loading={isTimelineLoading}
            error={timelineError}
          />
        );
      default:
        return null;
    }
  };

  if (isEmployeeLoading) return <EmployeeDetailSkeleton />;
  if (pageError)
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle className="mx-auto w-12 h-12" />
        <h2>Could not load employee</h2>
        <p>{pageError.message}</p>
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
            <nav className="-mb-px flex items-center overflow-x-auto">
              {visibleTabs.map((tab) => (
                <TabButton key={tab.id} {...tab} />
              ))}
            </nav>
            {overflowTabs.length > 0 && (
              <div ref={moreMenuRef} className="relative ml-auto pl-2">
                <button
                  onClick={() => setIsMoreMenuOpen((p) => !p)}
                  className={`flex-shrink-0 flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors ${
                    isActiveTabInMoreMenu
                      ? "border-kredivo-primary text-kredivo-primary"
                      : "border-transparent text-gray-500"
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
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
                    >
                      <div className="py-1">
                        {overflowTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              handleTabClick(tab.id);
                              setIsMoreMenuOpen(false);
                            }}
                            className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${
                              activeTab === tab.id
                                ? "bg-gray-100 dark:bg-gray-700"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {tab.icon} {tab.label}
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
        <div className="mt-6">{renderContent()}</div>
      </div>
      <JiraTicketModal
        ticketId={selectedTicketId}
        onClose={() => setIsJiraModalOpen(false)}
      />
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setIsAssetModalOpen(false)}
      />
    </>
  );
};
