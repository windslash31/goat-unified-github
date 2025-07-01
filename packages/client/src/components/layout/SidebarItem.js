import React, { useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SidebarContext } from './Sidebar';

export function SidebarItem({ item, onClick }) {
    const { expanded } = useContext(SidebarContext);
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = item.path && location.pathname.startsWith(item.path);

    const handleItemClick = () => {
        // The onClick from the parent (which closes the mobile drawer) is called first
        if (onClick) {
            onClick();
        }
        if (item.path) {
            navigate(item.path);
        }
    };

    const commonClasses = `
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
    `;
    const activeClasses = "bg-kredivo-light text-kredivo-dark-text dark:bg-kredivo-primary/20 dark:text-kredivo-light";
    const inactiveClasses = "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300";

    const itemContent = (
        <span className="flex items-center">
            {item.icon}
            <span className={`overflow-hidden transition-all ${expanded ? "w-44 ml-3" : "w-0"}`}>{item.label}</span>
        </span>
    );
    
    const tooltip = !expanded && (
        <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-kredivo-light text-kredivo-dark-text text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50`}>
            {item.label}
        </div>
    );

    return (
        <li className={`${commonClasses} ${isActive ? activeClasses : inactiveClasses}`} onClick={handleItemClick}>
            {itemContent}
            {tooltip}
        </li>
    );
}