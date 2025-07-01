import { MoreVertical, ChevronFirst, ChevronLast, LayoutDashboard, User, Users, Settings, FileText, LogOut } from "lucide-react";
import { createContext, useState, useRef, useEffect } from "react";
import { useNavigate }from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { SidebarItem } from './SidebarItem';
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

export const SidebarContext = createContext();

export function Sidebar({ onLogout }) {
    const { isSidebarCollapsed: expanded, toggleSidebar: setExpanded } = useUIStore();
    const { user } = useAuthStore();
    const permissions = user?.permissions || [];
    const navigate = useNavigate();

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);

    const hasSettingsAccess = permissions.includes('admin:view_users') || permissions.includes('admin:view_roles');
    const hasAuditAccess = permissions.includes('log:read');

    const navItems = [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, visible: permissions.includes('dashboard:view') },
        { id: 'profile', path: '/profile', label: 'Profile', icon: <User size={20} />, visible: permissions.includes('profile:read:own') },
        { id: 'employees', path: '/employees', label: 'Employees', icon: <Users size={20} />, visible: permissions.includes('employee:read:all') },
    ];
    
    const userActions = [
        { id: 'settings', path: '/settings', label: 'Settings', icon: <Settings size={20} />, visible: hasSettingsAccess },
        { id: 'logout', label: 'Logout', icon: <LogOut size={20} />, onClick: onLogout, visible: true },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <aside className="h-screen">
            <nav className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 pb-2 flex justify-between items-center">
                    <img
                        src="https://images.seeklogo.com/logo-png/35/1/goat-logo-png_seeklogo-357788.png"
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
                            />
                        ))}
                    </ul>

                    {/* Moved User Actions into the Provider */}
                    <div className="mt-auto border-t border-gray-200 dark:border-gray-700">
                         <div 
                            className="flex cursor-pointer items-center p-3 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => navigate('/profile')}
                        >
                            <img
                                src={`https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true&name=${encodeURIComponent(user?.name || 'User')}`}
                                alt="User Avatar"
                                className="w-10 h-10 rounded-md"
                            />
                            <div
                                className={`
                                    ml-3 flex flex-col transition-opacity duration-200
                                    ${!expanded && 'hidden opacity-0'}
                                `}
                            >
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                            </div>
                        </div>
                        <div className="px-2 pt-2">
                             {userActions.filter(item => item.visible).map(item => (
                                <SidebarItem 
                                    key={item.id} 
                                    item={item}
                                    onClick={item.onClick}
                                />
                            ))}
                        </div>
                         <div className="p-3">
                            <ThemeSwitcher isCollapsed={!expanded} />
                        </div>
                    </div>
                </SidebarContext.Provider>
            </nav>
        </aside>
    )
}