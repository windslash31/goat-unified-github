import React from "react";

export const DetailItem = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <dt className="text-sm text-gray-500 dark:text-gray-400 w-1/3 pr-2">
      {label}
    </dt>
    <dd className="text-sm text-right font-medium w-2/3">{value}</dd>
  </div>
);
