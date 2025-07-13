import React from 'react';

const SkeletonBlock = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded ${className} animate-pulse`}></div>
);

export const RoleManagementSkeleton = () => (
    <div className="p-6">
        <div className="mb-6">
            <SkeletonBlock className="h-8 w-1/3 mb-2" />
            <SkeletonBlock className="h-4 w-1/2" />
        </div>
        <div className="md:flex md:gap-6">
            <div className="md:w-1/3 lg:w-1/4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <SkeletonBlock className="h-6 w-24 mb-4" />
                    <div className="space-y-2">
                        <SkeletonBlock className="h-8 w-full" />
                        <SkeletonBlock className="h-8 w-full" />
                        <SkeletonBlock className="h-8 w-full" />
                    </div>
                </div>
            </div>
            <div className="flex-1 mt-6 md:mt-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <SkeletonBlock className="h-7 w-1/2 mb-6" />
                    <div className="space-y-6">
                        <div>
                            <SkeletonBlock className="h-5 w-1/4 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SkeletonBlock className="h-10 w-full" />
                                <SkeletonBlock className="h-10 w-full" />
                                <SkeletonBlock className="h-10 w-full" />
                            </div>
                        </div>
                        <div>
                            <SkeletonBlock className="h-5 w-1/3 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SkeletonBlock className="h-10 w-full" />
                                <SkeletonBlock className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);