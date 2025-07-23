import React, { useState, useCallback, useMemo } from "react";
import { Filter } from "lucide-react";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { Button } from "../../components/ui/Button";
import { JumpCloudLogPage } from "./JumpcloudLogPage";
import { GoogleLogPage } from "./GoogleLogPage";
import { SlackLogPage } from "./SlackLogPage";
import api from "../../api/api";

const platformOptions = [
  { id: "jumpcloud", name: "JumpCloud" },
  { id: "google", name: "Google Workspace" },
  { id: "slack", name: "Slack" },
];

const jumpCloudServiceOptions = [
  { id: "all", name: "All" },
  { id: "access_management", name: "Access Management" },
  { id: "alert", name: "Alert" },
  { id: "directory", name: "Directory" },
  { id: "ldap", name: "LDAP" },
  { id: "mdm", name: "MDM" },
  { id: "notifications", name: "Notifications" },
  { id: "password_manager", name: "Password Manager" },
  { id: "object_storage", name: "Object Storage" },
  { id: "radius", name: "RADIUS" },
  { id: "reports", name: "Reports" },
  { id: "software", name: "Software" },
  { id: "sso", name: "SSO" },
  { id: "systems", name: "Systems" },
];

export const PlatformLogPage = ({ employeeId, onLogout }) => {
  const [selectedPlatform, setSelectedPlatform] = useState("jumpcloud");
  const [logData, setLogData] = useState({
    data: [],
    loading: false,
    error: null,
    fetched: false,
  });

  const [filterParams, setFilterParams] = useState({
    startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endTime: new Date().toISOString().split("T")[0],
    limit: 100,
    service: "all",
  });

  const fetchLogData = useCallback(async () => {
    if (!employeeId) return;

    setLogData({ data: [], loading: true, error: null, fetched: false });

    let url;
    const baseUrl = `/api/employees/${employeeId}`;

    switch (selectedPlatform) {
      case "jumpcloud":
        const params = new URLSearchParams({
          startTime: filterParams.startTime,
          endTime: filterParams.endTime,
          limit: filterParams.limit,
          service: filterParams.service,
        });
        url = `${baseUrl}/jumpcloud-logs?${params.toString()}`;
        break;
      case "google":
        url = `${baseUrl}/google-logs`;
        break;
      case "slack":
        url = `${baseUrl}/slack-logs`;
        break;
      default:
        setLogData({
          data: [],
          loading: false,
          error: "Invalid platform selected",
          fetched: true,
        });
        return;
    }

    try {
      const { data } = await api.get(url);
      setLogData({ data, loading: false, error: null, fetched: true });
    } catch (error) {
      setLogData({
        data: [],
        loading: false,
        error: error.response?.data?.message || "Failed to fetch logs",
        fetched: true,
      });
    }
  }, [employeeId, selectedPlatform, filterParams]);

  const handleFilterChange = (e) => {
    setFilterParams((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name, value) => {
    setFilterParams((prev) => ({ ...prev, [name]: value }));
  };

  const LogViewer = useMemo(() => {
    switch (selectedPlatform) {
      case "jumpcloud":
        return (
          <JumpCloudLogPage
            logs={logData.data}
            loading={logData.loading}
            error={logData.error}
          />
        );
      case "google":
        return (
          <GoogleLogPage
            logs={logData.data}
            loading={logData.loading}
            error={logData.error}
          />
        );
      case "slack":
        return (
          <SlackLogPage
            logs={logData.data}
            loading={logData.loading}
            error={logData.error}
          />
        );
      default:
        return (
          <div className="p-8 text-center">
            Please select a platform to view logs.
          </div>
        );
    }
  }, [selectedPlatform, logData]);

  const maxDate = new Date().toISOString().split("T")[0];
  const minDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const limitOptions = [
    { id: 10, name: "10" },
    { id: 100, name: "100" },
    { id: 500, name: "500" },
    { id: 1000, name: "1000" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 space-y-4">
        <div>
          <label
            htmlFor="platform"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Select Platform
          </label>
          <CustomSelect
            id="platform"
            options={platformOptions}
            value={selectedPlatform}
            onChange={setSelectedPlatform}
          />
        </div>
        {selectedPlatform === "jumpcloud" && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
            <h4 className="font-semibold text-md mb-2 flex items-center gap-2">
              <Filter size={16} /> JumpCloud Filters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label
                  htmlFor="service"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Service
                </label>
                <CustomSelect
                  id="service"
                  options={jumpCloudServiceOptions}
                  value={filterParams.service}
                  onChange={(val) => handleSelectChange("service", val)}
                />
              </div>
              <div>
                <label
                  htmlFor="limit"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Limit
                </label>
                <CustomSelect
                  id="limit"
                  options={limitOptions}
                  value={filterParams.limit}
                  onChange={(val) => handleSelectChange("limit", val)}
                />
              </div>
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  name="startTime"
                  id="startTime"
                  value={filterParams.startTime}
                  min={minDate}
                  max={maxDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-kredivo-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  End Date
                </label>
                <input
                  type="date"
                  name="endTime"
                  id="endTime"
                  value={filterParams.endTime}
                  min={filterParams.startTime}
                  max={maxDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-kredivo-primary"
                />
              </div>
            </div>
          </div>
        )}
        <Button
          onClick={fetchLogData}
          disabled={logData.loading}
          className="w-full md:w-auto justify-center"
        >
          {logData.loading
            ? "Fetching..."
            : `Fetch ${
                platformOptions.find((p) => p.id === selectedPlatform)?.name
              } Logs`}
        </Button>
      </div>
      <div className="p-4">{LogViewer}</div>
    </div>
  );
};
