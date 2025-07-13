import React, { createContext, useState, useContext } from 'react';

// Create the context
const BreadcrumbContext = createContext();

// Create a custom hook to easily use the context
export const useBreadcrumb = () => {
    return useContext(BreadcrumbContext);
};

// Create the Provider component that will wrap our app
export const BreadcrumbProvider = ({ children }) => {
    const [dynamicCrumbs, setDynamicCrumbs] = useState([]);

    const value = {
        dynamicCrumbs,
        setDynamicCrumbs
    };

    return (
        <BreadcrumbContext.Provider value={value}>
            {children}
        </BreadcrumbContext.Provider>
    );
};