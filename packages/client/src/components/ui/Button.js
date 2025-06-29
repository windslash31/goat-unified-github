import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) => {
    // Base classes for all buttons
    const baseClasses = "inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

    // Variant classes for different button types
    const variants = {
        primary: "bg-kredivo-primary border-kredivo-primary text-white hover:bg-kredivo-primary-hover focus:ring-kredivo-primary",
        secondary: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-kredivo-primary",
        danger: "bg-danger border-danger text-white hover:bg-danger-hover focus:ring-danger",
    };

    const combinedClasses = `${baseClasses} ${variants[variant]} ${className}`;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClasses}
        >
            {children}
        </button>
    );
};