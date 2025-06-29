import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserSquare, LayoutGrid, HardDrive, AlertTriangle, ChevronDown, Bot, MessageSquare, Shield } from 'lucide-react';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { EmployeeDetailHeader } from './EmployeeDetailHeader';
import { EmployeeDetailsTab } from './EmployeeDetailsTab';
import { EmployeeApplicationsTab } from './EmployeeApplicationsTab';
import { JumpCloudLogPage } from './JumpcloudLogPage';
import { JiraTicketModal } from '../../components/ui/JiraTicketModal';
import { GoogleLogPage } from './GoogleLogPage';
import { SlackLogPage } from './SlackLogPage';
import { UnifiedTimelinePage } from './UnifiedTimelinePage';

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

export const EmployeeDetailPage = ({ onEdit, onDeactivate, permissions, onLogout }) => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const { setDynamicCrumbs } = useBreadcrumb();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [platformStatuses, setPlatformStatuses] = useState([]);
    const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
    
    const [tabData, setTabData] = useState({
        jumpcloud: { data: [], loading: false, error: null, fetched: false },
        google: { data: [], loading: false, error: null, fetched: false },
        slack: { data: [], loading: false, error: null, fetched: false },
        timeline: { data: [], loading: false, error: null, fetched: false },
    });

    const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const fetchInitialData = useCallback(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) { onLogout(); return; }

        setLoading(true);
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employeeId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => {
                if (res.status === 404) throw new Error('Employee not found.');
                if (!res.ok) throw new Error('Failed to fetch employee profile.');
                return res.json();
            })
            .then(empData => {
                setEmployee(empData);
                const fullName = [empData.first_name, empData.middle_name, empData.last_name].filter(Boolean).join(' ');
                setDynamicCrumbs([{ name: "Employees", path: "/employees" }, { name: fullName, path: `/employees/${employeeId}` }]);
            })
            .catch(err => {
                console.error("Error fetching main employee data:", err);
                setPageError(err.message);
            })
            .finally(() => setLoading(false));

        setIsLoadingPlatforms(true);
        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/${employeeId}/platform-statuses`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : [])
            .then(statusData => setPlatformStatuses(statusData))
            .catch(err => console.error("Failed to fetch platform statuses:", err))
            .finally(() => setIsLoadingPlatforms(false));

    }, [employeeId, onLogout, setDynamicCrumbs]);

    useEffect(() => {
        fetchInitialData();

        const token = localStorage.getItem('accessToken');
        if (token && employeeId) {
            fetch(`${process.env.REACT_APP_API_BASE_URL}/api/employees/logs/view`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetEmployeeId: employeeId })
            }).catch(err => console.error("Failed to log profile view:", err));
        }
        
        return () => {
            setDynamicCrumbs([]);
        }
    }, [fetchInitialData, setDynamicCrumbs, employeeId]);
    
    const fetchLogData = useCallback((tabKey) => {
        if (!permissions.includes('log:read:platform') || tabData[tabKey]?.fetched || tabData[tabKey]?.loading) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        const logEndpoints = {
            jumpcloud: `/api/employees/${employeeId}/jumpcloud-logs`,
            google: `/api/employees/${employeeId}/google-logs`,
            slack: `/api/employees/${employeeId}/slack-logs`,
            timeline: `/api/employees/${employeeId}/unified-timeline`,
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

    }, [employeeId, permissions, tabData]);

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
    };

    const pageSections = [
        { id: 'details-section', label: 'Details', icon: <UserSquare className="w-4 h-4"/>, permission: true },
        { id: 'apps-section', label: 'Apps & Platforms', icon: <LayoutGrid className="w-4 h-4"/>, permission: true },
        { id: 'jumpcloud-section', label: 'JumpCloud Log', icon: <HardDrive className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
        { id: 'google-section', label: 'Google Workspace Log', icon: <Shield className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
        { id: 'slack-section', label: 'Slack Log', icon: <MessageSquare className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
        { id: 'timeline-section', label: 'Unified Timeline', icon: <Bot className="w-4 h-4"/>, permission: permissions.includes('log:read:platform') },
    ].filter(s => s.permission);

    if (loading) return <div className="p-6 text-center">Loading employee profile...</div>;
    if (pageError) return (
        <div className="p-6 text-center text-red-500">
            <AlertTriangle className="mx-auto w-12 h-12 mb-4" />
            <h2 className="text-xl font-semibold">Could not load employee data</h2>
            <p>{pageError}</p>
        </div>
    );
    if (!employee) return null;

    const TabButton = ({ id, label, icon }) => ( 
        <button onClick={() => handleTabClick(id)} className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${ activeTab === id ? 'border-kredivo-primary text-kredivo-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300' }`}>
            {icon} {label}
        </button> 
    );
    
    return (
        <>
            <div className="p-4 sm:p-6 space-y-6">
                <EmployeeDetailHeader employee={employee} onEdit={onEdit} onDeactivate={onDeactivate} permissions={permissions} isOwnProfile={false} />
                
                <InPageDropdownNav sections={pageSections} onScrollTo={handleScrollToSection} />

                <div className="space-y-6 md:hidden">
                    <Section id="details-section" title="Details" icon={<UserSquare className="w-5 h-5" />}>
                        <EmployeeDetailsTab employee={employee} navigate={navigate} permissions={permissions} onTicketClick={handleTicketClick} />
                    </Section>
                    <Section id="apps-section" title="Apps & Platforms" icon={<LayoutGrid className="w-5 h-5" />}>
                        <EmployeeApplicationsTab applications={employee.applications || []} platformStatuses={platformStatuses} isLoading={isLoadingPlatforms} onTicketClick={handleTicketClick} />
                    </Section>
                    {permissions.includes('log:read:platform') && (
                        <>
                            <Section id="jumpcloud-section" title="JumpCloud Log" icon={<HardDrive className="w-5 h-5" />}>
                                <JumpCloudLogPage logs={tabData.jumpcloud.data} loading={tabData.jumpcloud.loading} error={tabData.jumpcloud.error} />
                            </Section>
                            <Section id="google-section" title="Google Workspace Log" icon={<Shield className="w-5 h-5" />}>
                                <GoogleLogPage logs={tabData.google.data} loading={tabData.google.loading} error={tabData.google.error} />
                            </Section>
                             <Section id="slack-section" title="Slack Log" icon={<MessageSquare className="w-5 h-5" />}>
                                <SlackLogPage logs={tabData.slack.data} loading={tabData.slack.loading} error={tabData.slack.error} />
                            </Section>
                            <Section id="timeline-section" title="Unified Timeline" icon={<Bot className="w-5 h-5" />}>
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
                             <EmployeeDetailsTab employee={employee} navigate={navigate} permissions={permissions} onTicketClick={handleTicketClick} />
                        </div>
                        <div style={{ display: activeTab === 'platforms' ? 'block' : 'none' }}>
                            <EmployeeApplicationsTab applications={employee.applications || []} platformStatuses={platformStatuses} isLoading={isLoadingPlatforms} onTicketClick={handleTicketClick} />
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
            {isJiraModalOpen && <JiraTicketModal ticketId={selectedTicketId} onClose={() => setIsJiraModalOpen(false)} />}
        </>
    );
};