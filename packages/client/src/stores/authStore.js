import { create } from 'zustand';
import api from '../api/api';

export const useAuthStore = create((set, get) => ({
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),

    // Action to set the access token
    setAccessToken: (token) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token, isAuthenticated: !!token });
    },

    // --- NEW: Function to set both tokens after a refresh ---
    setRefreshedTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        const decodedUser = JSON.parse(atob(accessToken.split('.')[1]));
        set({
            accessToken,
            refreshToken,
            user: decodedUser,
            isAuthenticated: true,
        });
    },

    // Login action
    login: async (email, password) => {
        try {
            const { data } = await api.post('/api/login', { email, password });

            if (!data.accessToken || !data.refreshToken) {
                throw new Error("Login response did not include tokens.");
            }

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            
            const decodedUser = JSON.parse(atob(data.accessToken.split('.')[1]));
            
            set({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: decodedUser,
                isAuthenticated: true,
            });
        } catch (error) {
            console.error("Client-side login processing error:", error);
            // Clear any partial login data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({
                accessToken: null,
                refreshToken: null,
                user: null,
                isAuthenticated: false,
            });
            // Re-throw the error so the component can catch it and display a message
            throw error;
        }
    },

    // Logout action
    logout: async () => {
        const refreshToken = get().refreshToken;
        try {
            // Pass the refresh token in the body for invalidation
            await api.post('/api/logout', { refreshToken });
        } catch (error) {
            console.error("Logout API call failed, proceeding with client-side logout.", error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({
                accessToken: null,
                refreshToken: null,
                user: null,
                isAuthenticated: false,
            });
        }
    },
    
    // Action to fetch user info if not already present
    fetchUser: () => {
        try {
            const token = get().accessToken;
            if (token && !get().user) {
                const decodedUser = JSON.parse(atob(token.split('.')[1]));
                set({ user: decodedUser });
            }
        } catch (e) {
            console.error("Failed to decode token on load.", e);
            get().logout();
        }
    }
}));