import React from "react";

const DetailRowComponent = ({ icon, label, value }) => {
  return (
    <div className="flex items-start justify-between py-2.5 text-sm border-b border-gray-200 dark:border-gray-700/50 last:border-b-0">
      <span className="flex items-center text-gray-600 dark:text-gray-400 font-medium">
        {icon}
        {label}
      </span>
      <div className="text-gray-800 dark:text-gray-200 text-right">
        {value || "—"}
      </div>
    </div>
  );
};

export const DetailRow = React.memo(DetailRowComponent);