// packages/client/src/pages/EmployeeDetailPage/EmployeeDetailPage.js
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { LicensesTab } from "./LicensesTab";
import { UnifiedTimelinePage } from "./UnifiedTimelinePage";
import { PlatformLogPage } from "./PlatformLogPage";
import { DevicesTab } from "./DevicesTab";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export const EmployeeDetailPage = ({
  onEdit,
  onDeactivate,
  permissions,
  onLogout,
}) => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { setDynamicCrumbs } = useBreadcrumb();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [platformStatuses, setPlatformStatuses] = useState([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [tabData, setTabData] = useState({
    timeline: { data: [], loading: false, error: null, fetched: false },
  });

  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

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

  const fetchInitialData = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      onLogout();
      return;
    }

    setLoading(true);
    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 404) throw new Error("Employee not found.");
        if (!res.ok) throw new Error("Failed to fetch employee profile.");
        return res.json();
      })
      .then((empData) => {
        setEmployee(empData);
        const fullName = [
          empData.first_name,
          empData.middle_name,
          empData.last_name,
        ]
          .filter(Boolean)
          .join(" ");
        setDynamicCrumbs([
          { name: "Employees", path: "/employees" },
          { name: fullName, path: `/employees/${employeeId}` },
        ]);
      })
      .catch((err) => {
        console.error("Error fetching main employee data:", err);
        setPageError(err.message);
      })
      .finally(() => setLoading(false));

    setIsLoadingPlatforms(true);
    fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/employees/${employeeId}/platform-statuses`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((statusData) => setPlatformStatuses(statusData))
      .catch((err) => console.error("Failed to fetch platform statuses:", err))
      .finally(() => setIsLoadingPlatforms(false));
  }, [employeeId, onLogout, setDynamicCrumbs]);

  useEffect(() => {
    fetchInitialData();

    const token = localStorage.getItem("accessToken");
    if (token && employeeId) {
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/logs/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetEmployeeId: employeeId }),
      }).catch((err) => console.error("Failed to log profile view:", err));
    }

    return () => {
      setDynamicCrumbs([]);
    };
  }, [fetchInitialData, setDynamicCrumbs, employeeId]);

  const fetchTimelineData = useCallback(
    (force = false) => {
      if (
        !employeeId ||
        !permissions.includes("log:read:platform") ||
        (!force && (tabData.timeline.fetched || tabData.timeline.loading))
      ) {
        return;
      }

      const token = localStorage.getItem("accessToken");
      let url = `${process.env.REACT_APP_API_BASE_URL}/api/employees/${employeeId}/unified-timeline`;

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
    [employeeId, permissions, tabData.timeline]
  );

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMoreMenuOpen(false);
    if (tabId === "timeline") {
      fetchTimelineData();
    }
  };

  const handleTicketClick = (ticketId) => {
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setIsJiraModalOpen(true);
    }
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
        />
      )}
      {activeTab === "devices" && <DevicesTab employeeId={employeeId} />}
      {activeTab === "platforms" && (
        <EmployeeApplicationsTab
          applications={employee.applications || []}
          platformStatuses={platformStatuses}
          isLoading={isLoadingPlatforms}
          onTicketClick={handleTicketClick}
        />
      )}
      {activeTab === "licenses" && <LicensesTab employeeId={employeeId} />}
      {activeTab === "platform-logs" && (
        <PlatformLogPage employeeId={employeeId} onLogout={onLogout} />
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

  if (loading)
    return <div className="p-6 text-center">Loading employee profile...</div>;
  if (pageError)
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle className="mx-auto w-12 h-12 mb-4" />{" "}
        <h2 className="text-xl font-semibold">Could not load employee data</h2>{" "}
        <p>{pageError}</p>{" "}
      </div>
    );
  if (!employee) return null;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <EmployeeDetailHeader
          employee={employee}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
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
    </>
  );
};
