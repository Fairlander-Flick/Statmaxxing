import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';

const THEME_KEY = 'app:theme';

// ─── Shared stat colours ────────────────────────────────────────────────────
const STAT = {
  vit: '#e8385a',
  str: '#f97316',
  foc: '#0ea5e9',
  art: '#a855f7',
  soc: '#22c55e',
  dis: '#eab308',
};

// ─── AMOLED Dark (Konsept 5 inspired) ───────────────────────────────────────
export const DARK_COLORS = {
  bg: '#000000',
  surface: '#0f0f0f',
  surfaceAlt: '#1a1a1a',
  surfaceElevated: '#222222',
  border: '#2a2a2a',
  borderLight: '#333333',
  text: '#f8f8f8',
  textSub: '#888888',
  textMuted: '#555555',
  accent: '#0ea5e9',
  accentDim: '#0ea5e922',
  green: '#22c55e',
  greenDim: '#22c55e22',
  orange: '#f97316',
  orangeDim: '#f9731622',
  purple: '#a855f7',
  purpleDim: '#a855f722',
  red: '#ef4444',
  redDim: '#ef444422',
  yellow: '#eab308',
  ...STAT,
};

// ─── Nordic Minimal Light (Konsept 2 inspired) ───────────────────────────────
export const LIGHT_COLORS = {
  bg: '#f0ede8',
  surface: '#faf8f5',
  surfaceAlt: '#e8e3db',
  surfaceElevated: '#ddd8d0',
  border: '#c4bdb5',
  borderLight: '#d4cec6',
  text: '#1c1917',
  textSub: '#6b6560',
  textMuted: '#9c9590',
  accent: '#0284c7',
  accentDim: '#0284c715',
  green: '#16a34a',
  greenDim: '#16a34a15',
  orange: '#ea580c',
  orangeDim: '#ea580c15',
  purple: '#7c3aed',
  purpleDim: '#7c3aed15',
  red: '#dc2626',
  redDim: '#dc262615',
  yellow: '#ca8a04',
  // stat colours slightly darker for legibility on light bg
  vit: '#e8385a',
  str: '#ea580c',
  foc: '#0284c7',
  art: '#7c3aed',
  soc: '#16a34a',
  dis: '#ca8a04',
};

export type ThemeColors = typeof DARK_COLORS;
export type ThemeMode = 'dark' | 'light';

// ─── Context ─────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: DARK_COLORS,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const toggleTheme = async () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark: mode === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Global style factory ─────────────────────────────────────────────────────
export function makeGlobalStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 6,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    label: {
      fontSize: 15,
      color: c.textSub,
      marginBottom: 8,
      fontWeight: '500',
    },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      color: c.text,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      marginBottom: 12,
    },
    btnPrimary: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center' as const,
    },
    btnPrimaryText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.2,
    },
    btnSecondary: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center' as const,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    btnSecondaryText: {
      color: c.text,
      fontWeight: '600',
      fontSize: 15,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    screenTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: c.text,
      marginBottom: 4,
      letterSpacing: -0.8,
    },
    screenSub: {
      fontSize: 15,
      color: c.textSub,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
      marginTop: 6,
    },
  });
}
