import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';

const THEME_KEY = 'app:theme';

// ─── Sessiz Keskinlik — Slate Cool Dark ──────────────────────────────────────
export const DARK_COLORS = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceAlt: '#222535',
  surfaceElevated: '#2a2e40',
  border: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.13)',
  text: '#ffffff',
  textSub: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.44)',
  accent: '#c2827a',
  accentHover: '#d4968e',
  accentDim: 'rgba(194,130,122,0.14)',
  // Semantic metric colors
  vit: '#7eaacc',
  str: '#c08878',
  foc: '#8aaa8a',
  art: '#8ca8c4',
  soc: '#c0a878',
  dis: '#c4aa80',
  // Neutral alternatives
  green: '#8aa388',
  greenDim: 'rgba(138,163,136,0.15)',
  orange: '#c4aa80',
  orangeDim: 'rgba(196,170,128,0.15)',
  purple: '#8ca8c4',
  purpleDim: 'rgba(140,168,196,0.15)',
  red: '#c27070',
  redDim: 'rgba(194,112,112,0.15)',
  yellow: '#c4aa80',
};

// ─── Sessiz Keskinlik — Light (canonical/default) ───────────────────────────
export const LIGHT_COLORS = {
  bg: '#f7f4f0',
  surface: '#fdfcfa',
  surfaceAlt: '#f0ece7',
  surfaceElevated: '#ffffff',
  border: 'rgba(0,0,0,0.07)',
  borderLight: 'rgba(0,0,0,0.11)',
  text: '#1e1915',
  textSub: 'rgba(30,25,21,0.55)',
  textMuted: 'rgba(30,25,21,0.30)',
  accent: '#a85f56',
  accentHover: '#c2726a',
  accentDim: 'rgba(168,95,86,0.12)',
  // Semantic metric colors
  vit: '#4a7a9b',
  str: '#8c5a4a',
  foc: '#4d6b4d',
  art: '#4d5f72',
  soc: '#8a6a3f',
  dis: '#8a6a3f',
  // Neutral warm alternatives
  green: '#5d7a5b',
  greenDim: 'rgba(93,122,91,0.12)',
  orange: '#9a7e4f',
  orangeDim: 'rgba(154,126,79,0.12)',
  purple: '#5d6b7d',
  purpleDim: 'rgba(93,107,125,0.12)',
  red: '#a85050',
  redDim: 'rgba(168,80,80,0.12)',
  yellow: '#9a7e4f',
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
    // ── Typography scale ────────────────────────────────────────────────────
    typoDisplay: {
      fontSize: 48, fontWeight: '900' as const, letterSpacing: -2,
    },
    typoHeading: {
      fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3,
    },
    typoLabel: {
      fontSize: 11, fontWeight: '600' as const, letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    typoBody: {
      fontSize: 14, fontWeight: '400' as const, letterSpacing: 0,
    },
    typoCaption: {
      fontSize: 11, fontWeight: '400' as const, letterSpacing: 0,
    },
    // ── Card hierarchy ──────────────────────────────────────────────────────
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardCompact: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: c.text,
      marginBottom: 8,
      letterSpacing: -0.1,
    },
    label: {
      fontSize: 11,
      color: c.textMuted,
      marginBottom: 6,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: c.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 4,
    },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      color: c.text,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      marginBottom: 12,
    },
    btnPrimary: {
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center' as const,
      backgroundColor: c.accent,
    },
    btnPrimaryText: {
      color: '#fff',
      fontWeight: '600' as const,
      fontSize: 14,
      letterSpacing: 0.1,
    },
    btnSecondary: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnSecondaryText: {
      color: c.text,
      fontWeight: '500' as const,
      fontSize: 14,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: c.text,
      marginBottom: 2,
      letterSpacing: -0.3,
    },
    screenSub: {
      fontSize: 14,
      color: c.textSub,
      marginBottom: 20,
      fontWeight: '400' as const,
    },
    pill: {
      backgroundColor: c.accentDim,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pillText: {
      color: c.accent,
      fontWeight: '600' as const,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
  });
}
