import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  bgImage: string | null;
  overlayOpacity: number; // 0.0 to 0.95
  setCustomBackground: (base64Url: string) => void;
  removeCustomBackground: () => void;
  setOverlayOpacity: (opacity: number) => void;
  resetToStarrySky: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'savollar_theme_mode';
const BG_KEY = 'savollar_bg_image';
const OVERLAY_KEY = 'savollar_overlay_opacity';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark'; // Default to night sky
  });

  const [bgImage, setBgImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem(BG_KEY);
    } catch {
      return null;
    }
  });

  const [overlayOpacity, setOverlayOpacityState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(OVERLAY_KEY);
      if (saved) return Number(saved);
    } catch {}
    return 0.75; // Default 75% dark overlay for clear readability
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setCustomBackground = (base64Url: string) => {
    setBgImage(base64Url);
    try {
      localStorage.setItem(BG_KEY, base64Url);
    } catch (e) {
      console.warn('Failed to save background to localStorage (quota exceeded?):', e);
    }
  };

  const removeCustomBackground = () => {
    setBgImage(null);
    try {
      localStorage.removeItem(BG_KEY);
    } catch {}
  };

  const resetToStarrySky = () => {
    removeCustomBackground();
    setTheme('dark');
    setOverlayOpacityState(0.75);
  };

  const setOverlayOpacity = (val: number) => {
    const clamped = Math.max(0, Math.min(0.95, val));
    setOverlayOpacityState(clamped);
    try {
      localStorage.setItem(OVERLAY_KEY, String(clamped));
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        bgImage,
        overlayOpacity,
        setCustomBackground,
        removeCustomBackground,
        setOverlayOpacity,
        resetToStarrySky,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
