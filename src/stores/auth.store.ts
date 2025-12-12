import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * IMPORTANT:
 * - In production, this MUST point to Render backend
 * - In dev, localhost
 */
const API_BASE = import.meta.env.PROD
  ? "https://whackiest-25.onrender.com/api/auth"
  : "http://localhost:8080/api/auth";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ requiresVerification?: boolean; email?: string }>;

  login: (
    email: string,
    password: string
  ) => Promise<{ requiresVerification?: boolean; email?: string }>;

  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ---------------- SIGNUP ----------------
      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });

        const response = await fetch(`${API_BASE}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          set({ error: data.error || "Signup failed", isLoading: false });
          throw new Error(data.error);
        }

        set({ isLoading: false });
        return { requiresVerification: data.requiresVerification, email };
      },

      // ---------------- LOGIN ----------------
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        const response = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.status === 403 && data.requiresVerification) {
          set({ isLoading: false });
          return { requiresVerification: true, email };
        }

        if (!response.ok) {
          set({ error: data.error || "Login failed", isLoading: false });
          throw new Error(data.error);
        }

        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });

        return {};
      },

      // ---------------- VERIFY OTP ----------------
      verifyOTP: async (email, otp) => {
        set({ isLoading: true, error: null });

        const response = await fetch(`${API_BASE}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (!response.ok) {
          set({ error: data.error || "Verification failed", isLoading: false });
          throw new Error(data.error);
        }

        set({ isLoading: false });
      },

      // ---------------- RESEND OTP ----------------
      resendOTP: async (email) => {
        set({ isLoading: true, error: null });

        const response = await fetch(`${API_BASE}/resend-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          set({ error: data.error || "Failed to resend OTP", isLoading: false });
          throw new Error(data.error);
        }

        set({ isLoading: false });
      },

      // ---------------- LOGOUT ----------------
      logout: async () => {
        try {
          await fetch(`${API_BASE}/logout`, {
            method: "POST",
            credentials: "include",
          });
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // ---------------- CHECK SESSION ----------------
      checkSession: async () => {
        set({ isLoading: true });

        try {
          const response = await fetch(`${API_BASE}/check-session`, {
            credentials: "include",
          });

          // ONLY logout on explicit 401
          if (response.status === 401) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // ❗ DO NOT logout on network / server error
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "wanderforge-auth",
      // Persist ONLY user data (not auth flag)
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
