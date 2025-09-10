import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add the Authorization header to every request
api.interceptors.request.use(
  (config) => {
    // Use the state from the store, which is synced across tabs
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// This variable will hold the promise of the token refresh.
// It's null if no refresh is in progress.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // CHANGED: Removed '/api' prefix
    const isLoginAttempt = originalRequest.url.endsWith("/auth/login");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginAttempt
    ) {
      originalRequest._retry = true;

      if (refreshPromise) {
        try {
          const newAccessToken = await refreshPromise;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      refreshPromise = new Promise(async (resolve, reject) => {
        try {
          const { data } = await api.post("/auth/refresh");
          const newAccessToken = data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);
          resolve(newAccessToken);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          reject(refreshError);
        } finally {
          refreshPromise = null;
        }
      });

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
