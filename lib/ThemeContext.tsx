import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';

const THEME_KEY = 'app:theme';

// ─── Stat colours (RPG attributes) ─────────────────────────────────────────
const STAT = {
  vit: '#f472b6',   // pink — Vitality
  str: '#fb923c',   // orange — Strength
  foc: '#818cf8',   // indigo-light — Focus
  art: '#a78bfa',   // violet — Art/Creative
  soc: '#34d399',   // emerald — Social
  dis: '#fbbf24',   // amber — Discipline
};

// ─── Stitch Dark (Electric Indigo / #0F0F13 base) ───────────────────────────
export const DARK_COLORS = {
  bg: '#0F0F13',
  surface: '#16161E',
  surfaceAlt: '#1f1f27',
  surfaceElevated: '#292932',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  text: '#e4e1ed',
  textSub: '#c7c4d7',
  textMuted: '#908fa0',
  accent: '#6366F1',
  accentDim: 'rgba(99,102,241,0.15)',
  accentGlow: 'rgba(99,102,241,0.3)',
  green: '#34d399',
  greenDim: 'rgba(52,211,153,0.15)',
  orange: '#fb923c',
  orangeDim: 'rgba(251,146,60,0.15)',
  purple: '#a78bfa',
  purpleDim: 'rgba(167,139,250,0.15)',
  red: '#f87171',
  redDim: 'rgba(248,113,113,0.15)',
  yellow: '#fbbf24',
  ...STAT,
};

// ─── Stitch Light (premium soft purple base) ────────────────────────────────
export const LIGHT_COLORS = {
  bg: '#f0f0f8',
  surface: '#fafafe',
  surfaceAlt: '#eeeef8',
  surfaceElevated: '#e4e4f0',
  border: 'rgba(99,102,241,0.15)',
  borderLight: 'rgba(99,102,241,0.25)',
  text: '#0f0e1a',
  textSub: '#3a3a5c',
  textMuted: '#7070a0',
  accent: '#4f46e5',
  accentDim: 'rgba(79,70,229,0.12)',
  accentGlow: 'rgba(79,70,229,0.22)',
  green: '#059669',
  greenDim: 'rgba(5,150,105,0.1)',
  orange: '#ea580c',
  orangeDim: 'rgba(234,88,12,0.1)',
  purple: '#7c3aed',
  purpleDim: 'rgba(124,58,237,0.1)',
  red: '#dc2626',
  redDim: 'rgba(220,38,38,0.1)',
  yellow: '#d97706',
  // stat colours bold on light
  vit: '#db2777',
  str: '#ea580c',
  foc: '#4f46e5',
  art: '#7c3aed',
  soc: '#059669',
  dis: '#d97706',
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
    // Stitch glass card
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    label: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: 6,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      color: c.text,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      marginBottom: 12,
    },
    btnPrimary: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center' as const,
      backgroundColor: c.accent,
    },
    btnPrimaryText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.2,
    },
    btnSecondary: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnSecondaryText: {
      color: c.text,
      fontWeight: '600',
      fontSize: 14,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      marginBottom: 2,
      letterSpacing: -0.6,
    },
    screenSub: {
      fontSize: 14,
      color: c.textSub,
      marginBottom: 20,
      fontWeight: '300',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 4,
    },
    // Accent pill badge
    pill: {
      backgroundColor: c.accentDim,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pillText: {
      color: c.accent,
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });
}
