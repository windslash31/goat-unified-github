import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent retrying for login or refresh routes to avoid loops.
      if (
        originalRequest.url === "/api/auth/login" ||
        originalRequest.url === "/api/auth/refresh"
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // --- ROBUST LOCKING MECHANISM START ---
      const isRefreshing = localStorage.getItem("isRefreshing");

      if (isRefreshing === "true") {
        // If another tab is already refreshing, queue this request.
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // This tab will now attempt to refresh. Set the lock.
      localStorage.setItem("isRefreshing", "true");

      try {
        const { data } = await api.post("/api/auth/refresh");
        const newAccessToken = data.accessToken;

        // Use the centralized method from authStore to ensure the storage event fires for other tabs
        useAuthStore.getState().setAccessToken(newAccessToken);
        useAuthStore.getState().fetchUser(); // Update user info with new token

        // Retry all queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry the original request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout all tabs and reject all queued requests
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        // Always remove the lock
        localStorage.removeItem("isRefreshing");
      }
      // --- ROBUST LOCKING MECHANISM END ---
    }

    return Promise.reject(error);
  }
);

export default api;
