import {
  loadData, saveData, KEYS,
  WeeklyGoals, WeeklyStreakState, DEFAULT_WEEKLY_GOALS,
  WorkoutLog, MindLog, WaterLog, NutritionLog, StepLog,
} from './storage';

export function isoWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '00')}`;
}

export function weekBounds(date: Date = new Date()): { mon: string; sun: string } {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  const mon = d.toISOString().split('T')[0];
  d.setDate(d.getDate() + 6);
  const sun = d.toISOString().split('T')[0];
  return { mon, sun };
}

export function prevWeekBounds(): { mon: string; sun: string } {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return weekBounds(d);
}

export type WeeklyProgress = {
  focusMinutes: number;
  gymSessions: number;
  waterMlTotal: number;
  caloriesTotal: number;
  stepsTotal: number;
};

export async function computeThisWeekProgress(): Promise<WeeklyProgress> {
  const { mon, sun } = weekBounds();
  const inRange = (date: string) => date >= mon && date <= sun;

  const [workoutLogs, mindLogs, waterLogs, nutritionLogs, stepLogs] = await Promise.all([
    loadData<WorkoutLog[]>(KEYS.workoutLogs, []),
    loadData<MindLog[]>(KEYS.mindLogs, []),
    loadData<WaterLog[]>(KEYS.waterLogs, []),
    loadData<NutritionLog[]>(KEYS.nutritionLogs, []),
    loadData<StepLog[]>(KEYS.stepLogs, []),
  ]);

  const gymDays = new Set(workoutLogs.filter(l => inRange(l.date)).map(l => l.date)).size;

  return {
    focusMinutes: mindLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.durationMinutes, 0),
    gymSessions: gymDays,
    waterMlTotal: waterLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.totalMl, 0),
    caloriesTotal: nutritionLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.macros.calories, 0),
    stepsTotal: stepLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.steps, 0),
  };
}

async function weekHitGoals(mon: string, sun: string, goals: WeeklyGoals): Promise<boolean> {
  const inRange = (date: string) => date >= mon && date <= sun;

  const [workoutLogs, mindLogs, waterLogs, nutritionLogs, stepLogs] = await Promise.all([
    loadData<WorkoutLog[]>(KEYS.workoutLogs, []),
    loadData<MindLog[]>(KEYS.mindLogs, []),
    loadData<WaterLog[]>(KEYS.waterLogs, []),
    loadData<NutritionLog[]>(KEYS.nutritionLogs, []),
    loadData<StepLog[]>(KEYS.stepLogs, []),
  ]);

  const gymDays = new Set(workoutLogs.filter(l => inRange(l.date)).map(l => l.date)).size;
  const focus = mindLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.durationMinutes, 0);
  const water = waterLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.totalMl, 0);
  const cals = nutritionLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.macros.calories, 0);
  const steps = stepLogs.filter(l => inRange(l.date)).reduce((s, l) => s + l.steps, 0);

  return (
    gymDays >= goals.gymSessions &&
    focus >= goals.focusMinutes &&
    water >= goals.waterMlTotal &&
    cals >= goals.caloriesTotal &&
    steps >= goals.stepsTotal
  );
}

export async function refreshWeeklyStreak(): Promise<WeeklyStreakState> {
  const goals = await loadData<WeeklyGoals>(KEYS.weeklyGoals, DEFAULT_WEEKLY_GOALS);
  const streak = await loadData<WeeklyStreakState>(KEYS.weeklyStreak, {
    current: 0, best: 0, lastCheckedWeek: '',
  });

  const currentWeek = isoWeek();
  if (streak.lastCheckedWeek === currentWeek) return streak;

  const { mon, sun } = prevWeekBounds();
  const hit = await weekHitGoals(mon, sun, goals);

  let { current, best } = streak;
  if (hit) {
    current += 1;
    if (current > best) best = current;
  } else {
    current = 0;
  }

  const updated: WeeklyStreakState = { current, best, lastCheckedWeek: currentWeek };
  await saveData(KEYS.weeklyStreak, updated);
  return updated;
}
