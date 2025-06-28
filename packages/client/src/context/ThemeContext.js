import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check for saved theme in localStorage or default to 'system'
        return localStorage.getItem('theme') || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};