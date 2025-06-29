import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck, User, Settings, FileText, Users, ChevronDown, X } from 'lucide-react';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export const Sidebar = ({ onLogout, isMobileOpen, setMobileOpen }) => {
    const location = useLocation();
    const { user } = useAuthStore();
    const permissions = user?.permissions || [];
    const { isCollapsed, toggleSidebar } = useUIStore();

    const [openDropdowns, setOpenDropdowns] = useState({
      settings: location.pathname.startsWith('/users') || location.pathname.startsWith('/roles'),
      audit: location.pathname.startsWith('/logs')
    });
    
    const hasSettingsAccess = permissions.includes('admin:view_users') || permissions.includes('admin:view_roles');
    const hasAuditAccess = permissions.includes('log:read');

    const navItems = [
        { id: 'profile', path: '/profile', label: 'Profile', icon: User, permission: 'profile:read:own', visible: permissions.includes('profile:read:own') },
        { id: 'employees', path: '/employees', label: 'Employees', icon: Users, permission: 'employee:read:all', visible: permissions.includes('employee:read:all') },
        { id: 'settings', label: 'Settings', icon: Settings, visible: hasSettingsAccess, subItems: [
            { id: 'user_management', path: '/users', label: 'User Management', permission: 'admin:view_users' },
            { id: 'role_management', path: '/roles', label: 'Roles & Permissions', permission: 'admin:view_roles' }
        ]},
        { id: 'audit', label: 'Audit', icon: FileText, visible: hasAuditAccess, subItems: [
            { id: 'activity_log', path: '/logs/activity', label: 'Activity Log', permission: 'log:read' }
        ]},
    ];

    const handleNavLinkClick = () => {
        if (window.innerWidth < 768) {
            setMobileOpen(false);
        }
    };

    const handleDropdownToggle = (id) => {
        setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const NavItem = ({ item }) => {
        if (!item.visible) return null;

        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isActive = hasSubItems 
            ? item.subItems.some(sub => location.pathname.startsWith(sub.path))
            : location.pathname.startsWith(item.path);

        const isDropdownOpen = openDropdowns[item.id] && !isCollapsed;

        const linkClasses = `flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${
            isActive
            ? 'bg-kredivo-light text-kredivo-dark-text dark:bg-kredivo-primary/20 dark:text-kredivo-primary'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`;

        if (hasSubItems) {
            return (
                <div>
                    <button onClick={() => handleDropdownToggle(item.id)} className={`${linkClasses} justify-between`}>
                        <div className="flex items-center">
                            {item.icon && <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-kredivo-primary' : ''}`} />}
                            <span className={`${isCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${isCollapsed ? 'md:hidden' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                        <div className="mt-1 space-y-1 pl-8">
                            {item.subItems.filter(sub => permissions.includes(sub.permission)).map(sub => <NavItem key={sub.id} item={{...sub, visible: true}} />)}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <NavLink to={item.path} className={linkClasses} onClick={handleNavLinkClick}>
                {item.icon && <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-kredivo-primary' : ''}`} />}
                <span className={`${isCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
            </NavLink>
        );
    };

    return (
        <aside className={`flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out
                           z-40 h-full
                           fixed md:relative 
                           ${isCollapsed ? 'w-20' : 'w-64'}
                           ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
            
            <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'} px-4`}>
                <div className="flex items-center overflow-hidden">
                    <ShieldCheck className="w-8 h-8 text-kredivo-primary flex-shrink-0" />
                    <div className={`ml-2 whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Owl</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Kredivo</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setMobileOpen(false)} 
                    className={`p-2 -mr-2 text-gray-500 hover:text-gray-800 md:hidden ${isCollapsed ? 'hidden' : ''}`}
                    aria-label="Close sidebar"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map(item => <NavItem key={item.id} item={item} />)}
            </nav>

            <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex justify-center">
                    <ThemeSwitcher isCollapsed={isCollapsed} />
                </div>
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className={`${isCollapsed ? 'md:hidden' : ''}`}>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};