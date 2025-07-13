import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle,
  XCircle,
  Info,
  Hash,
  Cpu,
  HardDrive,
  Monitor,
  Shield,
  Globe,
  Wifi,
} from "lucide-react";
import { Button } from "./Button";

// A reusable row for displaying details, now with an icon
const DetailRow = ({ label, value, icon, isMono = false }) => (
  <div className="flex items-start py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <dt className="w-1/3 text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-2">
      {icon}
      <span className="font-medium">{label}</span>
    </dt>
    <dd
      className={`w-2/3 text-gray-800 dark:text-gray-200 text-right break-words ${
        isMono ? "font-mono text-xs" : ""
      }`}
    >
      {value}
    </dd>
  </div>
);

// A reusable section header to group related information
const SectionHeader = ({ children }) => (
  <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 pb-1 border-b-2 border-kredivo-primary/50">
    {children}
  </h4>
);

export const DeviceDetailModal = ({ device, onClose }) => {
  if (!device) return null;

  // Helper to format boolean values for display
  const formatBoolean = (value) =>
    value ? (
      <span className="flex items-center justify-end gap-1 text-green-600 dark:text-green-400">
        <CheckCircle size={14} /> Enabled
      </span>
    ) : (
      <span className="flex items-center justify-end gap-1 text-red-600 dark:text-red-400">
        <XCircle size={14} /> Disabled
      </span>
    );

  // Filter network interfaces for valid IPv4 addresses
  const validIpV4Interfaces =
    device.networkInterfaces?.filter(
      (iface) =>
        iface.address &&
        /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(iface.address) &&
        !iface.address.startsWith("127.")
    ) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {device.displayName || device.hostname}
            </h3>
            <Button
              onClick={onClose}
              variant="secondary"
              className="p-1 h-auto"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto space-y-2">
            <SectionHeader>System Information</SectionHeader>
            <DetailRow
              icon={<Info size={14} />}
              label="Hostname"
              value={device.hostname}
            />
            <DetailRow
              icon={<Monitor size={14} />}
              label="Operating System"
              value={`${device.os} ${device.version}`}
            />
            <DetailRow
              icon={<Cpu size={14} />}
              label="Architecture"
              value={device.arch}
            />
            <DetailRow
              icon={<Hash size={14} />}
              label="Serial Number"
              value={device.serialNumber}
              isMono={true}
            />
            <DetailRow
              icon={<Info size={14} />}
              label="Agent Version"
              value={device.agentVersion}
            />
            <DetailRow
              icon={<Info size={14} />}
              label="Last Contact"
              value={new Date(device.lastContact).toLocaleString()}
            />

            <SectionHeader>Security</SectionHeader>
            <DetailRow
              icon={<Shield size={14} />}
              label="Multi-Factor Auth"
              value={formatBoolean(device.allowMultiFactorAuthentication)}
            />
            <DetailRow
              icon={<HardDrive size={14} />}
              label="Disk Encryption"
              value={formatBoolean(device.fde?.active)}
            />
            <DetailRow
              icon={<CheckCircle size={14} />}
              label="Has Service Account"
              value={formatBoolean(device.hasServiceAccount)}
            />

            <SectionHeader>Network</SectionHeader>
            {validIpV4Interfaces.length > 0 ? (
              validIpV4Interfaces.map((iface) => (
                <DetailRow
                  key={iface.name}
                  icon={<Wifi size={14} />}
                  label={iface.name}
                  value={iface.address}
                  isMono={true}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 py-2">
                No valid IPv4 addresses found.
              </p>
            )}
          </div>

          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 text-right">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
