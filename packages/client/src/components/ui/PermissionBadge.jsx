import React from "react";

export const PermissionBadge = ({ level }) => {
  if (!level) return null;
  const lowerLevel = level.toLowerCase();

  let colorClasses =
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"; // Default
  if (lowerLevel.includes("admin"))
    colorClasses =
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
  else if (
    lowerLevel.includes("write") ||
    lowerLevel.includes("create") ||
    lowerLevel.includes("member")
  )
    colorClasses =
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
  else if (lowerLevel.includes("read") || lowerLevel.includes("user"))
    colorClasses =
      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";

  return (
    <span
      className={`text-xs font-medium capitalize px-2 py-1 rounded-full whitespace-nowrap ${colorClasses}`}
    >
      {level.replace(/_/g, " ")}
    </span>
  );
};
