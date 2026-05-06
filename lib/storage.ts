import AsyncStorage from '@react-native-async-storage/async-storage';

// Generic helpers
export async function saveData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function appendToList<T>(key: string, item: T): Promise<T[]> {
  const list = await loadData<T[]>(key, []);
  const updated = [...list, item];
  await saveData(key, updated);
  return updated;
}

// Storage keys
export const KEYS = {
  // Settings
  goalsConfig: 'settings:goals',
  profileName: 'settings:profileName',
  selectedGraphs: 'settings:selectedGraphs',

  // Health
  sleepLogs: 'health:sleep',
  waterLogs: 'health:water',
  weightLogs: 'health:weight',
  nutritionLogs: 'health:nutrition',
  foodLibrary: 'health:foodLibrary',

  // Train
  programs: 'train:programs',
  workoutLogs: 'train:logs',
  stepLogs: 'train:steps',

  // Mind
  mindActivities: 'mind:activities',
  mindLogs: 'mind:logs',
  focusTasks: 'mind:tasks',

  // Social
  people: 'social:people',
  socialLogs: 'social:logs',

  // Settings / gamification
  statLevels:   'settings:statLevels',
  weeklyGoals:  'settings:weeklyGoals',
  weeklyStreak: 'settings:weeklyStreak',

  // Journal
  dailyNotes: 'mind:notes',
};

// Type definitions
export type SleepLog = {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  hours: number;
};

export type WaterLog = {
  id: string;
  date: string;
  totalMl: number;
};

export type WeightLog = {
  id: string;
  date: string;
  kg: number;
};

export type StepLog = {
  id: string;
  date: string;
  steps: number;
};

export type Macro = {
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  calories: number;
};

export type FoodItem = {
  id: string;
  name: string;
  baseGrams: number;
  baseMacros: Macro;
};

export type NutritionLog = {
  id: string;
  date: string;
  foodId: string;
  foodName: string;
  multiplier: number; // actualGrams / baseGrams
  macros: Macro; // already multiplied
};

// Train types
export type Exercise = {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
};

export type ProgramDay = {
  id: string;
  label: string; // e.g. "Day 1"
  isRest: boolean;
  exercises: Exercise[];
};

export type Program = {
  id: string;
  name: string;
  days: ProgramDay[];
};

export type SetLog = {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
};

export type WorkoutLog = {
  id: string;
  date: string;
  programId: string;
  programName: string;
  dayLabel: string;
  sets: SetLog[];
  rpe: number; // 1-10 (10=easiest, 1=hardest)
  avgDifficulty: number;
};

export type FocusTask = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string; // ISO date YYYY-MM-DD
};

// Mind types
export type MindActivity = {
  id: string;
  name: string;      // e.g. "Kod Yazmak"
  statBoost: string; // e.g. "FOC", "ART"
};

export type MindLog = {
  id: string;
  date: string;
  activityId: string;
  activityName: string;
  statBoost: string;
  durationMinutes: number;
  feelingScore: number; // 1-10
};

// Social types
export type PersonType = 'Family' | 'Friend' | 'Pet' | 'Other';

export type Person = {
  id: string;
  name: string;
  type: PersonType;
  closeness: number; // 1-10
};

export type SocialLog = {
  id: string;
  date: string;
  personId: string;
  personName: string;
  minutes: number;
};

export type Goals = {
  steps: number;
  sleepHours: number;
  waterMl: number;
  focusMinutes: number;
  weightTargetKg: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type StatKey = 'vit' | 'str' | 'foc' | 'soc' | 'dis';

export type StatLevel = { level: number; xp: number };
export type StatLevels = Record<StatKey, StatLevel>;

export type WeeklyGoals = {
  focusMinutes: number;
  gymSessions: number;
  waterMlTotal: number;
  caloriesTotal: number;
  stepsTotal: number;
};

export type WeeklyStreakState = {
  current: number;
  best: number;
  lastCheckedWeek: string; // ISO week string e.g. "2026-W18"
};

export type DailyNote = {
  id: string;
  date: string;  // YYYY-MM-DD
  text: string;
  mood: number;  // 1–10
};

export const DEFAULT_GOALS: Goals = {
  steps: 8000,
  sleepHours: 7.5,
  waterMl: 2500,
  focusMinutes: 90,
  weightTargetKg: null,
  calories: 2500,
  proteinG: 150,
  carbsG: 300,
  fatG: 70,
};

export const DEFAULT_STAT_LEVELS: StatLevels = {
  vit: { level: 1, xp: 0 },
  str: { level: 1, xp: 0 },
  foc: { level: 1, xp: 0 },
  soc: { level: 1, xp: 0 },
  dis: { level: 1, xp: 0 },
};

export const DEFAULT_WEEKLY_GOALS: WeeklyGoals = {
  focusMinutes: 300,
  gymSessions: 3,
  waterMlTotal: 17500,
  caloriesTotal: 14000,
  stepsTotal: 56000,
};

// Utility: today's ISO date string
export function toDay(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
