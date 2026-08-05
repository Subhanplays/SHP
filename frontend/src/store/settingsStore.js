import { create } from 'zustand';
import { settingsAPI } from '../api/axios';

const useSettingsStore = create((set, get) => ({
  settings: {},
  branding: {
    panelName: 'SHP',
    fullName: 'SubhanHostPanel',
    logo: null,
    favicon: null,
    footerText: '© 2024 SubhanHostPanel. All rights reserved.',
  },
  theme: {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#0f0f1a',
    cardBackground: 'rgba(26, 26, 46, 0.8)',
    borderRadius: '12px',
    fontFamily: 'Inter',
  },
  coins: {
    enabled: true,
    signupReward: 1000,
    referralReward: 500,
    dailyReward: 100,
  },
  isLoading: true,

  // Load settings
  loadSettings: async () => {
    try {
      const response = await settingsAPI.getAll();
      const settings = response.data.data;
      
      set({
        settings,
        branding: settings.branding || get().branding,
        theme: settings.theme || get().theme,
        coins: settings.coins || get().coins,
        isLoading: false,
      });

      // Update document title
      if (settings.branding?.panelName) {
        document.title = `${settings.branding.panelName} - Hosting Panel`;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  // Update setting
  updateSetting: async (key, value, category) => {
    try {
      await settingsAPI.update(key, { value, category });
      
      set((state) => ({
        settings: {
          ...state.settings,
          [key]: value,
        },
      }));

      return { success: true };
    } catch (error) {
      console.error('Update setting error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update branding
  updateBranding: async (data) => {
    try {
      await settingsAPI.update('branding', { value: data, category: 'branding' });
      set({ branding: data });
      return { success: true };
    } catch (error) {
      console.error('Update branding error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update theme
  updateTheme: async (data) => {
    try {
      await settingsAPI.update('theme', { value: data, category: 'theme' });
      set({ theme: data });
      
      // Update CSS variables
      if (data.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', data.primaryColor);
      }
      if (data.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
      }
      if (data.backgroundColor) {
        document.documentElement.style.setProperty('--bg-primary', data.backgroundColor);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update theme error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update coin settings
  updateCoinSettings: async (data) => {
    try {
      await settingsAPI.update('coins', { value: data, category: 'coins' });
      set({ coins: data });
      return { success: true };
    } catch (error) {
      console.error('Update coin settings error:', error);
      return { success: false, error: error.message };
    }
  },
}));

export default useSettingsStore;