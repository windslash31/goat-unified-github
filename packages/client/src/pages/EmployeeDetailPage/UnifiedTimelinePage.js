import React from 'react';

const TimelineItem = ({ title, description, date }) => {
    return (
        <div className="group relative py-6 pl-8 sm:pl-32">
            <div className="mb-1 flex flex-col items-start before:absolute before:left-2 before:h-full before:-translate-x-1/2 before:translate-y-3 before:self-start before:bg-slate-300 dark:before:bg-gray-700 before:px-px group-last:before:hidden sm:flex-row sm:before:left-0 sm:before:ml-[6.5rem] sm:after:left-0 sm:after:ml-[6.5rem] after:absolute after:left-2 after:box-content after:h-2 after:w-2 after:-translate-x-1/2 after:translate-y-1.5 after:rounded-full after:border-4 after:border-white dark:after:border-gray-800 after:bg-kredivo-primary">
                <time className="left-0 mb-3 inline-flex h-6 w-28 translate-y-0.5 items-center justify-center rounded-full bg-kredivo-light text-xs font-semibold uppercase text-kredivo-dark-text sm:absolute sm:mb-0">
                    {date}
                </time>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{title}</div>
            </div>
            <div className="text-slate-500 dark:text-gray-400">{description}</div>
        </div>
    );
};

export const UnifiedTimelinePage = ({ events, loading, error }) => {
    if (loading) return <div className="text-center p-8">Loading unified timeline...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    if (!events || events.length === 0) return <div className="text-center p-8 text-gray-500">No unified activity found for this user.</div>;

    const formatTimelineDate = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="flow-root">
            {events.map(event => (
                <TimelineItem
                    key={event.id}
                    title={`Access Granted: ${event.source}`}
                    description={event.description}
                    date={formatTimelineDate(event.timestamp)}
                />
            ))}
        </div>
    );
};