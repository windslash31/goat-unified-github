import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { UserSquare, UserCog, ChevronsUp, Building2, Layers, MapPin, Hash, Calendar, Ticket } from 'lucide-react';
import { DetailRow } from '../../components/ui/DetailRow';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const EmployeeDetailsTab = memo(({ employee, permissions, navigate, onTicketClick }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const JiraTicketLink = ({ ticketId }) => {
        if (!ticketId) return '—';
        // This is now a button that calls the handler passed down from the parent
        return (
            <button onClick={() => onTicketClick(ticketId)} className="text-blue-500 hover:underline font-mono flex items-center gap-1 text-right">
                <Ticket className="w-4 h-4"/>
                {ticketId}
            </button>
        );
    };

    const ManagerLink = ({ managerId, managerName, managerEmail }) => {
        if (!managerId) return '—';
        
        // This logic allows navigating to the manager's profile if the user has permission
        if (permissions.includes('employee:read:all')) {
            return (
                <Link 
                    to={`/employees/${managerId}`}
                    className="text-blue-500 hover:underline text-right"
                >
                    <div>{managerName}</div>
                    <div className="text-xs text-gray-400">{managerEmail}</div>
                </Link>
            );
        }
        
        return (
            <div className="text-right">
                <div>{managerName}</div>
                <div className="text-xs text-gray-400">{managerEmail}</div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Identity & Role</h4>
                    <DetailRow icon={<UserSquare className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Email" value={employee.employee_email} />
                    <DetailRow 
                        icon={<UserCog className="w-4 h-4 mr-2.5 text-gray-400"/>} 
                        label="Manager" 
                        value={<ManagerLink managerId={employee.manager_id} managerName={employee.manager_name} managerEmail={employee.manager_email} />} 
                    />
                    <DetailRow icon={<ChevronsUp className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Position Level" value={employee.position_level} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Employment Details</h4>
                    <DetailRow icon={<Layers className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Employment Status" value={<StatusBadge status={employee.status} />} />
                    <DetailRow icon={<Building2 className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Legal Entity" value={employee.legal_entity} />
                    <DetailRow icon={<Layers className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Employee Type" value={employee.employee_type && employee.employee_sub_type ? `${employee.employee_type} (${employee.employee_sub_type})` : (employee.employee_type || '—')} />
                    <DetailRow icon={<MapPin className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Office Location" value={employee.office_location} />
                    <DetailRow icon={<Hash className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Asset" value={employee.asset_name} />
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Timeline</h4>
                    <DetailRow icon={<Calendar className="w-4 h-4 mr-2.5 text-green-500"/>} label="Join Date" value={formatDate(employee.join_date)} />
                    <DetailRow icon={<Calendar className="w-4 h-4 mr-2.5 text-red-500"/>} label="Exit Date" value={formatDate(employee.date_of_exit_at_date)} />
                    <DetailRow icon={<Calendar className="w-4 h-4 mr-2.5 text-red-500"/>} label="Access Cut-off" value={formatDate(employee.access_cut_off_date_at_date)} />
                    <DetailRow icon={<Calendar className="w-4 h-4 mr-2.5 text-gray-400"/>} label="Record Created" value={formatDate(employee.created_at)} />
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Related Tickets</h4>
                    <DetailRow 
                        icon={<Ticket className="w-4 h-4 mr-2.5 text-blue-500"/>} 
                        label="Onboarding Ticket" 
                        value={<JiraTicketLink ticketId={employee.onboarding_ticket} />} 
                    />
                    <DetailRow 
                        icon={<Ticket className="w-4 h-4 mr-2.5 text-blue-500"/>} 
                        label="Offboarding Ticket" 
                        value={<JiraTicketLink ticketId={employee.offboarding_ticket} />} 
                    />
                </div>
            </div>
        </div>
    );
});