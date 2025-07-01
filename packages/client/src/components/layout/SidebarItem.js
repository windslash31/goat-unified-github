import React, { useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SidebarContext } from './Sidebar';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SidebarItem({ item, isOpen, setOpen, onClick }) {
    const { expanded } = useContext(SidebarContext);
    const location = useLocation();
    const navigate = useNavigate();
    const isDropdown = item.children && item.children.some(child => child.visible);

    const isParentActive = isDropdown && item.children.some(child => location.pathname.startsWith(child.path));
    const isActive = (item.path && location.pathname.startsWith(item.path)) || isParentActive;

    const handleItemClick = () => {
        if (onClick) {
            onClick();
            return;
        }

        if (isDropdown) {
            if (expanded) {
                setOpen(); // Toggle the dropdown using the handler from parent
            } else {
                navigate(item.path); // When collapsed, navigate to the parent path
            }
        } else {
            navigate(item.path); // It's a direct link
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
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            )}
        </span>
    );
    
    const tooltip = !expanded && (
        <div className={`absolute left-full rounded-md px-2 py-1 ml-6 bg-kredivo-light text-kredivo-dark-text text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50`}>
            {item.label}
        </div>
    );

    return (
        <>
            <li className={`${commonClasses} ${isActive ? activeClasses : inactiveClasses}`} onClick={handleItemClick}>
                {itemContent}
                {tooltip}
            </li>

            <AnimatePresence>
                {isDropdown && expanded && isOpen && (
                    <motion.ul
                        key={item.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
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
        </>
    );
}