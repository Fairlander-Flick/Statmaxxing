import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadData, saveData, KEYS, Goals, DEFAULT_GOALS } from './storage';

async function migrateWaterGoal(current: Goals): Promise<Goals> {
  const raw = await AsyncStorage.getItem('health:waterGoal');
  if (raw === null) return current;
  const parsed = parseInt(raw);
  await AsyncStorage.removeItem('health:waterGoal');
  if (!isNaN(parsed) && parsed > 0) return { ...current, waterMl: parsed };
  return current;
}

export function useGoals(): {
  goals: Goals;
  setGoal: <K extends keyof Goals>(key: K, value: Goals[K]) => Promise<void>;
} {
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => {
    (async () => {
      const stored = await loadData<Partial<Goals>>(KEYS.goalsConfig, {});
      let merged: Goals = { ...DEFAULT_GOALS, ...stored };
      merged = await migrateWaterGoal(merged);
      setGoals(merged);
      await saveData(KEYS.goalsConfig, merged);
    })();
  }, []);

  const setGoal = async <K extends keyof Goals>(key: K, value: Goals[K]) => {
    const updated = { ...goals, [key]: value };
    setGoals(updated);
    await saveData(KEYS.goalsConfig, updated);
  };

  return { goals, setGoal };
}
