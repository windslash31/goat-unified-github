import { useState, useEffect } from 'react';

export const useFetchFilterOptions = (endpoint, token) => {
    const [options, setOptions] = useState([]);
    useEffect(() => {
        if (!endpoint || !token) return;
        const fetchOptions = async () => {
            try {
                const url = `${process.env.REACT_APP_API_BASE_URL}/api/${endpoint}`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) setOptions(await response.json());
            } catch (error) {
                console.error(`Failed to fetch filter options for ${endpoint}:`, error);
            }
        };
        fetchOptions();
    }, [endpoint, token]);
    return options;
};