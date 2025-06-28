import React, { useState, useCallback, useEffect } from 'react';
import { UserSquare, LayoutGrid, HardDrive, ChevronDown } from 'lucide-react';
import { EmployeeDetailHeader } from './EmployeeDetailPage/EmployeeDetailHeader';
import { EmployeeDetailsTab } from './EmployeeDetailPage/EmployeeDetailsTab';
import { EmployeeApplicationsTab } from './EmployeeDetailPage/EmployeeApplicationsTab';
import { JumpCloudLogPage } from './EmployeeDetailPage/JumpcloudLogPage';
import { JiraTicketModal } from '../components/ui/JiraTicketModal';
import { WelcomePage } from '../components/ui/WelcomePage';
import { AccessDeniedPage } from '../components/ui/AccessDeniedPage';

const Section = ({ id, title, children, icon }) => (
    <div id={id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 scroll-mt-24">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            {icon}
            {title}
        </h3>
        <div className="p-4 sm:p-6">
            {children}
        </div>
    </div>
);

const InPageDropdownNav = ({ sections, onScrollTo }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleSelect = (sectionId) => {
        onScrollTo(sectionId);
        setIsOpen(false);
    };
    return (
        <div className="md:hidden relative px-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium"
            >
                <span>Jump to section...</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sections.map(section => (
                            <li key={section.id}>
                                <button
                                    onClick={() => handleSelect(section.id)}
                                    className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {section.icon}
                                    {section.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const ProfilePage = ({ employee, permissions, onEdit, onDeactivate, onLogout, user }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [platformStatuses, setPlatformStatuses] = useState([]);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
    const [tabData, setTabData] = useState({ jumpcloud: { data: null, loading: false, error: null } });
    
    // State for managing the Jira Ticket Modal
    const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const fetchSecondaryData = useCallback(() => {
        if (!employee) return;
        const token = localStorage.getItem('accessToken');
        if (!token) {
            onLogout();
            return;
        }

        setIsLoadingPlatforms(true);
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employee.id}/platform-statuses`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : [])
            .then(statusData => setPlatformStatuses(statusData))
            .catch(err => console.error("Failed to fetch platform statuses:", err))
            .finally(() => setIsLoadingPlatforms(false));

        if (permissions.includes('log:read:platform')) {
            setTabData(prev => ({ ...prev, jumpcloud: { ...prev.jumpcloud, loading: true, error: null } }));
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employee.id}/jumpcloud-logs`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => {
                    if (res.ok) {
                        return res.json().then(jcData => {
                            setTabData(prev => ({ ...prev, jumpcloud: { data: jcData, loading: false, error: null } }));
                        });
                    }
                    return res.json().then(errData => {
                        const errorMessage = errData.message || 'User not found or failed to fetch logs.';
                        console.warn(`Could not fetch JumpCloud logs: ${errorMessage}`);
                        setTabData(prev => ({ ...prev, jumpcloud: { data: [], loading: false, error: errorMessage } }));
                    });
                })
                .catch(err => {
                    console.error("Failed to fetch JumpCloud logs:", err);
                    setTabData(prev => ({ ...prev, jumpcloud: { data: [], loading: false, error: err.message } }));
                });
        }
    }, [employee, onLogout, permissions]);

    useEffect(() => {
        if (employee) {
            fetchSecondaryData();
        }
    }, [employee, fetchSecondaryData]);

    // Handler to open the Jira modal
    const handleTicketClick = (ticketId) => {
        if (ticketId) {
            setSelectedTicketId(ticketId);
            setIsJiraModalOpen(true);
        }
    };

    const handleScrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const pageSections = [
        { id: 'profile-details-section', label: 'Details', icon: <UserSquare className="w-4 h-4"/>, permission: true },
        { id: 'profile-apps-section', label: 'Apps & Platforms', icon: <LayoutGrid className="w-4 h-4"/>, permission: true },
        { id: 'profile-jumpcloud-section', label: 'JumpCloud Log', icon: <HardDrive className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') }
    ].filter(s => s.permission);

    if (!permissions.includes('profile:read:own')) {
        return <AccessDeniedPage />;
    }
    if (!employee) {
        return <WelcomePage user={user} />;
    }

    const TabButton = ({ id, label, icon }) => ( <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${ activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300' }`}> {icon} {label} </button> );

    return (
        <>
            <div>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">This is your personal employee record and application access list.</p>
                </div>
                <div className="p-4 sm:p-6 space-y-6">
                    <EmployeeDetailHeader
                        employee={employee}
                        onEdit={onEdit}
                        onDeactivate={onDeactivate}
                        permissions={permissions}
                        isOwnProfile={true}
                    />
                    
                    <InPageDropdownNav sections={pageSections} onScrollTo={handleScrollToSection} />

                    <div className="space-y-6 md:hidden">
                        <Section id="profile-details-section" title="Details" icon={<UserSquare className="w-5 h-5" />}>
                            <EmployeeDetailsTab employee={employee} permissions={permissions} onTicketClick={handleTicketClick} />
                        </Section>
                        <Section id="profile-apps-section" title="Apps & Platforms" icon={<LayoutGrid className="w-5 h-5" />}>
                            <EmployeeApplicationsTab
                                applications={employee.applications || []}
                                platformStatuses={platformStatuses}
                                isLoading={isLoadingPlatforms}
                                permissions={permissions}
                            />
                        </Section>
                        {permissions.includes('log:read:platform') && (
                            <Section id="profile-jumpcloud-section" title="JumpCloud Log" icon={<HardDrive className="w-5 h-5" />}>
                                <JumpCloudLogPage logs={tabData.jumpcloud.data || []} loading={tabData.jumpcloud.loading} error={tabData.jumpcloud.error} />
                            </Section>
                        )}
                    </div>

                    <div className="hidden md:block">
                        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            <nav className="-mb-px flex space-x-4">
                                <TabButton id="details" label="Details" icon={<UserSquare className="w-4 h-4"/>}/>
                                <TabButton id="platforms" label="Apps & Platforms" icon={<LayoutGrid className="w-4 h-4"/>}/>
                                
                                {permissions.includes('log:read:platform') && (
                                    <TabButton id="jumpcloud" label="JumpCloud Log" icon={<HardDrive className="w-4 h-4"/>}/>
                                )}
                            </nav>
                        </div>

                        <div className="mt-6">
                            <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
                                <EmployeeDetailsTab employee={employee} permissions={permissions} onTicketClick={handleTicketClick} />
                            </div>
                            <div style={{ display: activeTab === 'platforms' ? 'block' : 'none' }}>
                                <EmployeeApplicationsTab
                                    applications={employee.applications || []}
                                    platformStatuses={platformStatuses}
                                    isLoading={isLoadingPlatforms}
                                    permissions={permissions}
                                />
                            </div>
                            {permissions.includes('log:read:platform') && (
                                <div style={{ display: activeTab === 'jumpcloud' ? 'block' : 'none' }}>
                                    <JumpCloudLogPage logs={tabData.jumpcloud.data || []} loading={tabData.jumpcloud.loading} error={tabData.jumpcloud.error} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isJiraModalOpen && <JiraTicketModal ticketId={selectedTicketId} onClose={() => setIsJiraModalOpen(false)} />}
        </>
    );
};