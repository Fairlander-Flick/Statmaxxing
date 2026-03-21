import Dexie, { type EntityTable } from 'dexie';

export interface UserGoals {
  id: number;
  dailyFocusMins: number;
  weeklyGymWorkouts: number;
  dailyWaterMl: number;
  dailySleepHours: number;
  dailySteps: number;
}

export interface DailyLog {
  id?: number;
  date: string; // YYYY-MM-DD format for easy querying
  sleepHours: number;
  waterMl: number;
  nutritionScore: number; // e.g., 1-10
  weight: number | null;
  focusMins: number;
  tasksCompleted: number;
  pagesRead: number;
  watchTimeMins: number;
  creationTimeMins: number;
  socialMins: number;
  newPeopleMet: number;
  outdoorActivities: number;
  routineCompletedPercentage: number;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutSession {
  id?: number;
  date: string; // YYYY-MM-DD
  programName: string;
  exercises: WorkoutExercise[];
  totalVolume: number;
}

export interface StatProgress {
  id?: number;
  date: string; // YYYY-MM-DD
  vit: number;
  str: number;
  foc: number;
  art: number;
  soc: number;
  dis: number;
}

const db = new Dexie('StatmaxxingDB') as Dexie & {
  goals: EntityTable<UserGoals, 'id'>;
  dailyLogs: EntityTable<DailyLog, 'id'>;
  workouts: EntityTable<WorkoutSession, 'id'>;
  statProgress: EntityTable<StatProgress, 'id'>;
};

// Schema declaration
db.version(1).stores({
  goals: 'id', // Usually just 1 record for current goals
  dailyLogs: '++id, date',
  workouts: '++id, date',
  statProgress: '++id, date'
});

export default db;
