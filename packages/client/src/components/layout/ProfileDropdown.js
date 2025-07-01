import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings } from 'lucide-react';

export const ProfileDropdown = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
    };
    
    const handleLogout = () => {
        onLogout();
        setIsOpen(false);
    }

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center focus:outline-none">
                <img 
                    src={`https://i.pravatar.cc/150?u=${user.email}`} 
                    alt="User Avatar" 
                    className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-kredivo-primary transition-colors"
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={dropdownVariants}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                        <ul className="py-2">
                            <MenuItem icon={<User size={16} />} onClick={() => handleNavigate('/profile')}>My Profile</MenuItem>
                            <MenuItem icon={<Settings size={16} />} onClick={() => handleNavigate('/settings')}>Settings</MenuItem>
                            <MenuItem icon={<LogOut size={16} />} onClick={handleLogout}>Logout</MenuItem>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MenuItem = ({ icon, children, onClick }) => (
    <li>
        <button 
            onClick={onClick} 
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
            {icon}
            <span>{children}</span>
        </button>
    </li>
);