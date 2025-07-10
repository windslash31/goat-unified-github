// packages/client/src/pages/EmployeeDetailPage/DevicesTab.js
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/api";
import { Smartphone, Laptop, Server, CheckCircle, XCircle } from "lucide-react";
import { DeviceDetailModal } from "../../components/ui/DeviceDetailModal"; // Import the new modal

const fetchEmployeeDevices = async (employeeId) => {
  const { data } = await api.get(`/api/employees/${employeeId}/devices`);
  return data;
};

const DeviceCard = ({ device, onClick }) => {
  const getDeviceIcon = (os) => {
    if (os.toLowerCase().includes("windows"))
      return <Laptop className="w-8 h-8 text-blue-500" />;
    if (os.toLowerCase().includes("mac"))
      return <Laptop className="w-8 h-8 text-gray-500" />;
    if (os.toLowerCase().includes("linux"))
      return <Server className="w-8 h-8 text-yellow-500" />;
    return <Smartphone className="w-8 h-8 text-green-500" />;
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {getDeviceIcon(device.os)}
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              {device.hostname || "N/A"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {device.os}
            </p>
          </div>
        </div>
        {device.active ? (
          <span className="flex items-center text-xs gap-1 text-green-600">
            <CheckCircle size={14} /> Active
          </span>
        ) : (
          <span className="flex items-center text-xs gap-1 text-red-600">
            <XCircle size={14} /> Inactive
          </span>
        )}
      </div>
      <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Last Contact:</span>
          <span>{new Date(device.lastContact).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export const DevicesTab = ({ employeeId }) => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const {
    data: devices,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employeeDevices", employeeId],
    queryFn: () => fetchEmployeeDevices(employeeId),
  });

  if (isLoading)
    return <div className="text-center p-6">Loading device details...</div>;
  if (error)
    return (
      <div className="text-center p-6 text-red-500">
        Could not fetch device details.
      </div>
    );
  if (!devices || devices.length === 0)
    return (
      <div className="text-center p-6 text-gray-500">
        No devices found for this employee.
      </div>
    );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onClick={() => setSelectedDevice(device)}
          />
        ))}
      </div>
      <DeviceDetailModal
        device={selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />
    </>
  );
};
