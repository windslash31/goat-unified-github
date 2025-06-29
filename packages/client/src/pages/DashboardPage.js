import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { Users, UserCheck, UserX, AlertTriangle, Activity, Ticket } from 'lucide-react';

const fetchDashboardData = async () => {
    const { data } = await api.get('/api/dashboard');
    return data;
};

const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

export const DashboardPage = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboardData'],
        queryFn: fetchDashboardData
    });

    if (isLoading) return <div className="p-6 text-center">Loading dashboard...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Could not load dashboard data.</div>;

    const { stats, recentActivity, recentTickets } = data;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Employees" value={stats.total_employees} icon={<Users className="text-white" />} color="bg-blue-500" />
                <StatCard title="Active" value={stats.active_employees} icon={<UserCheck className="text-white" />} color="bg-green-500" />
                <StatCard title="For Escalation" value={stats.for_escalation_employees} icon={<AlertTriangle className="text-white" />} color="bg-yellow-500" />
                <StatCard title="Inactive" value={stats.inactive_employees} icon={<UserX className="text-white" />} color="bg-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity /> Recent Activity</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                        {recentActivity.map(log => (
                            <div key={log.id} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm">{log.action_type.replace(/_/g, ' ')} by <span className="font-semibold">{log.actor_email || 'System'}</span></p>
                                    <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Ticket /> Recent Tickets</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                        {recentTickets.map(ticket => (
                            <div key={`${ticket.ticket_type}-${ticket.id}`} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm"><span className={`font-semibold ${ticket.ticket_type === 'Onboarding' ? 'text-green-500' : 'text-red-500'}`}>{ticket.ticket_type}:</span> {ticket.first_name} {ticket.last_name}</p>
                                    <p className="text-xs text-gray-500">{ticket.ticket_id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};