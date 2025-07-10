import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { CustomSelect } from "./CustomSelect";
import { Portal } from "./Portal";
import { motion, AnimatePresence } from "framer-motion";

const FilterDropdown = ({ label, name, value, onChange, options = [] }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    >
      {label}
    </label>
    <CustomSelect
      id={name}
      options={options}
      value={value}
      onChange={(val) => onChange({ target: { name, value: val } })}
      placeholder="All"
    />
  </div>
);

export const FilterPopover = ({
  initialFilters,
  onApply,
  onClear,
  onClose,
  options,
  buttonRef,
  isActivityLog = false,
}) => {
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: "auto" });

  const statusOptions = [
    { id: "all", name: "All" },
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
    { id: "invited", name: "Invited" },
  ];

  useLayoutEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (window.innerWidth < 768) {
        setPosition({
          top: rect.bottom + 10,
          left: "1rem",
          right: "1rem",
          width: "auto",
        });
      } else {
        setPosition({
          top: rect.bottom + 10,
          right: window.innerWidth - rect.right,
          left: "auto",
          width: "24rem",
        });
      }
    }
  }, [buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('[data-role="custom-select-options"]')) {
        return;
      }
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, buttonRef]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyClick = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClearClick = () => {
    onClear();
    onClose();
  };

  const popoverVariants = {
    hidden: { opacity: 0, scale: 0.98, y: -5 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: -5,
      transition: { duration: 0.15, ease: "easeIn" },
    },
  };

  const renderEmployeeFilters = () => (
    <>
      <FilterDropdown
        label="Status"
        name="status"
        value={localFilters.status}
        onChange={handleInputChange}
        options={statusOptions}
      />
      <FilterDropdown
        label="Internal Application"
        name="application_id"
        value={localFilters.application_id}
        onChange={handleInputChange}
        options={options.applications}
      />
      {/* ... other employee filters */}
    </>
  );

  const renderActivityLogFilters = () => (
    <>
      <FilterDropdown
        label="Action Type"
        name="actionType"
        value={localFilters.actionType}
        onChange={handleInputChange}
        options={options.actionTypes}
      />
      <FilterDropdown
        label="Actor"
        name="actorEmail"
        value={localFilters.actorEmail}
        onChange={handleInputChange}
        options={options.actors}
      />
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            value={localFilters.startDate || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            id="endDate"
            value={localFilters.endDate || ""}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"
          />
        </div>
      </div>
    </>
  );

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          ref={popoverRef}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popoverVariants}
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: position.left,
            right: position.right,
            width: position.width,
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20"
        >
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="space-y-4">
              {isActivityLog
                ? renderActivityLogFilters()
                : renderEmployeeFilters()}
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center rounded-b-lg">
            <button
              onClick={handleClearClick}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
            >
              Clear All
            </button>
            <button
              onClick={handleApplyClick}
              className="px-6 py-2 bg-kredivo-primary text-white font-semibold rounded-md shadow-sm hover:bg-kredivo-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kredivo-primary"
            >
              Apply Filters
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
};
