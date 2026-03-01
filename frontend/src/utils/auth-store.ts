import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string, workspaceName?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      set({
        user: data.user,
        workspace: data.workspace,
        token: data.token,
        isLoading: false,
      });

      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  signup: async (email: string, name: string, password: string, workspaceName?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, workspaceName }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      set({
        user: data.user,
        workspace: data.workspace,
        token: data.token,
        isLoading: false,
      });

      localStorage.setItem('auth_token', data.token);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Signup failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    set({
      user: null,
      workspace: null,
      token: null,
      error: null,
    });
    localStorage.removeItem('auth_token');
  },

  setUser: (user: User | null) => set({ user }),
  setWorkspace: (workspace: Workspace | null) => set({ workspace }),
  setToken: (token: string | null) => set({ token }),
}));
