import React from 'react';

const SkeletonBlock = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className} animate-pulse`}></div>
);

const LogItemSkeleton = () => (
    <div className="p-4">
        <div className="flex items-start gap-4">
            <SkeletonBlock className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                    <SkeletonBlock className="h-5 w-1/3" />
                    <SkeletonBlock className="h-5 w-5" />
                </div>
                <SkeletonBlock className="h-4 w-2/3 mt-2" />
                <SkeletonBlock className="h-3 w-1/2 mt-2" />
            </div>
        </div>
    </div>
);

export const ActivityLogSkeleton = () => (
    <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <div>
                <SkeletonBlock className="h-8 w-48 mb-2" />
                <SkeletonBlock className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <SkeletonBlock className="h-10 w-24" />
                <SkeletonBlock className="h-10 w-28" />
            </div>
        </div>
        <SkeletonBlock className="h-8 w-full mb-4" />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <LogItemSkeleton />
            <LogItemSkeleton />
            <LogItemSkeleton />
            <LogItemSkeleton />
        </div>
    </div>
);