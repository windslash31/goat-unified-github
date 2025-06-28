import React, { memo } from 'react';
import { ArrowRight, UserCheck, UserX, KeyRound, FileLock, Shield, MapPin, Monitor, Database, Server } from 'lucide-react';

export const JumpCloudLogPage = memo(({ logs, loading, error }) => {
    const getEventIcon = (eventType, success) => {
        const baseClass = "w-6 h-6 flex-shrink-0";
        switch (eventType) {
            case 'login_attempt':
                return success ? <ArrowRight className={`${baseClass} text-green-500`} /> : <ArrowRight className={`${baseClass} text-red-500`} />;
            case 'sso_login':
                return <ArrowRight className={`${baseClass} text-blue-500`} />;
            case 'user_create':
                return <UserCheck className={`${baseClass} text-green-500`} />;
            case 'user_delete':
                return <UserX className={`${baseClass} text-red-500`} />;
            case 'password_change':
                return <KeyRound className={`${baseClass} text-yellow-500`} />;
            case 'directory_object_modify':
                return <FileLock className={`${baseClass} text-orange-500`} />;
            case 'ldap_bind':
                return <Database className={`${baseClass} text-indigo-500`} />;
            default:
                return <Shield className={`${baseClass} text-gray-400`} />;
        }
    };

    const formatEventDetails = (log) => {
        if (log.event_type === 'login_attempt') {
            return (
                <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{log.system?.displayName || 'Unknown'}</span>
                    </div>
                    {log.geoip?.country_code && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{log.geoip.region_name}, {log.geoip.country_code}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                        <Server className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{log.client_ip || 'N/A'}</span>
                    </div>
                </div>
            );
        }
        if (log.event_type === 'ldap_bind') {
            return (
                 <div className="flex flex-col gap-1 text-sm">
                    <span>Auth: <span className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded-md text-xs">{log.auth_method}</span></span>
                     <span className="truncate">Conn ID: {log.connection_id || 'N/A'}</span>
                </div>
            );
        }
        return <p className="text-sm text-gray-600 dark:text-gray-400">{log.message || 'No additional details.'}</p>;
    };

    if (loading) return <div className="text-center p-8">Loading JumpCloud logs...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!logs || logs.length === 0) return <div className="text-center p-8">No JumpCloud logs found for this user in the last 90 days.</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="hidden md:flex px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="w-1/4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</div>
                <div className="w-2/4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</div>
                <div className="w-1/4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map(log => (
                    <div key={log.id} className="flex flex-col md:flex-row px-4 md:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        
                        <div className="flex md:hidden items-start gap-4">
                            <div className="flex flex-col items-center gap-1 w-20 text-center">
                                {getEventIcon(log.event_type, log.success)}
                                <p className="font-semibold text-sm capitalize">{log.event_type.replace(/_/g, ' ')}</p>
                                <p className={`text-xs font-bold ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                                    {log.success ? 'Success' : 'Failed'}
                                </p>
                            </div>

                            <div className="flex-1 flex justify-between items-start">
                                {formatEventDetails(log)}
                                <p className="text-xs text-right text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                    {new Date(log.timestamp).toLocaleDateString()}<br/>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>


                        <div className="hidden md:w-1/4 md:pr-4 md:flex items-center">
                            <div className="flex items-center gap-3">
                                {getEventIcon(log.event_type, log.success)}
                                <div>
                                    <div className="font-medium text-sm text-gray-800 dark:text-gray-200 capitalize">
                                        {log.event_type.replace(/_/g, ' ')}
                                    </div>
                                    <div className={`text-xs ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.success ? 'Success' : 'Failed'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:w-2/4 md:pr-4 md:flex md:items-center text-sm text-gray-600 dark:text-gray-300">
                            {formatEventDetails(log)}
                        </div>
                        <div className="hidden md:w-1/4 md:flex md:items-center text-sm text-gray-800 dark:text-gray-200">
                            {new Date(log.timestamp).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});