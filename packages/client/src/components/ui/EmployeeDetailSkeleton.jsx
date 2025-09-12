import React from "react";

const SkeletonBlock = ({ className }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
);

export const EmployeeDetailSkeleton = () => {
  return (
    <div className="p-4 sm:p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center">
          <SkeletonBlock className="w-16 h-16 rounded-full" />
          <div className="ml-4 space-y-2">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-64" />
            <SkeletonBlock className="h-6 w-20 mt-1" />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <SkeletonBlock className="h-10 w-28" />
          <SkeletonBlock className="h-10 w-40" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <SkeletonBlock className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <SkeletonBlock className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-4/5" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <SkeletonBlock className="h-5 w-24 mb-4" />
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <SkeletonBlock className="h-5 w-36 mb-4" />
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
