import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SidebarContext } from './Sidebar';

export function SidebarItem({ icon, text, path, alert, onClick }) {
    const { expanded } = useContext(SidebarContext);
    const location = useLocation();
    const isActive = location.pathname === path;

    const commonClasses = `
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
    `;

    const activeClasses = "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800 dark:from-indigo-900 dark:to-indigo-800 dark:text-white";
    const inactiveClasses = "hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300";

    const itemContent = (
        <>
            {icon}
            <span
                className={`overflow-hidden transition-all ${
                    expanded ? "w-52 ml-3" : "w-0"
                }`}
            >
                {text}
            </span>
            {alert && (
                <div
                    className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${
                        expanded ? "" : "top-2"
                    }`}
                />
            )}
            {!expanded && (
                <div
                    className={`
                  absolute left-full rounded-md px-2 py-1 ml-6
                  bg-indigo-100 text-indigo-800 text-sm
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
              `}
                >
                    {text}
                </div>
            )}
        </>
    );
    
    const liClassName = `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`;

    return (
        <li onClick={onClick} className={liClassName}>
            {path ? (
                <NavLink to={path} className="w-full h-full flex items-center">
                    {itemContent}
                </NavLink>
            ) : (
                itemContent
            )}
        </li>
    );
}