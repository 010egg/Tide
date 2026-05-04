import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface SettingsState {
  theme: Theme;
  fontSize: number;
  showPreview: boolean;

  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  togglePreview: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'light',
  fontSize: 14,
  showPreview: true,

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  setFontSize: (fontSize) => set({ fontSize }),

  togglePreview: () => set((s) => ({ showPreview: !s.showPreview })),
}));
