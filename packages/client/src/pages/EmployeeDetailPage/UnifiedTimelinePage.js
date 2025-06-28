import React from 'react';
import { Shield, Key, Slack, MessageSquare } from 'lucide-react';

// A helper to determine the icon for each timeline event
const getTimelineIcon = (source) => {
    const baseClass = "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 text-white";
    switch (source) {
        case 'Google':
            return <div className={`${baseClass} bg-red-500`}><Shield size={16}/></div>;
        case 'Slack':
            return <div className={`${baseClass} bg-purple-500`}><Slack size={16}/></div>;
        case 'JumpCloud':
             return <div className={`${baseClass} bg-orange-500`}><Key size={16}/></div>;
        default:
            return <div className={`${baseClass} bg-blue-500`}><MessageSquare size={16}/></div>;
    }
};

export const UnifiedTimelinePage = ({ events, loading, error }) => {
    if (loading) return <div className="text-center p-8">Loading unified timeline...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!events || events.length === 0) return <div className="text-center p-8 text-gray-500">No unified activity found for this user.</div>;

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {events.map((event, eventIdx) => (
                    <li key={event.id}>
                        <div className="relative pb-8">
                            {eventIdx !== events.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>{getTimelineIcon(event.source)}</div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {event.description}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-300">
                                        <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};