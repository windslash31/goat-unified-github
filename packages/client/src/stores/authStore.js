// packages/client/src/stores/authStore.js
import { create } from "zustand";
import api from "../api/api";

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem("accessToken") || null,
  user: null,
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setAccessToken: (token) => {
    localStorage.setItem("accessToken", token);
    set({ accessToken: token, isAuthenticated: !!token });
  },

  // Simplified to only handle the new access token
  setRefreshedTokens: (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    const decodedUser = JSON.parse(atob(accessToken.split(".")[1]));
    set({
      accessToken,
      user: decodedUser,
      isAuthenticated: true,
    });
  },

  login: async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });

      if (!data.accessToken) {
        throw new Error("Login response did not include an access token.");
      }

      localStorage.setItem("accessToken", data.accessToken);

      const decodedUser = JSON.parse(atob(data.accessToken.split(".")[1]));

      set({
        accessToken: data.accessToken,
        user: decodedUser,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Client-side login processing error:", error);
      localStorage.removeItem("accessToken");
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // The httpOnly cookie will be cleared by the server.
      // We no longer need to send the refresh token.
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error(
        "Logout API call failed, proceeding with client-side logout.",
        error
      );
    } finally {
      localStorage.removeItem("accessToken");
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

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
}));
