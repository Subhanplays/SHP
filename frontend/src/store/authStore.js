import { create } from 'zustand';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { authAPI } from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: localStorage.getItem('authToken'),

  // Initialize auth state
  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('authToken', token);
          
          // Fetch user profile
          const response = await authAPI.getProfile();
          set({
            user: response.data.data,
            isAuthenticated: true,
            token,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          set({ isLoading: false, isAuthenticated: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, token: null, isLoading: false });
        localStorage.removeItem('authToken');
      }
    });
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token);
      
      // Fetch user profile
      const response = await authAPI.getProfile();
      set({
        user: response.data.data,
        isAuthenticated: true,
        token,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('authToken');
      set({ user: null, isAuthenticated: false, token: null });
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      set({ user: response.data.data });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
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