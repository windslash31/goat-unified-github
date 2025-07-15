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

    // Check if the error is a 401 and we haven't retried yet.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If refreshPromise is not null, another request is already trying to refresh the token.
      // We hook into that existing promise.
      if (refreshPromise) {
        try {
          const newAccessToken = await refreshPromise;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // If refreshPromise is null, this is the first 401.
      // We start the refresh process.
      refreshPromise = new Promise(async (resolve, reject) => {
        try {
          console.log("Attempting to refresh token...");
          const { data } = await api.post("/api/auth/refresh");
          const newAccessToken = data.accessToken;

          // IMPORTANT: Use the centralized store method to update the token.
          // This will update localStorage and trigger the 'storage' event for other tabs.
          useAuthStore.getState().setAccessToken(newAccessToken);

          console.log("Token refreshed successfully.");
          resolve(newAccessToken);
        } catch (refreshError) {
          console.error("Failed to refresh token, logging out.", refreshError);
          // If refresh fails, log out from all tabs.
          useAuthStore.getState().logout();
          reject(refreshError);
        } finally {
          // Whether it succeeded or failed, reset the refreshPromise so the next 401 can trigger a new refresh.
          refreshPromise = null;
        }
      });

      // Now, retry the original request using the result of our new refreshPromise.
      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        // This will catch the rejection from the refreshPromise if the refresh failed.
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
