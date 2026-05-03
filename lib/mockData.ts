import {
  saveData, loadData, KEYS, generateId,
  SleepLog, WaterLog, WeightLog, NutritionLog, StepLog,
  WorkoutLog, MindLog, SocialLog, Program, Person, MindActivity,
  DEFAULT_STAT_LEVELS,
} from './storage';
import { computeLevel } from './xp';

export async function generateRandomData(daysToGenerate: number = 7) {
  const dates: string[] = [];
  const today = new Date();
  
  // Generate last N days including today
  for (let i = daysToGenerate - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const sleepLogs: SleepLog[] = [];
  const waterLogs: WaterLog[] = [];
  const weightLogs: WeightLog[] = [];
  const nutritionLogs: NutritionLog[] = [];
  const workoutLogs: WorkoutLog[] = [];
  const mindLogs: MindLog[] = [];
  const socialLogs: SocialLog[] = [];
  const stepLogs: StepLog[] = [];

  const existingPrograms = await loadData<Program[]>(KEYS.programs, []);
  const existingPeople = await loadData<Person[]>(KEYS.people, []);
  const existingActivities = await loadData<MindActivity[]>(KEYS.mindActivities, []);

  const dummyProgram = existingPrograms.length ? existingPrograms[0] : { id: 'p1', name: 'Mock Program', days: [{ id: 'd1', label: 'Day 1', isRest: false, exercises: [] }] };
  const dummyPerson = existingPeople.length ? existingPeople[0] : { id: 's1', name: 'Alperen', type: 'Arkadaş', closeness: 8 };
  const dummyActivity = existingActivities.length ? existingActivities[0] : { id: 'm1', name: 'Kod Yazmak', statBoost: 'FOC' };

  let currentWeight = 75;

  dates.forEach((date) => {
    // Sleep: 5 to 9 hours (0.5 hour increments)
    const randomSleepHours = (Math.floor(Math.random() * 9) + 10) / 2; // e.g. 10/2 = 5.0 to 18/2 = 9.0
    sleepLogs.push({ id: generateId(), date, hours: randomSleepHours });

    // Water: 1000 to 3500 ml
    waterLogs.push({ id: generateId(), date, totalMl: Math.floor(Math.random() * 2500) + 1000 });

    // Weight: fluctuates by -0.3 to +0.3
    currentWeight += (Math.random() * 0.6) - 0.3;
    weightLogs.push({ id: generateId(), date, kg: parseFloat(currentWeight.toFixed(1)) });

    // Steps: 3000 to 15000
    stepLogs.push({ id: generateId(), date, steps: Math.floor(Math.random() * 12000) + 3000 });

    // Nutrition
    nutritionLogs.push({
      id: generateId(),
      date,
      foodId: 'f1',
      foodName: 'Chicken Breast & Rice',
      multiplier: 1,
      macros: { calories: Math.floor(Math.random() * 800) + 1800, carbs: 200, protein: 120, fat: 50, fiber: 20 }
    });

    // Workout: 70% chance to workout
    if (Math.random() > 0.3) {
      workoutLogs.push({
        id: generateId(), date,
        programId: dummyProgram.id, programName: dummyProgram.name,
        dayLabel: 'Day 1',
        sets: [],
        rpe: Math.floor(Math.random() * 4) + 6,
        avgDifficulty: Math.floor(Math.random() * 4) + 6
      });
    }

    // Mind: 80% chance
    if (Math.random() > 0.2) {
      mindLogs.push({
        id: generateId(), date,
        activityId: dummyActivity.id, activityName: dummyActivity.name, statBoost: dummyActivity.statBoost,
        durationMinutes: Math.floor(Math.random() * 120) + 30,
        feelingScore: Math.floor(Math.random() * 4) + 6
      });
    }

    // Social: 60% chance
    if (Math.random() > 0.4) {
      socialLogs.push({
        id: generateId(), date,
        personId: dummyPerson.id, personName: dummyPerson.name,
        minutes: Math.floor(Math.random() * 180) + 30
      });
    }
  });

  await saveData(KEYS.sleepLogs, sleepLogs);
  await saveData(KEYS.waterLogs, waterLogs);
  await saveData(KEYS.weightLogs, weightLogs);
  await saveData(KEYS.nutritionLogs, nutritionLogs);
  await saveData(KEYS.workoutLogs, workoutLogs);
  await saveData(KEYS.mindLogs, mindLogs);
  await saveData(KEYS.socialLogs, socialLogs);
  await saveData(KEYS.stepLogs, stepLogs);

  // Compute XP from generated logs using the same rules as the real app
  const DEFAULT_SLEEP_GOAL = 7.5;
  const DEFAULT_WATER_GOAL = 2500;

  let vitXp = 0;
  for (const l of sleepLogs) {
    vitXp += 10;
    if (l.hours >= DEFAULT_SLEEP_GOAL) vitXp += 15;
  }
  for (const l of waterLogs) {
    vitXp += 5;
    if (l.totalMl >= DEFAULT_WATER_GOAL) vitXp += 15;
  }

  let strXp = 0;
  for (const _ of workoutLogs) strXp += 20;
  for (const _ of stepLogs) strXp += 15;

  let focXp = 0;
  for (const l of mindLogs) {
    focXp += Math.min(Math.floor(l.durationMinutes / 5) * 2, 40);
  }

  let socXp = 0;
  for (const _ of socialLogs) socXp += 10;

  const vitResult = computeLevel(vitXp);
  const strResult = computeLevel(strXp);
  const focResult = computeLevel(focXp);
  const socResult = computeLevel(socXp);

  await saveData(KEYS.statLevels, {
    vit: { level: vitResult.level, xp: vitResult.xp },
    str: { level: strResult.level, xp: strResult.xp },
    foc: { level: focResult.level, xp: focResult.xp },
    soc: { level: socResult.level, xp: socResult.xp },
    dis: DEFAULT_STAT_LEVELS.dis,
  });
}
