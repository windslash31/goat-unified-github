import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarContext } from './Sidebar';
import { useUIStore } from '../../stores/uiStore';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SidebarItem({ item, onClick }) {
    const { expanded } = useContext(SidebarContext);
    const toggleSidebar = useUIStore(state => state.toggleSidebar);
    const location = useLocation();
    const isDropdown = item.children && item.children.some(child => child.visible);

    const isParentActive = isDropdown && item.children.some(child => child.path === location.pathname);
    const isActive = item.path === location.pathname || isParentActive;

    const [isOpen, setIsOpen] = useState(isParentActive);

    useEffect(() => {
        // If the parent menu becomes active (because a child route was navigated to directly)
        // and the menu is not already open, open it.
        if (isParentActive && !isOpen) {
            setIsOpen(true);
        }
    }, [isParentActive, isOpen]);

    const handleItemClick = () => {
        if (isDropdown) {
            if (!expanded) {
                toggleSidebar(); // Expand the sidebar
            }
            setIsOpen(!isOpen); // Toggle the dropdown
        } else if (onClick) {
            onClick();
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
        <span className="flex items-center justify-between w-full">
            <div className="flex items-center">
                {item.icon}
                <span className={`overflow-hidden transition-all ${expanded ? "w-44 ml-3" : "w-0"}`}>{item.label}</span>
            </div>
            {isDropdown && expanded && (
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
        </span>
    );
    
    // Tooltip for collapsed sidebar
    const tooltip = !expanded && (
        <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-kredivo-light text-kredivo-dark-text text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50`}>
            {item.label}
        </div>
    );

    return (
        <>
            <li className={`${commonClasses} ${isActive ? activeClasses : inactiveClasses}`} onClick={handleItemClick}>
                {isDropdown || !item.path ? (
                    <div className="w-full">{itemContent}</div>
                ) : (
                    <NavLink to={item.path} className="w-full">{itemContent}</NavLink>
                )}
                {tooltip}
            </li>

            {isDropdown && expanded && (
                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-8"
                        >
                            {item.children.filter(child => child.visible).map(child => (
                                <li key={child.id}>
                                    <NavLink 
                                        to={child.path}
                                        className={({isActive}) => `block py-2 px-3 text-sm rounded-md my-0.5 ${isActive ? 'text-kredivo-primary font-semibold' : 'text-gray-500 hover:text-kredivo-primary'}`}
                                    >
                                        {child.label}
                                    </NavLink>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}