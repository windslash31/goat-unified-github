import React from 'react';
import { MessageSquare, LogIn, LogOut, File } from 'lucide-react';

export const SlackLogPage = ({ logs, loading, error }) => {
    const getEventIcon = (action) => {
        if (action.includes('login')) return <LogIn className="w-5 h-5 text-green-500" />;
        if (action.includes('logout')) return <LogOut className="w-5 h-5 text-red-500" />;
        if (action.includes('file')) return <File className="w-5 h-5 text-blue-500" />;
        return <MessageSquare className="w-5 h-5 text-gray-400" />;
    };

    if (loading) return <div className="text-center p-8">Loading Slack logs...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!logs || logs.length === 0) return <div className="text-center p-8">No Slack audit logs found for this user (Note: Requires Enterprise Grid plan).</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
                <div key={log.id} className="flex flex-col md:flex-row p-4 items-start md:items-center space-y-2 md:space-y-0">
                    <div className="flex items-center gap-3 w-full md:w-1/3">
                        {getEventIcon(log.action)}
                        <span className="font-semibold capitalize">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Entity: {log.entity.type} ({log.entity.user?.name || log.entity.channel?.name || ''})</p>
                    </div>
                    <div className="w-full md:w-auto text-left md:text-right text-sm text-gray-500 dark:text-gray-300">
                        {new Date(log.date_create * 1000).toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
    );
};