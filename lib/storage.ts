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

  // Social
  people: 'social:people',
  socialLogs: 'social:logs',
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
export type PersonType = 'Aile' | 'Hayvan' | 'Arkadaş' | 'Diğer';

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

// Utility: today's ISO date string
export function toDay(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
