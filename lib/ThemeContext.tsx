import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';

const THEME_KEY = 'app:theme';

// ─── Sessiz Keskinlik — Dark ─────────────────────────────────────────────────
export const DARK_COLORS = {
  bg: '#13100e',
  surface: '#1a1410',
  surfaceAlt: '#201c17',
  surfaceElevated: '#282220',
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.10)',
  text: '#e8e0d6',
  textSub: 'rgba(232,224,214,0.55)',
  textMuted: 'rgba(232,224,214,0.30)',
  accent: '#c2827a',
  accentHover: '#d4968e',
  accentDim: 'rgba(194,130,122,0.15)',
  // Semantic metric colors
  vit: '#7ea0bc',
  str: '#b08070',
  foc: '#8a9b8a',
  art: '#8c98a8',
  soc: '#b09870',
  dis: '#c4a679',
  // Neutral warm alternatives
  green: '#8aa388',
  greenDim: 'rgba(138,163,136,0.15)',
  orange: '#c4a679',
  orangeDim: 'rgba(196,166,121,0.15)',
  purple: '#8c98a8',
  purpleDim: 'rgba(140,152,168,0.15)',
  red: '#c27070',
  redDim: 'rgba(194,112,112,0.15)',
  yellow: '#c4a679',
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
    // Sessiz Keskinlik card — no shadows, warm border
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginBottom: 8,
      letterSpacing: -0.1,
    },
    // Section label — 10px uppercase spaced
    label: {
      fontSize: 10,
      color: c.textMuted,
      marginBottom: 6,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
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
      fontWeight: '600',
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
      fontWeight: '500',
      fontSize: 14,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: '300',
      color: c.text,
      marginBottom: 2,
      letterSpacing: -0.02 * 22,
    },
    screenSub: {
      fontSize: 13,
      color: c.textSub,
      marginBottom: 20,
      fontWeight: '400',
    },
    // Accent pill badge — muted, warm
    pill: {
      backgroundColor: c.accentDim,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pillText: {
      color: c.accent,
      fontWeight: '600',
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
  });
}
