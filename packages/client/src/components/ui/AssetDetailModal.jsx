import React from "react";
import { Portal } from "./Portal";
import { X, Laptop } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  } catch (error) {
    return dateString;
  }
};

const DetailRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2.5 px-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500 sm:col-span-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 dark:text-gray-200 sm:col-span-2 break-words">
        {String(value)}
      </dd>
    </div>
  );
};

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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Laptop className="w-6 h-6 text-kredivo-primary" />
                <h3 className="text-lg font-semibold">
                  {asset.key || "Asset Details"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <dl>
                <DetailRow label="Key" value={asset.key} />
                <DetailRow label="Name" value={asset.name} />
                <DetailRow label="Type" value={asset.type} />
                <DetailRow label="Tag" value={asset.Tag} />
                <DetailRow
                  label="Serial Number"
                  value={asset["Serial Number"]}
                />
                <DetailRow label="Status" value={asset.Status} />
                <DetailRow
                  label="Invoice Number"
                  value={asset["Invoice Number"]}
                />
                <DetailRow label="Buying Years" value={asset["Buying Years"]} />
                <DetailRow
                  label="Operating System"
                  value={asset["Operating System"]}
                />
                <DetailRow label="Created" value={formatDate(asset.Created)} />
                <DetailRow label="Updated" value={formatDate(asset.Updated)} />
                <DetailRow label="Model/Type" value={asset["Model/Type"]} />
                <DetailRow label="Location" value={asset.Location} />
                <DetailRow label="Owner" value={asset.Owner} />
              </dl>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};