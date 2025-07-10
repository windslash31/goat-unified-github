import React from "react";
import { X } from "lucide-react";

export const FilterPills = ({
  filters,
  setFilters,
  setSearchInputValue,
  options,
  onClear,
  isActivityLog = false,
}) => {
  const removeFilter = (key) => {
    if (key === "search") setSearchInputValue("");
    const newFilters = { ...filters, [key]: "" };
    if (key === "status") newFilters.status = "all";
    setFilters(newFilters);
  };

  const filterLabels = isActivityLog
    ? {
        actionType: "Action",
        actorEmail: "Actor",
        startDate: "Start Date",
        endDate: "End Date",
      }
    : {
        jobTitle: "Job Title",
        manager: "Manager",
        legal_entity_id: "Legal Entity",
        office_location_id: "Office",
        employee_type_id: "Type",
        employee_sub_type_id: "Sub-Type",
        application_id: "Application",
      };

  const optionsMap = isActivityLog
    ? {
        actionType: options.actionTypes,
        actorEmail: options.actors,
      }
    : {
        legal_entity_id: options.legalEntities,
        office_location_id: options.officeLocations,
        employee_type_id: options.employeeTypes,
        employee_sub_type_id: options.employeeSubTypes,
        application_id: options.applications,
      };

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && value !== "all" && key !== "search")
    .map(([key, value]) => {
      let displayValue = value;
      if (optionsMap[key]) {
        const foundOption = optionsMap[key]?.find(
          (opt) => String(opt.id) === String(value)
        );
        if (foundOption) displayValue = foundOption.name;
      }
      return { key, label: filterLabels[key] || key, value: displayValue };
    });

  if (activeFilters.length === 0) return <div className="h-8"></div>;

  return (
    <div className="flex items-center gap-2 h-auto flex-wrap py-2">
      <span className="text-sm font-medium">Active Filters:</span>
      {activeFilters.map(({ key, label, value }) => (
        <span
          key={key}
          className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-kredivo-light text-kredivo-dark-text dark:bg-kredivo-primary/20 dark:text-kredivo-light"
        >
          {label}: {String(value).substring(0, 20)}
          <button
            onClick={() => removeFilter(key)}
            className="ml-1 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-kredivo-primary hover:bg-kredivo-primary/20 dark:text-kredivo-light dark:hover:bg-kredivo-primary/40"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-sm font-medium text-kredivo-primary hover:underline"
      >
        Clear All
      </button>
    </div>
  );
};
