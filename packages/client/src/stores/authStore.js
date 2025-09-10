import { create } from "zustand";
import api from "../api/api";

// Helper function to decode user from token
const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem("accessToken") || null,
  user: getUserFromToken(localStorage.getItem("accessToken")),
  isAuthenticated: !!localStorage.getItem("accessToken"),

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem("accessToken", token);
      const user = getUserFromToken(token);
      set({ accessToken: token, isAuthenticated: true, user });
    } else {
      // This case handles logout
      localStorage.removeItem("accessToken");
      set({ accessToken: null, isAuthenticated: false, user: null });
    }
  },

  login: async (email, password) => {
    try {
      // CHANGED: Removed the '/api' prefix from the path
      const { data } = await api.post("/auth/login", { email, password });
      get().setAccessToken(data.accessToken);
    } catch (error) {
      // Clear state on failed login
      get().logout();
      // Re-throw the error so the UI component can handle it (e.g., show an error message)
      throw error;
    }
  },

  logout: async () => {
    // Optimistic logout: update UI immediately
    const previousToken = get().accessToken;
    get().setAccessToken(null);

    try {
      // Only call API if we were actually logged in
      if (previousToken) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error(
        "Logout API call failed, but client-side logout is complete.",
        error
      );
    }
  },

  // This function is kept for manual calls if needed, but setAccessToken now handles user decoding.
  fetchUser: () => {
    set({ user: getUserFromToken(get().accessToken) });
  },
}));

// --- Cross-Tab Synchronization Logic ---
// This remains the key to keeping tabs in sync.
const handleStorageChange = (event) => {
  // Only react to changes on the accessToken key
  if (event.key === "accessToken") {
    console.log("Storage event detected. Syncing auth state.");
    const newAccessToken = event.newValue;
    const currentState = useAuthStore.getState();

    // If the state is different, update it.
    if (newAccessToken !== currentState.accessToken) {
      currentState.setAccessToken(newAccessToken);
    }
  }
};

// Listen for storage changes to sync auth state across tabs
window.addEventListener("storage", handleStorageChange);

// Initial fetch/check on app load
useAuthStore.getState().fetchUser();
