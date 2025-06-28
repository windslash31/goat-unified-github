import React, { memo } from 'react';
import { Ticket } from 'lucide-react';

const PlatformStatusBadge = ({ status }) => {
    const styles = {
        'Active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'Suspended': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'Not Found': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'Error': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || styles['Error']}`}>
            {status}
        </span>
    );
};

const PlatformRowSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-md bg-gray-300 dark:bg-gray-700"></div>
            <div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32 mt-1"></div>
            </div>
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
    </div>
);

export const EmployeeApplicationsTab = memo(({ applications, platformStatuses, isLoading }) => {
    
    const platformLogos = {
        'Google Workspace': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Google_Workspace_Logo.png',
        'Slack': 'https://a.slack-edge.com/80588/img/slack_api_logo.png',
        'JumpCloud': 'https://www.jumpcloud.com/wp-content/uploads/2021/08/cropped-favicon-32x32.png',
        'Atlassian': 'https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon-32x32.png'
    };

    return (
        <div className="space-y-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Platform Access Status</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Live status of the employee's account on integrated external platforms.</p>
                <div className="space-y-4">
                    {isLoading ? (
                        <>
                            <PlatformRowSkeleton />
                            <PlatformRowSkeleton />
                            <PlatformRowSkeleton />
                        </>
                    ) : (
                        platformStatuses.map(platform => (
                            <div key={platform.platform} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex items-center gap-4">
                                    <img src={platformLogos[platform.platform] || ''} alt={`${platform.platform} Logo`} className="w-8 h-8"/>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{platform.platform}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{platform.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <PlatformStatusBadge status={platform.status} />
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Internal Application Access</h3>
                 {(!applications || applications.length === 0) ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">No internal application access records found.</div>
                 ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Application</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Request Ticket</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {applications.map(app => (
                                    <tr key={app.name}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{app.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{app.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline">
                                            {app.jira_ticket ? (
                                                <a href={`${process.env.REACT_APP_JIRA_BASE_URL}${app.jira_ticket}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4"/>
                                                    {app.jira_ticket}
                                                </a>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 )}
            </div>
        </div>
    );
});