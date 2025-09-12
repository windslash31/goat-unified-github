import React from "react";
import { Portal } from "./Portal";
import {
  X,
  Laptop,
  Hash,
  Info,
  Tag,
  CheckCircle,
  FileText,
  Building,
  User,
  Package,
  Monitor,
  Receipt,
  FilePlus,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { formatDateTime } from "../../utils/formatters";

const DetailRow = ({ label, value, icon, isMono = false }) => {
  if (!value) return null;
  return (
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
        {String(value)}
      </dd>
    </div>
  );
};

const SectionHeader = ({ children }) => (
  <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 pb-1 border-b-2 border-kredivo-primary/50">
    {children}
  </h4>
);

export const AssetDetailModal = ({ asset, onClose }) => {
  if (!asset) return null;

  return (
    <Portal>
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
              <div className="flex items-center gap-3">
                <Laptop className="w-6 h-6 text-kredivo-primary" />
                <h3 className="text-lg font-semibold">
                  {asset.name || "Asset Details"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-2">
              <SectionHeader>Asset Identity</SectionHeader>
              <DetailRow
                icon={<Info size={14} />}
                label="Key"
                value={asset.key}
              />
              <DetailRow
                icon={<Laptop size={14} />}
                label="Name"
                value={asset.name}
              />
              <DetailRow
                icon={<Package size={14} />}
                label="Model/Type"
                value={asset["Model/Type"]}
              />
              <DetailRow
                icon={<Hash size={14} />}
                label="Serial Number"
                value={asset["Serial Number"]}
                isMono
              />
              <DetailRow
                icon={<Tag size={14} />}
                label="Tag"
                value={asset.Tag}
              />

              <SectionHeader>Status & Ownership</SectionHeader>
              <DetailRow
                icon={<CheckCircle size={14} />}
                label="Status"
                value={asset.Status}
              />
              <DetailRow
                icon={<User size={14} />}
                label="Owner"
                value={asset.Owner}
              />
              <DetailRow
                icon={<Building size={14} />}
                label="Location"
                value={asset.Location}
              />
              <DetailRow
                icon={<Monitor size={14} />}
                label="Operating System"
                value={asset["Operating System"]}
              />

              <SectionHeader>Purchase & Timeline</SectionHeader>
              <DetailRow
                icon={<FileText size={14} />}
                label="Invoice Number"
                value={asset["Invoice Number"]}
              />
              <DetailRow
                icon={<Receipt size={14} />}
                label="Buying Years"
                value={asset["Buying Years"]}
              />
              <DetailRow
                icon={<FilePlus size={14} />}
                label="Created"
                value={formatDateTime(asset.Created)}
              />
              <DetailRow
                icon={<Edit size={14} />}
                label="Updated"
                value={formatDateTime(asset.Updated)}
              />
            </div>
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 text-right">
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};
