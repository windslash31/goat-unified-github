import { MoreVertical, ChevronFirst, ChevronLast, LayoutDashboard, User, Users, Settings, FileText, LogOut } from "lucide-react";
import { createContext, useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { SidebarItem } from './SidebarItem';

export const SidebarContext = createContext();

export function Sidebar({ onLogout }) {
    const { isSidebarCollapsed: expanded, toggleSidebar: setExpanded } = useUIStore();
    const { user } = useAuthStore();
    const permissions = user?.permissions || [];
    const location = useLocation();

    const hasSettingsAccess = permissions.includes('admin:view_users') || permissions.includes('admin:view_roles');
    const hasAuditAccess = permissions.includes('log:read');

    const navItems = [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, visible: permissions.includes('dashboard:view') },
        { id: 'profile', path: '/profile', label: 'Profile', icon: <User size={20} />, visible: permissions.includes('profile:read:own') },
        { id: 'employees', path: '/employees', label: 'Employees', icon: <Users size={20} />, visible: permissions.includes('employee:read:all') },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings size={20} />,
            path: '/settings', 
            visible: hasSettingsAccess,
            children: [
                { id: 'users', label: 'Users', path: '/users', visible: permissions.includes('admin:view_users') },
                { id: 'roles', label: 'Roles & Permissions', path: '/roles', visible: permissions.includes('admin:view_roles') },
            ]
        },
        { id: 'audit', path: '/logs/activity', label: 'Audit', icon: <FileText size={20} />, visible: hasAuditAccess },
    ];

    const [openDropdown, setOpenDropdown] = useState('');

    useEffect(() => {
        const activeParent = navItems.find(item => 
            item.children?.some(child => location.pathname.startsWith(child.path))
        );
        if (activeParent) {
            setOpenDropdown(activeParent.id);
        }
    }, [location.pathname]);


    return (
        <aside className="h-screen">
            <nav className="h-full flex flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-sm">
                <div className="p-4 pb-2 flex justify-between items-center">
                    <img
                        src="https://img.logoipsum.com/243.svg"
                        className={`overflow-hidden transition-all ${
                            expanded ? "w-32" : "w-0"
                        }`}
                        alt="Company Logo"
                    />
                    <button
                        onClick={setExpanded}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        {expanded ? <ChevronFirst /> : <ChevronLast />}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3">
                        {navItems.filter(item => item.visible).map(item => (
                            <SidebarItem 
                                key={item.id} 
                                item={item}
                                isOpen={openDropdown === item.id}
                                setOpen={() => setOpenDropdown(prev => prev === item.id ? '' : item.id)}
                            />
                        ))}
                    </ul>
                    <SidebarItem item={{ icon: <LogOut size={20} />, label: "Logout" }} onClick={onLogout} />
                </SidebarContext.Provider>

                <div className="border-t dark:border-gray-700 flex p-3">
                    <img
                        src={`https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true&name=${encodeURIComponent(user?.name || 'User')}`}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-md"
                    />
                    <div
                        className={`
                            flex justify-between items-center
                            overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"}
                        `}
                    >
                        <div className="leading-4">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{user?.name}</h4>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</span>
                        </div>
                        <MoreVertical size={20} className="text-gray-600 dark:text-gray-300" />
                    </div>
                </div>
            </nav>
        </aside>
    )
}