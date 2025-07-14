import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Kept your environment variable
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

let isRefreshing = false;
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

    // --- REWRITTEN INTERCEPTOR LOGIC START ---
    const isRetryable =
      error.response?.status === 401 && !originalRequest._retry;
    // --- FIX: This now correctly identifies your login and refresh routes ---
    const isSpecialRoute =
      originalRequest.url === "/api/auth/login" ||
      originalRequest.url === "/api/auth/refresh";

    // Only attempt a token refresh if the error is a 401 and it's NOT a login/refresh attempt.
    if (isRetryable && !isSpecialRoute) {
      if (isRefreshing) {
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

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/api/auth/refresh"); // Using your refresh route

        useAuthStore.getState().setRefreshedTokens(data.accessToken);
        api.defaults.headers.common["Authorization"] =
          "Bearer " + data.accessToken;
        originalRequest.headers["Authorization"] = "Bearer " + data.accessToken;

        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, including the 401 from the login page, reject immediately.
    // This sends the original error back to the login form.
    return Promise.reject(error);
    // --- REWRITTEN INTERCEPTOR LOGIC END ---
  }
);

export default api;
