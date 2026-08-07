import { create } from 'zustand';
import { settingsAPI } from '../api/axios';

const DARK_VARS = {
  '--bg-primary': '#0f0f1a',
  '--bg-secondary': '#1a1a2e',
  '--bg-tertiary': '#16213e',
  '--glass-bg': 'rgba(255, 255, 255, 0.05)',
  '--glass-border': 'rgba(255, 255, 255, 0.1)',
  '--text-primary': '#ffffff',
  '--text-secondary': '#a0a0b0',
  '--text-muted': '#6b6b7b',
};

const LIGHT_VARS = {
  '--bg-primary': '#f4f5fb',
  '--bg-secondary': '#ffffff',
  '--bg-tertiary': '#eef0f8',
  '--glass-bg': 'rgba(255, 255, 255, 0.7)',
  '--glass-border': 'rgba(15, 23, 42, 0.1)',
  '--text-primary': '#0f172a',
  '--text-secondary': '#475569',
  '--text-muted': '#94a3b8',
};

const applyCssVariables = (theme, dark) => {
  const root = document.documentElement;
  const base = dark ? DARK_VARS : LIGHT_VARS;
  Object.entries(base).forEach(([k, v]) => root.style.setProperty(k, v));
  if (theme?.primaryColor) root.style.setProperty('--primary-color', theme.primaryColor);
  if (theme?.secondaryColor) root.style.setProperty('--secondary-color', theme.secondaryColor);
  if (theme?.sidebarBackground) root.style.setProperty('--bg-sidebar', theme.sidebarBackground);
  if (theme?.borderRadius) root.style.setProperty('--radius-md', theme.borderRadius);
  root.style.setProperty('--card-bg', theme?.cardBackground || 'rgba(26,26,46,0.8)');
  if (theme?.fontFamily) {
    root.style.setProperty('--font-family', `'${theme.fontFamily}', sans-serif`);
    document.body.style.fontFamily = `'${theme.fontFamily}', sans-serif`;
  }
};

const injectCustomCss = (css) => {
  let el = document.getElementById('custom-css');
  if (!el) {
    el = document.createElement('style');
    el.id = 'custom-css';
    document.head.appendChild(el);
  }
  el.textContent = css || '';
};

const useSettingsStore = create((set, get) => ({
  settings: {},
  branding: {
    panelName: 'Hosting Panel',
    fullName: 'White-Label Hosting Panel',
    logo: null,
    favicon: null,
    footerText: `© ${new Date().getFullYear()} White-Label Hosting Panel. All rights reserved.`,
    browserTitle: 'Hosting Panel',
  },
  theme: {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    backgroundColor: '#0f0f1a',
    cardBackground: 'rgba(26, 26, 46, 0.8)',
    borderRadius: '12px',
    fontFamily: 'Inter',
    sidebarBackground: '#1a1a2e',
    darkMode: true,
    animations: true,
  },
  coins: { enabled: true, signupReward: 1000, referralReward: 500, dailyReward: 100, coinRate: 100 },
  background: { type: 'solid', color: '#0f0f1a', gradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)', image: null, video: null, overlay: 0.5, blur: 0 },
  customCss: '',
  landing: null,
  maintenance: null,
  darkMode: true,
  isLoading: true,

  loadSettings: async () => {
    try {
      const response = await settingsAPI.getAll();
      const s = response.data.data || {};

      const theme = { ...get().theme, ...(s.theme || {}) };
      const darkMode = theme.darkMode !== false;

      const branding = { ...get().branding, ...(s.branding || {}) };
      const background = { ...get().background, ...(s.background || {}) };

      set({
        settings: s,
        branding,
        theme,
        background,
        customCss: s.custom_css || '',
        landing: s.landing || null,
        maintenance: s.maintenance_mode || null,
        coins: { ...get().coins, ...(s.coins || {}) },
        darkMode,
        isLoading: false,
      });

      applyCssVariables(theme, darkMode);
      injectCustomCss(s.custom_css || '');
      if (branding.browserTitle) document.title = branding.browserTitle;
      if (branding.favicon) {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = branding.favicon;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  toggleDarkMode: () => {
    const dark = !get().darkMode;
    set({ darkMode: dark, theme: { ...get().theme, darkMode: dark } });
    applyCssVariables(get().theme, dark);
  },

  updateSetting: async (key, value, category) => {
    try {
      await settingsAPI.update(key, { value, category });
      set((state) => ({ settings: { ...state.settings, [key]: value } }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateBranding: async (data) => {
    const res = await get().updateSetting('branding', data, 'branding');
    if (res.success) {
      set({ branding: { ...get().branding, ...data } });
      if (data.browserTitle) document.title = data.browserTitle;
    }
    return res;
  },

  updateTheme: async (data) => {
    const res = await get().updateSetting('theme', data, 'theme');
    if (res.success) {
      const theme = { ...get().theme, ...data };
      set({ theme, darkMode: theme.darkMode !== false });
      applyCssVariables(theme, theme.darkMode !== false);
    }
    return res;
  },

  updateBackground: async (data) => {
    const res = await get().updateSetting('background', data, 'appearance');
    if (res.success) set({ background: { ...get().background, ...data } });
    return res;
  },

  updateCustomCss: async (css) => {
    const res = await get().updateSetting('custom_css', css, 'appearance');
    if (res.success) {
      set({ customCss: css });
      injectCustomCss(css);
    }
    return res;
  },

  updateLanding: async (data) => {
    const res = await get().updateSetting('landing', data, 'landing');
    if (res.success) set({ landing: data });
    return res;
  },

  updateCoinSettings: async (data) => {
    const res = await get().updateSetting('coins', data, 'coins');
    if (res.success) set({ coins: { ...get().coins, ...data } });
    return res;
  },

  applyAll: () => {
    applyCssVariables(get().theme, get().darkMode);
    injectCustomCss(get().customCss);
  },
}));

export default useSettingsStore;

