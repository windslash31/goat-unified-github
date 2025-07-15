import { create } from "zustand";
import api from "../api/api";

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem("accessToken") || null,
  user: null,
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setAccessToken: (token) => {
    // When the token is set, it's stored in localStorage,
    // which will trigger the 'storage' event in other tabs.
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
    set({ accessToken: token, isAuthenticated: !!token });
  },

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

      // Use the setAccessToken method to ensure localStorage is updated
      get().setAccessToken(data.accessToken);
      const decodedUser = JSON.parse(atob(data.accessToken.split(".")[1]));
      set({ user: decodedUser });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "An unknown error occurred.";
      console.error("Client-side login processing error:", errorMessage);
      get().logout(); // Ensure logout clears state via the centralized method
      throw error;
    }
  },

  logout: async () => {
    try {
      // Only call the logout API if the user is currently authenticated
      if (get().isAuthenticated) {
        await api.post("/api/auth/logout");
      }
    } catch (error) {
      console.error(
        "Logout API call failed, proceeding with client-side logout.",
        error
      );
    } finally {
      // Use setAccessToken(null) to ensure the 'storage' event fires for other tabs
      get().setAccessToken(null);
      set({ user: null });
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

// --- NEW: Cross-Tab Synchronization Logic ---
// This function listens for changes to localStorage made by other tabs.
const handleStorageChange = (event) => {
  if (event.key === "accessToken") {
    const newAccessToken = event.newValue;
    const currentState = useAuthStore.getState();

    // If the token in the event is different from the one in our current tab's state...
    if (newAccessToken !== currentState.accessToken) {
      if (newAccessToken) {
        // Another tab logged in or refreshed the token. Sync this tab.
        console.log("Auth state synced from another tab: Refresh/Login");
        useAuthStore.setState({
          accessToken: newAccessToken,
          isAuthenticated: true,
        });
        currentState.fetchUser(); // Re-fetch user info with the new token
      } else {
        // Another tab logged out. Log this tab out too.
        console.log("Auth state synced from another tab: Logout");
        useAuthStore.setState({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      }
    }
  }
};

// Add the event listener when the app loads.
window.addEventListener("storage", handleStorageChange);
