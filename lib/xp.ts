import { loadData, saveData, KEYS, StatKey, StatLevels, DEFAULT_STAT_LEVELS, StatLevel } from './storage';

// threshold(level) = 750 + 250 * 2^(level-1)
// Level 1→2: 1000, 2→3: 1250, 3→4: 1750, 4→5: 2750, 5→6: 4750
export function xpToNextLevel(level: number): number {
  return 750 + 250 * Math.pow(2, level - 1);
}

export function computeLevel(totalXp: number): { level: number; xp: number; toNext: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level++;
  }
  return { level, xp: remaining, toNext: xpToNextLevel(level) };
}

export async function awardXP(
  stat: StatKey,
  amount: number
): Promise<{ levels: StatLevels; leveledUp: boolean; newLevel?: number }> {
  const levels = await loadData<StatLevels>(KEYS.statLevels, DEFAULT_STAT_LEVELS);
  const current: StatLevel = levels[stat] ?? { level: 1, xp: 0 };
  let { level, xp } = current;
  xp += amount;
  let leveledUp = false;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
    leveledUp = true;
  }

  levels[stat] = { level, xp };
  await saveData(KEYS.statLevels, levels);
  return { levels, leveledUp, newLevel: leveledUp ? level : undefined };
}

export function xpProgress(statLevel: StatLevel): number {
  return statLevel.xp / xpToNextLevel(statLevel.level);
}
