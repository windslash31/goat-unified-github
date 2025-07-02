import { create } from "zustand";
import api from "../api/api";

const ACCESS_TOKEN_KEY = "accessToken";
const ACCESS_TOKEN_EXP_KEY = "accessTokenExp";

export const useAuthStore = create((set, get) => ({
  accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY) || null,
  accessTokenExp: sessionStorage.getItem(ACCESS_TOKEN_EXP_KEY)
    ? parseInt(sessionStorage.getItem(ACCESS_TOKEN_EXP_KEY))
    : null,
  user: null,
  isAuthenticated: !!sessionStorage.getItem(ACCESS_TOKEN_KEY),

  // Action to set the access token and expiration
  setAccessToken: (token) => {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
      sessionStorage.setItem(ACCESS_TOKEN_EXP_KEY, decoded.exp.toString());
      set({
        accessToken: token,
        accessTokenExp: decoded.exp,
        isAuthenticated: true,
      });
    } catch {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
      sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
      set({
        accessToken: token,
        accessTokenExp: null,
        isAuthenticated: true,
      });
    }
  },

  // Login action
  login: async (email, password) => {
    try {
      const { data } = await api.post("/api/login", { email, password });

      if (!data.accessToken) {
        throw new Error("Login response did not include accessToken.");
      }

      const decodedUser = JSON.parse(atob(data.accessToken.split(".")[1]));

      sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      sessionStorage.setItem(ACCESS_TOKEN_EXP_KEY, decodedUser.exp.toString());

      set({
        accessToken: data.accessToken,
        accessTokenExp: decodedUser.exp,
        user: decodedUser,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Client-side login processing error:", error);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
      set({
        accessToken: null,
        accessTokenExp: null,
        user: null,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  // Logout action
  logout: async () => {
    try {
      await api.post("/api/logout");
    } catch (error) {
      console.error(
        "Logout API call failed, proceeding with client-side logout.",
        error
      );
    } finally {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
      set({
        accessToken: null,
        accessTokenExp: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  // Action to refresh access token and fetch user info
  refreshAccessToken: async () => {
    try {
      const { data } = await api.post("/api/refresh");
      if (data.accessToken) {
        const decodedUser = JSON.parse(atob(data.accessToken.split(".")[1]));
        sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        sessionStorage.setItem(
          ACCESS_TOKEN_EXP_KEY,
          decodedUser.exp.toString()
        );
        set({
          accessToken: data.accessToken,
          accessTokenExp: decodedUser.exp,
          user: decodedUser,
          isAuthenticated: true,
        });
      } else {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
        set({
          accessToken: null,
          accessTokenExp: null,
          user: null,
          isAuthenticated: false,
        });
      }
    } catch (e) {
      console.error("Failed to refresh access token on load.", e);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
      set({
        accessToken: null,
        accessTokenExp: null,
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
        const decodedUser = JSON.parse(atob(token.split(".")[1]));
        set({ user: decodedUser });
      }
    } catch (e) {
      console.error("Failed to decode token on load.", e);
      get().logout();
    }
  },

  // Check if access token is valid (not expired)
  isAccessTokenValid: () => {
    const exp = get().accessTokenExp;
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp > now + 30; // Consider token valid if expires in more than 30 seconds
  },
}));
