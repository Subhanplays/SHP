import { create } from 'zustand';
import { authAPI } from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: localStorage.getItem('authToken'),

  // Initialize auth state from stored token
  init: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, token: null, isLoading: false });
      return;
    }
    try {
      const response = await authAPI.getProfile();
      set({
        user: response.data.data,
        isAuthenticated: true,
        token,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem('authToken');
        set({ user: null, isAuthenticated: false, token: null, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, token, isLoading: false });
      }
    }
  },

  // Login with email and password
  login: async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;
      localStorage.setItem('authToken', token);
      set({ user, isAuthenticated: true, token, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: message };
    }
  },

  // Register a new account
  register: async (username, email, password, referralCode) => {
    try {
      const response = await authAPI.register({ username, email, password, referralCode });
      const { token, user } = response.data.data;
      localStorage.setItem('authToken', token);
      set({ user, isAuthenticated: true, token, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: message };
    }
  },

  // Sign out
  signOut: async () => {
    localStorage.removeItem('authToken');
    set({ user: null, isAuthenticated: false, token: null });
    return { success: true };
  },

  // Set an existing session directly (used by OAuth callback)
  setSession: (token, user) => {
    localStorage.setItem('authToken', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, token, isLoading: false });
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      set({ user: response.data.data });
      return { success: true, user: response.data.data };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Refresh the current user from the API
  refreshProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      set({ user: response.data.data, isAuthenticated: true });
      return { success: true, user: response.data.data };
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        set({ user: null, isAuthenticated: false, token: null });
      }
      return { success: false, error };
    }
  },

  // Update coins (after a transaction)
  updateCoins: (newBalance) => {
    set((state) => ({
      user: state.user ? { ...state.user, coins: newBalance } : null,
    }));
  },

  // Get user coins
  getCoins: () => {
    return get().user?.coins || 0;
  },

  // Check if admin
  isAdmin: () => {
    const user = get().user;
    return user?.role === 'admin' || user?.role === 'superadmin';
  },
}));

export default useAuthStore;
