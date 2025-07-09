import React from "react";

const StatusBadgeComponent = ({ status }) => {
  // This function determines the Tailwind CSS classes based on the status string.
  const getStatusStyles = () => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "For Escalation":
        // Using a distinct style for "For Escalation" status.
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        // A default style for any unexpected status values.
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
};

export const StatusBadge = React.memo(StatusBadgeComponent);
