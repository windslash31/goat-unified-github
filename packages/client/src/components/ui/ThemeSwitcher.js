import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

export const ThemeSwitcher = ({ isCollapsed }) => {
    const { theme, setTheme } = useTheme();

    const themes = [
        { name: 'light', icon: Sun },
        { name: 'dark', icon: Moon },
        { name: 'system', icon: Monitor },
    ];

    const containerClasses = isCollapsed
        ? 'inline-flex flex-col space-y-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg'
        : 'flex items-center p-1 bg-gray-200 dark:bg-gray-700 rounded-full';

    return (
        <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={containerClasses}>
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => setTheme(t.name)}
                    className={`p-1.5 rounded-full transition-colors duration-200 relative ${
                        theme === t.name
                            ? ''
                            : 'hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    aria-label={`Switch to ${t.name} theme`}
                >
                    {theme === t.name && (
                        <motion.div
                            layoutId="theme-switcher-active"
                            className="absolute inset-0 bg-white dark:bg-gray-900 shadow rounded-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                    <t.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 relative" />
                </button>
            ))}
        </motion.div>
    );
};