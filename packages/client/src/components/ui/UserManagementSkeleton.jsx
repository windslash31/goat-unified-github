import React from 'react';

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex justify-between items-start">
            <div>
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        </div>
        <div className="mt-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

export const UserManagementSkeleton = () => (
    <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
            <div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-36 mt-4 sm:mt-0"></div>
        </div>
        <div className="mt-4 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    </div>
);