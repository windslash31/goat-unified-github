import { create } from "zustand";
import api from "../api/api";

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem("accessToken") || null,
  user: null,
  authStatus: "pending", // 'pending', 'authenticated', 'unauthenticated'

  isAuthenticated: () => get().authStatus === "authenticated",

  setRefreshedTokens: (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    try {
      const decodedUser = JSON.parse(atob(accessToken.split(".")[1]));
      set({
        accessToken,
        user: decodedUser,
        authStatus: "authenticated",
      });
    } catch (e) {
      console.error("Error decoding token:", e);
      localStorage.removeItem("accessToken");
      set({
        accessToken: null,
        user: null,
        authStatus: "unauthenticated",
      });
    }
  },

  login: async (email, password) => {
    try {
      const { data } = await api.post("/api/login", { email, password });

      if (!data.accessToken) {
        throw new Error("Login response did not include an accessToken.");
      }

      localStorage.setItem("accessToken", data.accessToken);

      const decodedUser = JSON.parse(atob(data.accessToken.split(".")[1]));

      set({
        accessToken: data.accessToken,
        user: decodedUser,
        authStatus: "authenticated",
      });
    } catch (error) {
      console.error("Client-side login processing error:", error);
      localStorage.removeItem("accessToken");
      set({
        accessToken: null,
        user: null,
        authStatus: "unauthenticated",
      });
      throw error;
    }
  },

  logout: async () => {
    const hasToken = !!get().accessToken;
    if (hasToken) {
      try {
        await api.post("/api/logout");
      } catch (error) {
        console.error(
          "Logout API call failed, proceeding with client-side logout.",
          error
        );
      }
    }

    localStorage.removeItem("accessToken");
    set({
      accessToken: null,
      user: null,
      authStatus: "unauthenticated",
    });
  },

  verifyAuth: async () => {
    try {
      // REMOVED THE FLAWED CHECK.
      // Now, it will ALWAYS attempt to hit the /api/me endpoint.
      // If the accessToken is missing or expired, this call will fail with a 401.
      // The axios interceptor will then catch the 401 and try to /refresh.
      // This is the correct, robust flow.
      const { data } = await api.get("/api/me");

      const decodedUser = JSON.parse(atob(get().accessToken.split(".")[1]));
      set({ user: { ...decodedUser, ...data }, authStatus: "authenticated" });
    } catch (error) {
      // If the /api/me call fails AND the subsequent refresh in the interceptor also fails,
      // this catch block will run.
      console.log("Session verification failed. User is unauthenticated.");
      // The interceptor already calls logout(), but we ensure the state is correct.
      set({ authStatus: "unauthenticated" });
    }
  },
}));
