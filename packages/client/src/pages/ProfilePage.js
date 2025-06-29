import React, { useState, useCallback, useEffect } from 'react';
import { UserSquare, LayoutGrid, HardDrive, ChevronDown, Bot, MessageSquare, Shield } from 'lucide-react';
import { EmployeeDetailHeader } from './EmployeeDetailPage/EmployeeDetailHeader';
import { EmployeeDetailsTab } from './EmployeeDetailPage/EmployeeDetailsTab';
import { EmployeeApplicationsTab } from './EmployeeDetailPage/EmployeeApplicationsTab';
import { JumpCloudLogPage } from './EmployeeDetailPage/JumpcloudLogPage';
import { JiraTicketModal } from '../components/ui/JiraTicketModal';
import { WelcomePage } from '../components/ui/WelcomePage';
import { AccessDeniedPage } from '../components/ui/AccessDeniedPage';
import { GoogleLogPage } from './EmployeeDetailPage/GoogleLogPage';
import { SlackLogPage } from './EmployeeDetailPage/SlackLogPage';
import { UnifiedTimelinePage } from './EmployeeDetailPage/UnifiedTimelinePage';


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
    
    const [tabData, setTabData] = useState({
        jumpcloud: { data: null, loading: false, error: null, fetched: false },
        google: { data: null, loading: false, error: null, fetched: false },
        slack: { data: null, loading: false, error: null, fetched: false },
        timeline: { data: null, loading: false, error: null, fetched: false },
    });

    const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const fetchInitialData = useCallback(() => {
        if (!employee) return;
        const token = localStorage.getItem('accessToken');
        if (!token) { onLogout(); return; }

        setIsLoadingPlatforms(true);
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employee.id}/platform-statuses`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : [])
            .then(statusData => setPlatformStatuses(statusData))
            .catch(err => console.error("Failed to fetch platform statuses:", err))
            .finally(() => setIsLoadingPlatforms(false));
    }, [employee, onLogout]);

    useEffect(() => {
        if (employee) {
            fetchInitialData();
        }
    }, [employee, fetchInitialData]);

    const fetchLogData = useCallback((tabKey) => {
        if (!employee || !permissions.includes('log:read:platform') || tabData[tabKey]?.fetched || tabData[tabKey]?.loading) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        const logEndpoints = {
            jumpcloud: `/api/employees/${employee.id}/jumpcloud-logs`,
            google: `/api/employees/${employee.id}/google-logs`,
            slack: `/api/employees/${employee.id}/slack-logs`,
            timeline: `/api/employees/${employee.id}/unified-timeline`,
        };
        
        const url = logEndpoints[tabKey];
        if (!url) return;

        setTabData(prev => ({ ...prev, [tabKey]: { ...prev[tabKey], loading: true } }));

        fetch(`${process.env.REACT_APP_API_BASE_URL}${url}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
            .then(data => {
                setTabData(prev => ({ ...prev, [tabKey]: { data, loading: false, error: null, fetched: true } }));
            })
            .catch(err => {
                setTabData(prev => ({ ...prev, [tabKey]: { data: [], loading: false, error: err.message, fetched: true } }));
            });
    }, [employee, permissions, tabData]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        if (['jumpcloud', 'google', 'slack', 'timeline'].includes(tabId)) {
            fetchLogData(tabId);
        }
    };

    const handleTicketClick = (ticketId) => {
        if (ticketId) {
            setSelectedTicketId(ticketId);
            setIsJiraModalOpen(true);
        }
    };

    const handleScrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Also switch tab for mobile sections
        const tabMap = {
            'profile-jumpcloud-section': 'jumpcloud',
            'profile-google-section': 'google',
            'profile-slack-section': 'slack',
            'profile-timeline-section': 'timeline',
        };
        if(tabMap[sectionId]) {
            handleTabClick(tabMap[sectionId]);
        }
    };

    const pageSections = [
        { id: 'profile-details-section', label: 'Details', icon: <UserSquare className="w-4 h-4"/>, permission: true },
        { id: 'profile-apps-section', label: 'Apps & Platforms', icon: <LayoutGrid className="w-4 h-4"/>, permission: true },
        { id: 'profile-jumpcloud-section', label: 'JumpCloud Log', icon: <HardDrive className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
        { id: 'profile-google-section', label: 'Google Workspace Log', icon: <Shield className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
        { id: 'profile-slack-section', label: 'Slack Log', icon: <MessageSquare className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
        { id: 'profile-timeline-section', label: 'Unified Timeline', icon: <Bot className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
    ].filter(s => s.permission);

    if (!permissions.includes('profile:read:own')) {
        return <AccessDeniedPage />;
    }
    if (!employee) {
        return <WelcomePage user={user} />;
    }

    const TabButton = ({ id, label, icon }) => ( <button onClick={() => handleTabClick(id)} className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${ activeTab === id ? 'border-kredivo-primary text-kredivo-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300' }`}> {icon} {label} </button> );

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
                                onTicketClick={handleTicketClick}
                            />
                        </Section>
                        {permissions.includes('log:read:platform') && (
                            <>
                                <Section id="profile-jumpcloud-section" title="JumpCloud Log" icon={<HardDrive className="w-5 h-5" />}>
                                    <JumpCloudLogPage logs={tabData.jumpcloud.data} loading={tabData.jumpcloud.loading} error={tabData.jumpcloud.error} />
                                </Section>
                                <Section id="profile-google-section" title="Google Workspace Log" icon={<Shield className="w-5 h-5" />}>
                                    <GoogleLogPage logs={tabData.google.data} loading={tabData.google.loading} error={tabData.google.error} />
                                </Section>
                                <Section id="profile-slack-section" title="Slack Log" icon={<MessageSquare className="w-5 h-5" />}>
                                    <SlackLogPage logs={tabData.slack.data} loading={tabData.slack.loading} error={tabData.slack.error} />
                                </Section>
                                <Section id="profile-timeline-section" title="Unified Timeline" icon={<Bot className="w-5 h-5" />}>
                                    <UnifiedTimelinePage events={tabData.timeline.data} loading={tabData.timeline.loading} error={tabData.timeline.error} />
                                </Section>
                            </>
                        )}
                    </div>

                    <div className="hidden md:block">
                        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            <nav className="-mb-px flex space-x-4">
                                <TabButton id="details" label="Details" icon={<UserSquare className="w-4 h-4"/>}/>
                                <TabButton id="platforms" label="Apps & Platforms" icon={<LayoutGrid className="w-4 h-4"/>}/>
                                
                                {permissions.includes('log:read:platform') && (
                                    <>
                                        <TabButton id="jumpcloud" label="JumpCloud Log" icon={<HardDrive className="w-4 h-4"/>}/>
                                        <TabButton id="google" label="Google Workspace" icon={<Shield className="w-4 h-4"/>}/>
                                        <TabButton id="slack" label="Slack" icon={<MessageSquare className="w-4 h-4"/>}/>
                                        <TabButton id="timeline" label="Unified Timeline" icon={<Bot className="w-4 h-4"/>}/>
                                    </>
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
                                    onTicketClick={handleTicketClick}
                                />
                            </div>
                            {permissions.includes('log:read:platform') && (
                                <>
                                    <div style={{ display: activeTab === 'jumpcloud' ? 'block' : 'none' }}>
                                        <JumpCloudLogPage logs={tabData.jumpcloud.data} loading={tabData.jumpcloud.loading} error={tabData.jumpcloud.error} />
                                    </div>
                                    <div style={{ display: activeTab === 'google' ? 'block' : 'none' }}>
                                        <GoogleLogPage logs={tabData.google.data} loading={tabData.google.loading} error={tabData.google.error} />
                                    </div>
                                    <div style={{ display: activeTab === 'slack' ? 'block' : 'none' }}>
                                        <SlackLogPage logs={tabData.slack.data} loading={tabData.slack.loading} error={tabData.slack.error} />
                                    </div>
                                    <div style={{ display: activeTab === 'timeline' ? 'block' : 'none' }}>
                                        <UnifiedTimelinePage events={tabData.timeline.data} loading={tabData.timeline.loading} error={tabData.timeline.error} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isJiraModalOpen && <JiraTicketModal ticketId={selectedTicketId} onClose={() => setIsJiraModalOpen(false)} />}
        </>
    );
};