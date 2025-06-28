import React from 'react';
import { Shield, Server } from 'lucide-react';

export const GoogleLogPage = ({ logs, loading, error }) => {
    const getEventIcon = (eventName) => {
        if (eventName.includes('login_success')) return <Shield className="w-5 h-5 text-green-500" />;
        if (eventName.includes('login_failure')) return <Shield className="w-5 h-5 text-red-500" />;
        return <Shield className="w-5 h-5 text-gray-400" />;
    };

    if (loading) return <div className="text-center p-8">Loading Google Workspace logs...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!logs || logs.length === 0) return <div className="text-center p-8 text-gray-500">No Google Workspace login logs found for this user in the last 30 days.</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
                <div key={log.id.uniqueQualifier} className="flex flex-col md:flex-row p-4 items-start md:items-center space-y-2 md:space-y-0">
                    <div className="flex items-center gap-3 w-full md:w-1/3">
                        {getEventIcon(log.events[0].name)}
                        <span className="font-semibold capitalize">{log.events[0].name.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-2"><Server className="w-4 h-4" /> IP Address: {log.ipAddress || 'N/A'}</p>
                    </div>
                    <div className="w-full md:w-auto text-left md:text-right text-sm text-gray-500 dark:text-gray-300">
                        {new Date(log.id.time).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
};