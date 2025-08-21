// In packages/client/src/pages/EmployeeDetailPage/PlatformLogPage.jsx
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { CustomSelect } from "../../components/ui/CustomSelect";
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
  { id: "all", name: "All Services" },
  { id: "sso", name: "SSO" },
  { id: "directory", name: "Directory" },
  { id: "ldap", name: "LDAP" },
  { id: "systems", name: "Systems" },
];

const limitOptions = [
  { id: 100, name: "100 Results" },
  { id: 500, name: "500 Results" },
  { id: 1000, name: "1000 Results" },
];

export const PlatformLogPage = ({ employeeId }) => {
  const [selectedPlatform, setSelectedPlatform] = useState("jumpcloud");
  const [filterParams, setFilterParams] = useState({
    startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endTime: new Date().toISOString().split("T")[0],
    limit: 100,
    service: "all",
  });

  const {
    data: logData,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["platformLogs", employeeId, selectedPlatform, filterParams],
    queryFn: async () => {
      const params = new URLSearchParams({
        platform: selectedPlatform,
        ...filterParams,
      });
      const { data } = await api.get(
        `/api/employees/${employeeId}/platform-logs?${params}`
      );
      return data;
    },
    enabled: !!employeeId, // Query will run automatically
    keepPreviousData: true, // Prevents UI flicker while new data loads
  });

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
            logs={logData}
            loading={isLoading || isFetching}
            error={error}
          />
        );
      case "google":
        return (
          <GoogleLogPage
            logs={logData}
            loading={isLoading || isFetching}
            error={error}
          />
        );
      case "slack":
        return (
          <SlackLogPage
            logs={logData}
            loading={isLoading || isFetching}
            error={error}
          />
        );
      default:
        return null;
    }
  }, [selectedPlatform, logData, isLoading, error, isFetching]);

  const maxDate = new Date().toISOString().split("T")[0];

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
              <Filter size={16} /> Filters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
      </div>
      <div className="p-4">{LogViewer}</div>
    </div>
  );
};
