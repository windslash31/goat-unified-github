// packages/client/src/components/ui/DeviceCardSkeleton.js
import React from "react";

export const DeviceCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-16"></div>
      </div>
      <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-28"></div>
        </div>
      </div>
    </div>
  );
};
