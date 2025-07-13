import React from 'react';

const SkeletonBlock = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className} animate-pulse`}></div>
);

const SettingsCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
            <SkeletonBlock className="w-12 h-12 rounded-lg mr-4" />
            <div>
                <SkeletonBlock className="h-5 w-32 mb-2" />
                <SkeletonBlock className="h-4 w-48" />
            </div>
        </div>
        <SkeletonBlock className="w-5 h-5 rounded-full" />
    </div>
);


export const SettingsSkeleton = () => {
    return (
        <div className="p-6 animate-pulse">
            <div className="mb-6">
                <SkeletonBlock className="h-8 w-1/3 mb-2" />
                <SkeletonBlock className="h-4 w-1/2" />
            </div>
            <div className="max-w-2xl mx-auto space-y-4">
                <SettingsCardSkeleton />
                <SettingsCardSkeleton />
                <SettingsCardSkeleton />
            </div>
        </div>
    );
};