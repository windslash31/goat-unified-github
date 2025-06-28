import React from 'react';
import { Edit, User, Info } from 'lucide-react';

export const AtlassianLogPage = ({ logs, loading, error }) => {
    const getEventIcon = (category) => {
        if (category.includes('user management')) return <User className="w-5 h-5 text-blue-500" />;
        if (category.includes('permission')) return <Edit className="w-5 h-5 text-yellow-500" />;
        return <Info className="w-5 h-5 text-gray-400" />;
    };

    if (loading) return <div className="text-center p-8">Loading Atlassian logs...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!logs || logs.length === 0) return <div className="text-center p-8">No Atlassian audit logs found for this user.</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
                <div key={log.id} className="flex flex-col md:flex-row p-4 items-start md:items-center space-y-2 md:space-y-0">
                    <div className="flex items-center gap-3 w-full md:w-1/3">
                        {getEventIcon(log.category)}
                        <span className="font-semibold capitalize">{log.category}</span>
                    </div>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                        {log.summary}
                    </div>
                    <div className="w-full md:w-auto text-left md:text-right text-sm text-gray-500 dark:text-gray-300">
                        {new Date(log.created).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
};