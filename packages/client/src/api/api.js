import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add the access token to every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle expired access tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Do not retry login requests or requests that already failed once
        if (error.response.status === 401 && !originalRequest._retry &&
         !originalRequest.url.includes('/api/login') // Do not retry login requests
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                const { data } = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/refresh`, { token: refreshToken });
                const newAccessToken = data.accessToken;
                useAuthStore.getState().setAccessToken(newAccessToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;