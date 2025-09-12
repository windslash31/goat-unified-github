import React from "react";

const SkeletonBlock = ({ className }) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 rounded ${className} animate-pulse`}
  ></div>
);

export const ApplicationManagementSkeleton = () => (
  <div className="p-6">
    <div className="mb-6">
      <SkeletonBlock className="h-8 w-1/3 mb-2" />
      <SkeletonBlock className="h-4 w-1/2" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <SkeletonBlock className="h-6 w-1/2 mb-3" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 flex-grow" />
          <SkeletonBlock className="h-10 w-24" />
        </div>
      </div>
      <div>
        <SkeletonBlock className="h-6 w-1/2 mb-3" />
        <div className="space-y-2">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      </div>
    </div>
  </div>
);
