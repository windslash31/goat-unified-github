import React from 'react';

export const StatusQuickFilters = ({ currentStatus, onStatusChange }) => {
    const statuses = ['all', 'active', 'escalation', 'inactive'];
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {statuses.map(status => (
                <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={`px-4 py-3 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap ${
                        currentStatus === status
                        ? 'border-kredivo-primary text-kredivo-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    {capitalize(status).replace('_', ' ')}
                </button>
            ))}
        </div>
    );
};