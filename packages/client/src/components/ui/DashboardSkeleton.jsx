import React from 'react';

const SkeletonBlock = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className} animate-pulse`}></div>
);

const StatCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <SkeletonBlock className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
            <SkeletonBlock className="h-4 w-3/4 mb-2" />
            <SkeletonBlock className="h-8 w-1/2" />
        </div>
    </div>
);

export const DashboardSkeleton = () => (
    <div className="p-4 sm:p-6">
        <SkeletonBlock className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <SkeletonBlock className="h-6 w-1/3 mb-6" />
                <div className="space-y-4">
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                    <SkeletonBlock className="h-10 w-full" />
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <SkeletonBlock className="h-6 w-1/2 mb-6" />
                <div className="space-y-4">
                    <SkeletonBlock className="h-8 w-full" />
                    <SkeletonBlock className="h-8 w-full" />
                    <SkeletonBlock className="h-8 w-full" />
                </div>
            </div>
        </div>
    </div>
);