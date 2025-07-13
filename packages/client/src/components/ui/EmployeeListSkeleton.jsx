import React from 'react';

const SkeletonRow = () => (
    <div className="flex items-center justify-between p-4 h-[65px] border-b border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-700"></div>
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
            </div>
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
    </div>
);


export const EmployeeListSkeleton = ({ count = 5 }) => {
    return (
        <div>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    );
};