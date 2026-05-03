# Gamification & Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stat levels/XP, a 5-stat pentagon chart, weekly goals + streak, streak calendar with journal, daily mood note, dashboard quick-log, water presets, weekly summary, and pattern insights — while removing ART as a playable stat.

**Architecture:** New pure-utility libs (`lib/xp.ts`, `lib/weeklyStats.ts`, `lib/patterns.ts`) handle computation. New presentational components (`components/PentagonChart.tsx`, `components/StreakCalendar.tsx`, `components/QuickLogModal.tsx`) keep index.tsx from growing out of control. All new storage keys follow the existing domain-namespaced convention. XP is awarded at write time (not back-filled).

**Tech Stack:** Expo + React Native Web, TypeScript, AsyncStorage via existing helpers, react-native-svg (already installed), no new packages needed.

**No test runner exists** — verification is done by running `npx expo start --web` and checking in the browser after each task.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `lib/storage.ts` | Add 4 new types + 5 new keys |
| Modify | `app/mind.tsx` | Remove ART from stat opts + activities |
| Create | `lib/xp.ts` | XP threshold curve, awardXP, level helpers |
| Create | `lib/weeklyStats.ts` | Weekly goal progress + streak computation |
| Create | `lib/patterns.ts` | Pearson correlation pattern detection |
| Create | `components/PentagonChart.tsx` | 5-stat SVG radar chart |
| Create | `components/StreakCalendar.tsx` | 90-day goal-hit grid |
| Create | `components/QuickLogModal.tsx` | Compact bottom-sheet for quick data entry |
| Modify | `app/health.tsx` | Water presets + XP on sleep/water save |
| Modify | `app/train.tsx` | XP on workout + step log |
| Modify | `app/social.tsx` | XP on social log save |
| Modify | `app/mind.tsx` | XP on focus session + task complete |
| Modify | `app/settings.tsx` | Weekly goals section |
| Modify | `app/index.tsx` | Pentagon, level badges, streak badge, calendar, note/mood card, quick-log, weekly summary, pattern insights |

---

## Task 1 — Remove ART as a Playable Stat

**Files:**
- Modify: `app/mind.tsx`

`colors.art` stays in ThemeContext (it's used for sleep UI elsewhere). We just stop using it as a selectable stat in Focus.

- [ ] **Step 1: Update DEFAULT_ACTIVITIES** — change Drawing and Music from ART → FOC

In `app/mind.tsx`, find and replace:
```typescript
const DEFAULT_ACTIVITIES: MindActivity[] = [
  { id: '1', name: 'Coding', statBoost: 'FOC' },
  { id: '2', name: 'Reading', statBoost: 'FOC' },
  { id: '3', name: 'Drawing', statBoost: 'FOC' },
  { id: '4', name: 'Music', statBoost: 'FOC' },
  { id: '5', name: 'Deep Work', statBoost: 'DIS' },
  { id: '6', name: 'Studying', statBoost: 'FOC' },
  { id: '7', name: 'Meditation', statBoost: 'VIT' },
];
```

- [ ] **Step 2: Remove ART from STAT_COLOR and STAT_OPTS**

```typescript
const STAT_COLOR: Record<string, string> = {
  FOC: colors.foc, DIS: colors.dis, VIT: colors.vit, SOC: colors.soc, STR: colors.str,
};
const STAT_OPTS = ['FOC', 'DIS', 'VIT', 'SOC', 'STR'];
```

- [ ] **Step 3: Fix timer session quality color** — `colors.art` was used for the timer save button. Change to `colors.foc`.

Find all occurrences of `colors.art` inside `app/mind.tsx` (lines ~664, 665, 673) and replace with `colors.foc`.

- [ ] **Step 4: Add migration shim** — existing stored activities with `statBoost: 'ART'` become `'FOC'` at load time. Replace the activities load line:

```typescript
loadData<MindActivity[]>(KEYS.mindActivities, DEFAULT_ACTIVITIES).then((acts) =>
  setActivities(acts.map(a => a.statBoost === 'ART' ? { ...a, statBoost: 'FOC' } : a))
);
```

- [ ] **Step 5: Verify** — open Focus screen, confirm ART is gone from the category picker. Existing ART activities should show as FOC.

- [ ] **Step 6: Commit**
```bash
git add app/mind.tsx
git commit -m "feat: remove ART stat, remap activities to FOC"
```

---

## Task 2 — New Storage Types

**Files:**
- Modify: `lib/storage.ts`

- [ ] **Step 1: Add StatKey type and new types** — append after `Goals` type:

```typescript
export type StatKey = 'vit' | 'str' | 'foc' | 'soc' | 'dis';

export type StatLevel = { level: number; xp: number };
export type StatLevels = Record<StatKey, StatLevel>;

export type WeeklyGoals = {
  focusMinutes: number;   // total focus minutes for the week
  gymSessions: number;    // number of days with a workout log
  waterMlTotal: number;   // total ml for the week
  caloriesTotal: number;  // total kcal for the week
  stepsTotal: number;     // total steps for the week
};

export type WeeklyStreakState = {
  current: number;
  best: number;
  lastCheckedWeek: string; // ISO week string e.g. "2026-W18"
};

export type DailyNote = {
  id: string;
  date: string;   // YYYY-MM-DD
  text: string;
  mood: number;   // 1–10
};
```

- [ ] **Step 2: Add new KEYS entries**

In the `KEYS` object, add:
```typescript
  // Settings / gamification
  statLevels:    'settings:statLevels',
  weeklyGoals:   'settings:weeklyGoals',
  weeklyStreak:  'settings:weeklyStreak',

  // Journal
  dailyNotes:    'mind:notes',
```

- [ ] **Step 3: Add default constants** — append after `DEFAULT_GOALS`:

```typescript
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
```

- [ ] **Step 4: Verify** — TypeScript should compile without errors. Open the app in browser, no crashes.

- [ ] **Step 5: Commit**
```bash
git add lib/storage.ts
git commit -m "feat: add StatLevels, WeeklyGoals, WeeklyStreak, DailyNote types to storage"
```

---

## Task 3 — `lib/xp.ts`

**Files:**
- Create: `lib/xp.ts`

- [ ] **Step 1: Create the file**

```typescript
import { loadData, saveData, KEYS, StatKey, StatLevels, DEFAULT_STAT_LEVELS, StatLevel } from './storage';

// XP needed to go from `level` to `level + 1`.
// threshold(level) = 750 + 250 * 2^(level-1)
// Level 1→2: 1000, 2→3: 1250, 3→4: 1750, 4→5: 2750, 5→6: 4750
export function xpToNextLevel(level: number): number {
  return 750 + 250 * Math.pow(2, level - 1);
}

// Given cumulative XP, compute current level and remaining XP within that level.
export function computeLevel(totalXp: number): { level: number; xp: number; toNext: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level++;
  }
  return { level, xp: remaining, toNext: xpToNextLevel(level) };
}

// Award XP to a stat. Returns updated StatLevels.
// Also returns whether a level-up occurred so the caller can show a toast.
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

// Progress fraction for the current level (0–1).
export function xpProgress(statLevel: StatLevel): number {
  return statLevel.xp / xpToNextLevel(statLevel.level);
}
```

- [ ] **Step 2: Verify** — no import errors when the file is referenced. Open app, no crash.

- [ ] **Step 3: Commit**
```bash
git add lib/xp.ts
git commit -m "feat: add XP/level utility (xp.ts)"
```

---

## Task 4 — `components/PentagonChart.tsx`

**Files:**
- Create: `components/PentagonChart.tsx`

The 5 stats are arranged clockwise from the top: VIT (top), STR (top-right), DIS (bottom-right), SOC (bottom-left), FOC (top-left).

- [ ] **Step 1: Create the directory and file**
```bash
mkdir -p /home/fairlander/Desktop/Code/Statmax/Statmaxxing/components
```

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';

export type PentagonStats = { vit: number; str: number; foc: number; soc: number; dis: number };

// Vertex order: top, top-right, bottom-right, bottom-left, top-left
const STAT_ORDER: (keyof PentagonStats)[] = ['vit', 'str', 'dis', 'soc', 'foc'];
const LABELS = ['VIT', 'STR', 'DIS', 'SOC', 'FOC'];

function pentagonPoints(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

function toSvgPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

interface Props {
  stats: PentagonStats;
  levels?: { vit: number; str: number; foc: number; soc: number; dis: number };
  size?: number;
}

export default function PentagonChart({ stats, levels, size = 240 }: Props) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const labelR = r + 22;

  // Background grid at 33%, 66%, 100%
  const gridLevels = [0.33, 0.66, 1.0];

  // Filled stat polygon
  const statPts = STAT_ORDER.map((stat, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const ratio = Math.min((stats[stat] ?? 0) / 100, 1);
    return [cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a)] as [number, number];
  });

  // Full vertices for grid + spokes
  const fullPts = pentagonPoints(cx, cy, r);

  // Stat colors per vertex
  const STAT_COLORS: Record<keyof PentagonStats, string> = {
    vit: colors.vit, str: colors.str, dis: colors.dis, soc: colors.soc, foc: colors.foc,
  };

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background grid pentagons */}
        {gridLevels.map((lvl, gi) => (
          <Polygon
            key={gi}
            points={toSvgPoints(pentagonPoints(cx, cy, r * lvl))}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Spokes from center to each vertex */}
        {fullPts.map(([x, y], i) => (
          <Line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke={colors.border} strokeWidth={1} />
        ))}

        {/* Filled stat area */}
        <Polygon
          points={toSvgPoints(statPts)}
          fill={colors.accent + '28'}
          stroke={colors.accent}
          strokeWidth={1.5}
        />

        {/* Vertex dots in stat color */}
        {statPts.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={4}
            fill={STAT_COLORS[STAT_ORDER[i]]}
            stroke={colors.bg}
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {/* Labels positioned around the pentagon */}
      {fullPts.map(([vx, vy], i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        const stat = STAT_ORDER[i];
        const lvl = levels?.[stat];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: lx - 22,
              top: ly - 12,
              width: 44,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: STAT_COLORS[stat], letterSpacing: 0.5 }}>
              {LABELS[i]}{lvl ? ` ${lvl}` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Verify** — no import errors. (Component will be used in Task 11.)

- [ ] **Step 3: Commit**
```bash
git add components/PentagonChart.tsx
git commit -m "feat: add PentagonChart SVG radar component"
```

---

## Task 5 — `lib/weeklyStats.ts`

**Files:**
- Create: `lib/weeklyStats.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  loadData, saveData, KEYS,
  WeeklyGoals, WeeklyStreakState, DEFAULT_WEEKLY_GOALS,
  WorkoutLog, MindLog, WaterLog, NutritionLog, StepLog,
} from './storage';

// Returns the ISO week string for a given date: "2026-W18"
export function isoWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Returns Mon and Sun of the ISO week containing `date` as YYYY-MM-DD strings.
export function weekBounds(date: Date = new Date()): { mon: string; sun: string } {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  const mon = d.toISOString().split('T')[0];
  d.setDate(d.getDate() + 6);
  const sun = d.toISOString().split('T')[0];
  return { mon, sun };
}

// Returns the Mon/Sun of the *previous* ISO week.
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

// Compute this week's progress from all log arrays.
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

// Check if a given week (by bounds) hit all weekly goals.
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

// Call on app load to update the streak (checks if last week was complete).
export async function refreshWeeklyStreak(): Promise<WeeklyStreakState> {
  const goals = await loadData<WeeklyGoals>(KEYS.weeklyGoals, DEFAULT_WEEKLY_GOALS);
  const streak = await loadData<WeeklyStreakState>(KEYS.weeklyStreak, {
    current: 0, best: 0, lastCheckedWeek: '',
  });

  const currentWeek = isoWeek();
  if (streak.lastCheckedWeek === currentWeek) return streak;

  const { mon, sun } = prevWeekBounds();
  const prevWeek = isoWeek(new Date(mon));
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
```

- [ ] **Step 2: Verify** — no TypeScript errors, app loads without crash.

- [ ] **Step 3: Commit**
```bash
git add lib/weeklyStats.ts
git commit -m "feat: add weekly stats and streak utilities"
```

---

## Task 6 — `lib/patterns.ts`

**Files:**
- Create: `lib/patterns.ts`

- [ ] **Step 1: Create the file**

```typescript
import { loadData, KEYS, SleepLog, MindLog, WorkoutLog, DailyNote } from './storage';

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0),
  );
  return den === 0 ? 0 : num / den;
}

export type Insight = { text: string; r: number };

export async function computeInsights(): Promise<Insight[]> {
  const [sleepLogs, mindLogs, workoutLogs, notes] = await Promise.all([
    loadData<SleepLog[]>(KEYS.sleepLogs, []),
    loadData<MindLog[]>(KEYS.mindLogs, []),
    loadData<WorkoutLog[]>(KEYS.workoutLogs, []),
    loadData<DailyNote[]>(KEYS.dailyNotes, []),
  ]);

  if (sleepLogs.length < 14) return [];

  const allDates = [...new Set([...sleepLogs, ...mindLogs].map(l => l.date))].sort();
  if (allDates.length < 14) return [];

  const insights: Insight[] = [];

  // Insight 1: sleep hours vs next-day focus minutes
  const sleepMap = Object.fromEntries(sleepLogs.map(l => [l.date, l.hours]));
  const focusMap: Record<string, number> = {};
  mindLogs.forEach(l => { focusMap[l.date] = (focusMap[l.date] ?? 0) + l.durationMinutes; });

  const pairs1 = allDates.slice(0, -1).flatMap(date => {
    const nextDate = allDates[allDates.indexOf(date) + 1];
    const s = sleepMap[date];
    const f = focusMap[nextDate];
    return s !== undefined && f !== undefined ? [{ s, f }] : [];
  });
  if (pairs1.length >= 10) {
    const r1 = pearson(pairs1.map(p => p.s), pairs1.map(p => p.f));
    if (Math.abs(r1) > 0.4) {
      const direction = r1 > 0 ? 'daha fazla' : 'daha az';
      insights.push({
        text: `8h+ uyuduğun günlerin ertesinde FOC ${direction} oluyor. Korelasyon: ${(r1 * 100).toFixed(0)}%`,
        r: r1,
      });
    }
  }

  // Insight 2: workout day vs next-day mood score
  if (notes.length >= 10) {
    const moodMap = Object.fromEntries(notes.map(n => [n.date, n.mood]));
    const workoutDates = new Set(workoutLogs.map(l => l.date));
    const pairs2 = allDates.slice(0, -1).flatMap(date => {
      const nextDate = allDates[allDates.indexOf(date) + 1];
      const worked = workoutDates.has(date) ? 1 : 0;
      const mood = moodMap[nextDate];
      return mood !== undefined ? [{ worked, mood }] : [];
    });
    if (pairs2.length >= 10) {
      const r2 = pearson(pairs2.map(p => p.worked), pairs2.map(p => p.mood));
      if (Math.abs(r2) > 0.4) {
        insights.push({
          text: `Antrenman yaptığın günlerin ertesinde ruh halin ortalama ${r2 > 0 ? 'daha iyi' : 'daha kötü'} görünüyor.`,
          r: r2,
        });
      }
    }
  }

  return insights.slice(0, 2);
}
```

- [ ] **Step 2: Verify** — no TypeScript errors, app loads without crash.

- [ ] **Step 3: Commit**
```bash
git add lib/patterns.ts
git commit -m "feat: add Pearson correlation pattern detection"
```

---

## Task 7 — XP on Health Logs + Water Preset Buttons

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Add import** — add `awardXP` import at top of `app/health.tsx`:
```typescript
import { awardXP } from '../lib/xp';
```

- [ ] **Step 2: Award VIT XP on sleep save** — find the `saveSleep` function and add XP after the `appendToList` call:
```typescript
// After saving the sleep log, add XP
await awardXP('vit', 10);
if (parseFloat(sleepInput) >= goals.sleepHours) await awardXP('vit', 15);
```

- [ ] **Step 3: Award VIT XP on water save** — find the water save function and add:
```typescript
await awardXP('vit', 5);
const todayWater = /* existing computed today's water total */ + addedMl;
if (todayWater >= goals.waterMl) await awardXP('vit', 15);
```

Note: the exact variable names depend on the current water save implementation. Open `app/health.tsx` around line 150-200 and find the save handler, insert the XP award after the `appendToList` or `saveData` call.

- [ ] **Step 4: Add water preset buttons** — in the Water tab UI, above the existing input field, add three quick-add buttons:

Find the water input section and prepend:
```typescript
{/* Quick add buttons */}
<View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
  {[250, 500, 750].map(ml => (
    <TouchableOpacity
      key={ml}
      onPress={async () => {
        // Load today's water log, add ml, save
        const logs = await loadData<WaterLog[]>(KEYS.waterLogs, []);
        const existing = logs.find(l => l.date === today);
        if (existing) {
          const updated = logs.map(l =>
            l.date === today ? { ...l, totalMl: l.totalMl + ml } : l
          );
          await saveData(KEYS.waterLogs, updated);
        } else {
          await appendToList<WaterLog>(KEYS.waterLogs, {
            id: generateId(), date: today, totalMl: ml,
          });
        }
        await awardXP('vit', 5);
        // Reload state
        loadData<WaterLog[]>(KEYS.waterLogs, []).then(setWaterLogs);
      }}
      style={{
        flex: 1, paddingVertical: 10, borderRadius: 8,
        backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.vit }}>+{ml}ml</Text>
    </TouchableOpacity>
  ))}
</View>
```

(You will need to check the exact state variable names in the water tab — `waterLogs`, `setWaterLogs`, `today`, etc. — and match them.)

- [ ] **Step 5: Verify** — open Health → Sleep tab, log sleep, confirm no crash. Open Water tab, confirm +250/+500/+750 buttons appear and work.

- [ ] **Step 6: Commit**
```bash
git add app/health.tsx
git commit -m "feat: award VIT XP on sleep/water log, add water preset buttons"
```

---

## Task 8 — XP on Train Logs

**Files:**
- Modify: `app/train.tsx`

- [ ] **Step 1: Add import**
```typescript
import { awardXP } from '../lib/xp';
```

- [ ] **Step 2: Award STR XP on workout save** — find where a `WorkoutLog` is appended (look for `appendToList<WorkoutLog>`) and add after:
```typescript
await awardXP('str', 20);
```

- [ ] **Step 3: Award STR XP on step save** — find where a `StepLog` is saved and add after:
```typescript
await awardXP('str', 15);
// If step goal is hit, bonus already counted — optionally add a goal-hit bonus:
// if (savedSteps >= goals.steps) await awardXP('str', 10);
```

- [ ] **Step 4: Verify** — log a workout and steps, confirm no crash.

- [ ] **Step 5: Commit**
```bash
git add app/train.tsx
git commit -m "feat: award STR XP on workout and step log"
```

---

## Task 9 — XP on Social Logs

**Files:**
- Modify: `app/social.tsx`

- [ ] **Step 1: Add import**
```typescript
import { awardXP } from '../lib/xp';
```

- [ ] **Step 2: Award SOC XP on social log save** — find where a `SocialLog` is appended and add after:
```typescript
await awardXP('soc', 10);
```

- [ ] **Step 3: Verify** — log social time, no crash.

- [ ] **Step 4: Commit**
```bash
git add app/social.tsx
git commit -m "feat: award SOC XP on social time log"
```

---

## Task 10 — XP on Mind Logs

**Files:**
- Modify: `app/mind.tsx`

- [ ] **Step 1: Add import**
```typescript
import { awardXP } from '../lib/xp';
```

- [ ] **Step 2: Award FOC XP on session save** — find `saveSession` and `saveManualSession` functions, add after the `appendToList<MindLog>` call:
```typescript
// Award 2 XP per 5 minutes of focus, capped at 40 XP
const xpEarned = Math.min(Math.floor(log.durationMinutes / 5) * 2, 40);
if (xpEarned > 0) await awardXP('foc', xpEarned);
```

- [ ] **Step 3: Award FOC XP on task completion** — in `toggleTask`, after saving:
```typescript
// Award XP when marking a task done
if (!tasks.find(t => t.id === id)?.done) { // was not done, is now done
  await awardXP('foc', 8);
}
```

Note: read the current `done` value before toggling to detect direction. The cleanest place is in the `toggleTask` function body, before the state update:
```typescript
const toggleTask = async (id: string) => {
  const task = tasks.find(t => t.id === id);
  const updated = tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
  await saveData(KEYS.focusTasks, updated);
  setTasks(updated);
  if (activeTaskId === id) setActiveTaskId(null);
  // Award XP when completing (not when un-completing)
  if (task && !task.done) await awardXP('foc', 8);
};
```

- [ ] **Step 4: Verify** — complete a focus session, confirm no crash.

- [ ] **Step 5: Commit**
```bash
git add app/mind.tsx
git commit -m "feat: award FOC XP on focus session save and task completion"
```

---

## Task 11 — Dashboard: Pentagon Chart + Stat Level Badges

**Files:**
- Modify: `app/index.tsx`

This task adds the pentagon chart and stat level display to the dashboard. The pentagon replaces nothing — it's added as a new card near the top of the content.

- [ ] **Step 1: Add imports** at the top of `app/index.tsx`:
```typescript
import PentagonChart, { PentagonStats } from '../components/PentagonChart';
import { StatLevels, DEFAULT_STAT_LEVELS, KEYS as STORAGE_KEYS, WeeklyStreakState } from '../lib/storage';
import { xpProgress, xpToNextLevel } from '../lib/xp';
```

Note: `KEYS` is already imported as `KEYS` from `'../lib/storage'`. The new `StatLevels` etc. need to be added to that import.

Update the existing storage import line to include the new types:
```typescript
import {
  loadData, KEYS, toDay,
  SleepLog, WaterLog, WeightLog, WorkoutLog, MindLog, SocialLog, NutritionLog, StepLog,
  StatLevels, DEFAULT_STAT_LEVELS, Goals,
} from '../lib/storage';
```

- [ ] **Step 2: Add state** — inside `DashboardScreen`, add:
```typescript
const [statLevels, setStatLevels] = useState<StatLevels>(DEFAULT_STAT_LEVELS);
```

- [ ] **Step 3: Load stat levels** — inside `computeStats`, add:
```typescript
const levels = await loadData<StatLevels>(KEYS.statLevels, DEFAULT_STAT_LEVELS);
setStatLevels(levels);
```

- [ ] **Step 4: Compute per-stat scores** — add this function before `DashboardScreen` (after `computeDayScore`):
```typescript
function computeStatScores(
  sleep: number | null, water: number, steps: number,
  workout: number, mindMins: number, socialMins: number,
  goals: Goals,
): PentagonStats {
  const sleepPct  = goals.sleepHours > 0  ? Math.min((sleep ?? 0) / goals.sleepHours, 1) : 0;
  const waterPct  = goals.waterMl > 0     ? Math.min(water / goals.waterMl, 1) : 0;
  const stepsPct  = goals.steps > 0       ? Math.min(steps / goals.steps, 1) : 0;
  const focusPct  = goals.focusMinutes > 0 ? Math.min(mindMins / goals.focusMinutes, 1) : 0;
  const workout01 = workout > 0 ? 1 : 0;
  const socPct    = Math.min(socialMins / 60, 1);
  const dis       = (sleepPct + waterPct + stepsPct + focusPct + workout01) / 5;

  return {
    vit: Math.round((sleepPct * 0.5 + waterPct * 0.5) * 100),
    str: Math.round((stepsPct * 0.5 + workout01 * 0.5) * 100),
    foc: Math.round(focusPct * 100),
    soc: Math.round(socPct * 100),
    dis: Math.round(dis * 100),
  };
}
```

- [ ] **Step 5: Add the pentagon card to the JSX** — find the main `ScrollView` content in the dashboard (after the header section, before the graph selector) and insert:

```typescript
{/* ── Pentagon + Levels ── */}
<View style={[gs.card, { alignItems: 'center', paddingVertical: 24, marginBottom: 16 }]}>
  <Text style={[gs.sectionTitle, { marginBottom: 16, alignSelf: 'flex-start' }]}>Stat Profile</Text>
  <PentagonChart
    stats={computeStatScores(
      todaySummary.sleep, todaySummary.water, todaySummary.steps,
      todaySummary.workouts, todaySummary.mindMins, todaySummary.socialMins,
      goals,
    )}
    levels={{
      vit: statLevels.vit.level,
      str: statLevels.str.level,
      foc: statLevels.foc.level,
      soc: statLevels.soc.level,
      dis: statLevels.dis.level,
    }}
    size={isDesktop ? 280 : 240}
  />

  {/* XP bars row */}
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, width: '100%' }}>
    {(['vit', 'str', 'foc', 'soc', 'dis'] as const).map(stat => {
      const sl = statLevels[stat];
      const pct = xpProgress(sl);
      const statColor = colors[stat];
      const label = stat.toUpperCase();
      return (
        <View key={stat} style={{ flex: 1, minWidth: 80 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: statColor, letterSpacing: 0.5 }}>{label}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Lv.{sl.level}</Text>
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${Math.round(pct * 100)}%`, height: 4, borderRadius: 2, backgroundColor: statColor }} />
          </View>
        </View>
      );
    })}
  </View>
</View>
```

- [ ] **Step 6: Verify** — open dashboard, confirm pentagon chart appears with 5 axes and XP bars below. Stat profile card should show today's performance.

- [ ] **Step 7: Commit**
```bash
git add app/index.tsx components/PentagonChart.tsx
git commit -m "feat: add pentagon stat profile chart and XP level bars to dashboard"
```

---

## Task 12 — Dashboard: Weekly Streak Badge

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add imports**
```typescript
import { refreshWeeklyStreak, computeThisWeekProgress } from '../lib/weeklyStats';
import { WeeklyStreakState, WeeklyGoals, DEFAULT_WEEKLY_GOALS } from '../lib/storage';
```

(Add `WeeklyStreakState`, `WeeklyGoals`, `DEFAULT_WEEKLY_GOALS` to the storage import line.)

- [ ] **Step 2: Add state**
```typescript
const [weeklyStreak, setWeeklyStreak] = useState<WeeklyStreakState>({ current: 0, best: 0, lastCheckedWeek: '' });
const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);
const [weekProgress, setWeekProgress] = useState<{ focusMinutes: number; gymSessions: number; waterMlTotal: number; caloriesTotal: number; stepsTotal: number }>({ focusMinutes: 0, gymSessions: 0, waterMlTotal: 0, caloriesTotal: 0, stepsTotal: 0 });
```

- [ ] **Step 3: Load in computeStats**
```typescript
const [streak, wGoals, wProg] = await Promise.all([
  refreshWeeklyStreak(),
  loadData<WeeklyGoals>(KEYS.weeklyGoals, DEFAULT_WEEKLY_GOALS),
  computeThisWeekProgress(),
]);
setWeeklyStreak(streak);
setWeeklyGoals(wGoals);
setWeekProgress(wProg);
```

- [ ] **Step 4: Add streak badge to dashboard header** — find the header area (where `greeting` and `dateStr` are rendered) and add a streak badge after the score display:

```typescript
{weeklyStreak.current > 0 && (
  <View style={{
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: colors.orange + '20', marginTop: 8, alignSelf: 'flex-start',
  }}>
    <Text style={{ fontSize: 14 }}>🔥</Text>
    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.orange }}>
      {weeklyStreak.current}-week streak
    </Text>
  </View>
)}
```

- [ ] **Step 5: Verify** — open dashboard, streak badge shows if current > 0.

- [ ] **Step 6: Commit**
```bash
git add app/index.tsx lib/weeklyStats.ts
git commit -m "feat: add weekly streak badge to dashboard"
```

---

## Task 13 — `components/StreakCalendar.tsx`

**Files:**
- Create: `components/StreakCalendar.tsx`

- [ ] **Step 1: Create the file**

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeContext';
import { DailyNote } from '../lib/storage';

export type DayData = {
  date: string;        // YYYY-MM-DD
  goalsHit: number;   // 0–5 (how many of the 5 tracked daily goals were met)
  totalGoals: number; // usually 5
  note?: DailyNote;
  focusMins?: number;
  steps?: number;
  sleepHours?: number | null;
};

interface Props {
  days: DayData[];   // last 90 days, oldest first
}

function cellColor(goalsHit: number, total: number, colors: any): string {
  if (total === 0 || goalsHit === 0) return colors.surfaceAlt;
  const ratio = goalsHit / total;
  if (ratio < 0.4) return colors.dis + '30';
  if (ratio < 0.7) return colors.dis + '60';
  if (ratio < 1.0) return colors.dis + '90';
  return colors.dis;
}

export default function StreakCalendar({ days }: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<DayData | null>(null);

  // Split into weeks (7 days each)
  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => (
                <TouchableOpacity
                  key={di}
                  onPress={() => setSelected(day)}
                  style={{
                    width: 14, height: 14, borderRadius: 3,
                    backgroundColor: cellColor(day.goalsHit, day.totalGoals, colors),
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24, paddingBottom: 40,
              borderTopWidth: 1, borderTopColor: colors.border,
            }}>
              {selected && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      {new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => setSelected(null)}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Goals hit */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
                      backgroundColor: colors.dis + '20',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.dis }}>
                        {selected.goalsHit}/{selected.totalGoals} goals
                      </Text>
                    </View>
                  </View>

                  {/* Quick stats */}
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    {selected.sleepHours != null && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.vit }}>{selected.sleepHours}h</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>sleep</Text>
                      </View>
                    )}
                    {(selected.steps ?? 0) > 0 && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.str }}>{selected.steps?.toLocaleString()}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>steps</Text>
                      </View>
                    )}
                    {(selected.focusMins ?? 0) > 0 && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foc }}>{selected.focusMins}m</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>focus</Text>
                      </View>
                    )}
                  </View>

                  {/* Journal note */}
                  {selected.note ? (
                    <View style={{
                      padding: 14, borderRadius: 10,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1, borderColor: colors.border,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>JOURNAL</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {Array.from({ length: 10 }, (_, i) => (
                            <View
                              key={i}
                              style={{
                                width: 6, height: 6, borderRadius: 3,
                                backgroundColor: i < selected.note!.mood ? colors.accent : colors.border,
                              }}
                            />
                          ))}
                        </View>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>{selected.note.mood}/10</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                        {selected.note.text}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>
                      No journal note for this day.
                    </Text>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 2: Verify** — no TypeScript errors.

- [ ] **Step 3: Commit**
```bash
git add components/StreakCalendar.tsx
git commit -m "feat: add StreakCalendar component with day detail modal"
```

---

## Task 14 — Dashboard: Integrate Streak Calendar

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add import**
```typescript
import StreakCalendar, { DayData } from '../components/StreakCalendar';
import { DailyNote } from '../lib/storage';
```

(Add `DailyNote` to the storage import.)

- [ ] **Step 2: Add state**
```typescript
const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
```

- [ ] **Step 3: Compute calendar data inside `computeStats`** — add at the end of `computeStats`, after the per-graph data:

```typescript
// Load daily notes
const notes = await loadData<DailyNote[]>(KEYS.dailyNotes, []);
setDailyNotes(notes);

// Build 90-day calendar data
const last90 = Array.from({ length: 90 }, (_, i) => getDateBefore(89 - i));
const calDays: DayData[] = last90.map(date => {
  const dSleep  = sleepLogs.find(l => l.date === date)?.hours ?? null;
  const dWater  = waterLogs.find(l => l.date === date)?.totalMl ?? 0;
  const dSteps  = stepLogs.find(l => l.date === date)?.steps ?? 0;
  const dWork   = workoutLogs.some(l => l.date === date);
  const dFocus  = mindLogs.filter(l => l.date === date).reduce((s, l) => s + l.durationMinutes, 0);

  let goalsHit = 0;
  if (dSleep !== null && dSleep >= goals.sleepHours) goalsHit++;
  if (dWater >= goals.waterMl) goalsHit++;
  if (dSteps >= goals.steps) goalsHit++;
  if (dWork) goalsHit++;
  if (dFocus >= goals.focusMinutes) goalsHit++;

  return {
    date, goalsHit, totalGoals: 5,
    note: notes.find(n => n.date === date),
    sleepHours: dSleep,
    steps: dSteps,
    focusMins: dFocus,
  };
});
setCalendarDays(calDays);
```

- [ ] **Step 4: Add calendar section to JSX** — after the pentagon card, add:
```typescript
{/* ── Streak Calendar ── */}
<View style={[gs.card, { marginBottom: 16 }]}>
  <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>History</Text>
  <StreakCalendar days={calendarDays} />
  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
    <Text style={{ fontSize: 10, color: colors.textMuted }}>less</Text>
    {[0, 0.3, 0.6, 0.9, 1].map((r, i) => (
      <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: r === 0 ? colors.surfaceAlt : colors.dis + Math.round(r * 255).toString(16).padStart(2, '0') }} />
    ))}
    <Text style={{ fontSize: 10, color: colors.textMuted }}>more</Text>
  </View>
</View>
```

- [ ] **Step 5: Verify** — dashboard shows 90-day calendar grid. Tapping a cell opens the detail modal with stats and journal note (if any).

- [ ] **Step 6: Commit**
```bash
git add app/index.tsx
git commit -m "feat: integrate 90-day streak calendar into dashboard"
```

---

## Task 15 — Dashboard: Daily Note + Mood Card

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add state** — already have `dailyNotes` from Task 14. Add:
```typescript
const [noteText, setNoteText] = useState('');
const [noteMood, setNoteMood] = useState(7);
const [noteSaved, setNoteSaved] = useState(false);
```

- [ ] **Step 2: Pre-fill today's note** — in `computeStats`, after loading notes:
```typescript
const todayNote = notes.find(n => n.date === today);
if (todayNote) {
  setNoteText(todayNote.text);
  setNoteMood(todayNote.mood);
}
```

- [ ] **Step 3: Add save function** — inside `DashboardScreen`:
```typescript
const saveDailyNote = async () => {
  if (!noteText.trim()) return;
  const notes = await loadData<DailyNote[]>(KEYS.dailyNotes, []);
  const existing = notes.find(n => n.date === today);
  let updated: DailyNote[];
  if (existing) {
    updated = notes.map(n => n.date === today ? { ...n, text: noteText.trim(), mood: noteMood } : n);
  } else {
    updated = [...notes, { id: generateId(), date: today, text: noteText.trim(), mood: noteMood }];
  }
  await saveData(KEYS.dailyNotes, updated);
  setDailyNotes(updated);
  setNoteSaved(true);
  setTimeout(() => setNoteSaved(false), 2000);
};
```

(Import `generateId` from storage if not already imported.)

- [ ] **Step 4: Add the journal card to JSX** — after the streak calendar card:
```typescript
{/* ── Daily Note + Mood ── */}
<View style={[gs.card, { marginBottom: 16 }]}>
  <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>Today's Note</Text>

  {/* Mood picker */}
  <Text style={[gs.label, { marginBottom: 8 }]}>How are you feeling? {noteMood}/10</Text>
  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
      <TouchableOpacity
        key={n}
        onPress={() => setNoteMood(n)}
        style={{
          width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
          backgroundColor: noteMood === n ? colors.accent : colors.surfaceAlt,
          borderWidth: 1, borderColor: noteMood === n ? colors.accent : colors.border,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: noteMood === n ? '#fff' : colors.textSub }}>{n}</Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Text input */}
  <TextInput
    style={[gs.input, { color: colors.text, minHeight: 72, textAlignVertical: 'top' }]}
    placeholder="Write a note about today..."
    placeholderTextColor={colors.textMuted}
    multiline
    value={noteText}
    onChangeText={setNoteText}
  />

  <TouchableOpacity
    onPress={saveDailyNote}
    disabled={!noteText.trim()}
    style={[gs.btnPrimary, { marginTop: 12, opacity: noteText.trim() ? 1 : 0.4 }]}
  >
    <Text style={gs.btnPrimaryText}>{noteSaved ? 'Saved ✓' : 'Save Note'}</Text>
  </TouchableOpacity>
</View>
```

- [ ] **Step 5: Add missing imports** — ensure `TextInput` and `generateId` are imported at the top of `index.tsx`:
```typescript
import { ..., TextInput } from 'react-native';
import { loadData, saveData, ..., generateId, DailyNote } from '../lib/storage';
```

- [ ] **Step 6: Verify** — open dashboard, write a note, set mood, tap Save. Reload (pull-to-refresh), note should persist. Tap a calendar cell for that day — note appears in modal.

- [ ] **Step 7: Commit**
```bash
git add app/index.tsx
git commit -m "feat: add daily note and mood card to dashboard"
```

---

## Task 16 — Dashboard: Quick-Log Modals

**Files:**
- Create: `components/QuickLogModal.tsx`
- Modify: `app/index.tsx`

- [ ] **Step 1: Create `components/QuickLogModal.tsx`**

```typescript
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  unit: string;
  presets?: number[];
  onSave: (value: number) => void;
  onClose: () => void;
}

export default function QuickLogModal({ visible, title, unit, presets, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const gs = makeGlobalStyles(colors);
  const [input, setInput] = useState('');

  const handleSave = () => {
    const v = parseFloat(input);
    if (isNaN(v) || v <= 0) return;
    onSave(v);
    setInput('');
    onClose();
  };

  const handlePreset = (v: number) => {
    onSave(v);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingBottom: 40,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>{title}</Text>

            {presets && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {presets.map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handlePreset(p)}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: 10,
                      backgroundColor: colors.accentDim, alignItems: 'center',
                      borderWidth: 1, borderColor: colors.accent + '40',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent }}>
                      +{p} {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                style={[gs.input, { flex: 1, color: colors.text }]}
                placeholder={`Enter ${unit}...`}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSave}
              />
              <TouchableOpacity
                onPress={handleSave}
                style={[gs.btnPrimary, { paddingHorizontal: 20 }]}
              >
                <Text style={gs.btnPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
```

- [ ] **Step 2: Add imports in `index.tsx`**
```typescript
import QuickLogModal from '../components/QuickLogModal';
import { appendToList, saveData, WaterLog, SleepLog, StepLog } from '../lib/storage';
import { awardXP } from '../lib/xp';
```

(Add any missing types to the existing storage import line.)

- [ ] **Step 3: Add modal state**
```typescript
const [quickLogModal, setQuickLogModal] = useState<'water' | 'sleep' | 'steps' | null>(null);
```

- [ ] **Step 4: Add save handlers**
```typescript
const quickLogWater = async (ml: number) => {
  const logs = await loadData<WaterLog[]>(KEYS.waterLogs, []);
  const existing = logs.find(l => l.date === today);
  if (existing) {
    await saveData(KEYS.waterLogs, logs.map(l => l.date === today ? { ...l, totalMl: l.totalMl + ml } : l));
  } else {
    await appendToList<WaterLog>(KEYS.waterLogs, { id: generateId(), date: today, totalMl: ml });
  }
  await awardXP('vit', 5);
  await computeStats();
};

const quickLogSleep = async (hours: number) => {
  const logs = await loadData<SleepLog[]>(KEYS.sleepLogs, []);
  const filtered = logs.filter(l => l.date !== today);
  await saveData(KEYS.sleepLogs, [...filtered, { id: generateId(), date: today, hours }]);
  await awardXP('vit', 10);
  await computeStats();
};

const quickLogSteps = async (steps: number) => {
  const logs = await loadData<StepLog[]>(KEYS.stepLogs, []);
  const filtered = logs.filter(l => l.date !== today);
  await saveData(KEYS.stepLogs, [...filtered, { id: generateId(), date: today, steps }]);
  await awardXP('str', 15);
  await computeStats();
};
```

- [ ] **Step 5: Make the today-chips tappable** — find the `TodayChip` components in the JSX and wrap them in `TouchableOpacity`:

For the water chip:
```typescript
<TouchableOpacity onPress={() => setQuickLogModal('water')}>
  <TodayChip icon="water-outline" color={colors.vit} actual={todaySummary.water / 1000} goal={goals.waterMl / 1000} unit="L" />
</TouchableOpacity>
```

For the sleep chip:
```typescript
<TouchableOpacity onPress={() => setQuickLogModal('sleep')}>
  <TodayChip icon="moon-outline" color={colors.art} actual={todaySummary.sleep} goal={goals.sleepHours} unit="h" />
</TouchableOpacity>
```

For the steps chip (if it exists):
```typescript
<TouchableOpacity onPress={() => setQuickLogModal('steps')}>
  <TodayChip ... />
</TouchableOpacity>
```

- [ ] **Step 6: Add modals to JSX** — before the closing `</SafeAreaView>`:
```typescript
<QuickLogModal
  visible={quickLogModal === 'water'}
  title="Log Water"
  unit="ml"
  presets={[250, 500, 750]}
  onSave={quickLogWater}
  onClose={() => setQuickLogModal(null)}
/>
<QuickLogModal
  visible={quickLogModal === 'sleep'}
  title="Log Sleep"
  unit="hours"
  onSave={quickLogSleep}
  onClose={() => setQuickLogModal(null)}
/>
<QuickLogModal
  visible={quickLogModal === 'steps'}
  title="Log Steps"
  unit="steps"
  onSave={quickLogSteps}
  onClose={() => setQuickLogModal(null)}
/>
```

- [ ] **Step 7: Verify** — tap a today-chip on the dashboard, modal opens, enter a value, data updates.

- [ ] **Step 8: Commit**
```bash
git add components/QuickLogModal.tsx app/index.tsx
git commit -m "feat: add quick-log modals for water, sleep, steps from dashboard"
```

---

## Task 17 — Dashboard: Weekly Summary Card

**Files:**
- Modify: `app/index.tsx`

The weekly summary data is already computed in `weeklySummary` and `lastWeekSummary` state. This task just adds a card to display it alongside weekly goals progress.

- [ ] **Step 1: Add weekly summary card to JSX** — after the daily note card:

```typescript
{/* ── Weekly Summary ── */}
<View style={[gs.card, { marginBottom: 16 }]}>
  <Text style={[gs.sectionTitle, { marginBottom: 14 }]}>This Week</Text>
  {[
    {
      label: 'Focus', thisWeek: weekProgress.focusMinutes, goal: weeklyGoals.focusMinutes,
      lastWeek: lastWeekSummary.mindMins, unit: 'min', color: colors.foc,
    },
    {
      label: 'Gym', thisWeek: weekProgress.gymSessions, goal: weeklyGoals.gymSessions,
      lastWeek: lastWeekSummary.workouts, unit: 'days', color: colors.str,
    },
    {
      label: 'Water', thisWeek: Math.round(weekProgress.waterMlTotal / 1000 * 10) / 10,
      goal: weeklyGoals.waterMlTotal / 1000, lastWeek: 0, unit: 'L', color: colors.vit,
    },
    {
      label: 'Steps', thisWeek: weekProgress.stepsTotal, goal: weeklyGoals.stepsTotal,
      lastWeek: lastWeekSummary.steps, unit: '', color: colors.dis,
    },
  ].map(row => {
    const pct = row.goal > 0 ? Math.min(row.thisWeek / row.goal, 1) : 0;
    const delta = row.lastWeek > 0 ? row.thisWeek - row.lastWeek : null;
    return (
      <View key={row.label} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: colors.textSub }}>{row.label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {delta !== null && delta !== 0 && (
              <Text style={{ fontSize: 11, color: delta > 0 ? colors.green : colors.red }}>
                {delta > 0 ? '+' : ''}{typeof delta === 'number' && delta % 1 !== 0 ? delta.toFixed(1) : delta} {row.unit}
              </Text>
            )}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
              {typeof row.thisWeek === 'number' && row.thisWeek % 1 !== 0 ? row.thisWeek.toFixed(1) : row.thisWeek} / {typeof row.goal === 'number' && row.goal % 1 !== 0 ? row.goal.toFixed(1) : row.goal} {row.unit}
            </Text>
          </View>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt }}>
          <View style={{ width: `${Math.round(pct * 100)}%`, height: 4, borderRadius: 2, backgroundColor: row.color }} />
        </View>
      </View>
    );
  })}
</View>
```

- [ ] **Step 2: Verify** — weekly summary card shows this week's progress bars and delta vs last week.

- [ ] **Step 3: Commit**
```bash
git add app/index.tsx
git commit -m "feat: add weekly summary card with goal progress to dashboard"
```

---

## Task 18 — Dashboard: Pattern Insights Card

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add import**
```typescript
import { computeInsights, Insight } from '../lib/patterns';
```

- [ ] **Step 2: Add state**
```typescript
const [insights, setInsights] = useState<Insight[]>([]);
```

- [ ] **Step 3: Load in computeStats**
```typescript
const ins = await computeInsights();
setInsights(ins);
```

- [ ] **Step 4: Add insights card** — after the weekly summary card:
```typescript
{insights.length > 0 && (
  <View style={[gs.card, { marginBottom: 16 }]}>
    <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>Insights</Text>
    {insights.map((ins, i) => (
      <View key={i} style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        marginBottom: i < insights.length - 1 ? 12 : 0,
      }}>
        <View style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: colors.foc + '20',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Text style={{ fontSize: 14 }}>💡</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 13, color: colors.textSub, lineHeight: 19 }}>
          {ins.text}
        </Text>
      </View>
    ))}
  </View>
)}
```

- [ ] **Step 5: Verify** — with 14+ days of mock data, insights card appears. With less data, card is hidden.

- [ ] **Step 6: Commit**
```bash
git add app/index.tsx lib/patterns.ts
git commit -m "feat: add pattern detection insights card to dashboard"
```

---

## Task 19 — Settings: Weekly Goals Section

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add imports**
```typescript
import { WeeklyGoals, DEFAULT_WEEKLY_GOALS, KEYS } from '../lib/storage';
import { loadData, saveData } from '../lib/storage';
```

(These may already be partially imported — merge with existing import line.)

- [ ] **Step 2: Add state** inside `SettingsScreen`:
```typescript
const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);
const [weeklyGoalsDraft, setWeeklyGoalsDraft] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);
```

- [ ] **Step 3: Load on mount** — in the existing `useEffect` that loads goals, add:
```typescript
loadData<WeeklyGoals>(KEYS.weeklyGoals, DEFAULT_WEEKLY_GOALS).then(wg => {
  setWeeklyGoals(wg);
  setWeeklyGoalsDraft(wg);
});
```

- [ ] **Step 4: Add save handler**
```typescript
const saveWeeklyGoals = async () => {
  await saveData(KEYS.weeklyGoals, weeklyGoalsDraft);
  setWeeklyGoals(weeklyGoalsDraft);
};
```

- [ ] **Step 5: Add weekly goals section to JSX** — after the existing daily goals section, add a new card:

```typescript
{/* Weekly Goals */}
<Text style={[gs.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Weekly Goals</Text>
<View style={gs.card}>
  {[
    { label: 'Focus (min/week)', key: 'focusMinutes' as keyof WeeklyGoals, step: 30 },
    { label: 'Gym sessions/week', key: 'gymSessions' as keyof WeeklyGoals, step: 1 },
    { label: 'Water (ml/week)', key: 'waterMlTotal' as keyof WeeklyGoals, step: 500 },
    { label: 'Calories (kcal/week)', key: 'caloriesTotal' as keyof WeeklyGoals, step: 500 },
    { label: 'Steps/week', key: 'stepsTotal' as keyof WeeklyGoals, step: 1000 },
  ].map(field => (
    <View key={field.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 14, color: colors.textSub }}>{field.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={() => setWeeklyGoalsDraft(d => ({ ...d, [field.key]: Math.max(0, d[field.key] - field.step) }))}
          style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>−</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 60, textAlign: 'center' }}>
          {weeklyGoalsDraft[field.key].toLocaleString()}
        </Text>
        <TouchableOpacity
          onPress={() => setWeeklyGoalsDraft(d => ({ ...d, [field.key]: d[field.key] + field.step }))}
          style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  ))}
  <TouchableOpacity style={[gs.btnPrimary, { marginTop: 16 }]} onPress={saveWeeklyGoals}>
    <Text style={gs.btnPrimaryText}>Save Weekly Goals</Text>
  </TouchableOpacity>
</View>
```

- [ ] **Step 6: Verify** — open Settings, weekly goals section appears with +/− controls. Saving persists across app reloads.

- [ ] **Step 7: Commit**
```bash
git add app/settings.tsx
git commit -m "feat: add weekly goals configuration section to Settings"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] ART stat removal → Task 1
- [x] StatLevels + XP system → Tasks 2, 3, 7–10
- [x] Pentagon radar chart → Task 4, 11
- [x] Weekly goals + streak → Tasks 5, 12, 19
- [x] Streak calendar → Task 13, 14
- [x] Daily note + mood → Task 15
- [x] Journal access from calendar → Task 13 (day detail modal)
- [x] Dashboard quick-log → Task 16
- [x] Water preset buttons → Task 7
- [x] Weekly summary → Task 17
- [x] Pattern detection → Tasks 6, 18

**Type consistency check:**
- `StatKey` defined in Task 2, used in Task 3 (xp.ts), Task 11 (index.tsx) ✓
- `DayData` defined in Task 13 (StreakCalendar.tsx), used in Task 14 (index.tsx) ✓
- `PentagonStats` defined in Task 4 (PentagonChart.tsx), used in Task 11 ✓
- `WeeklyProgress` defined in Task 5 (weeklyStats.ts), used in Task 12 ✓
- `Insight` defined in Task 6 (patterns.ts), used in Task 18 ✓
- `DailyNote` defined in Task 2 (storage.ts), used in Tasks 13, 15 ✓
- `KEYS.dailyNotes` defined in Task 2, referenced in Tasks 13–15 ✓
- `refreshWeeklyStreak` defined in Task 5, imported in Task 12 ✓
- `computeThisWeekProgress` defined in Task 5, imported in Task 12 ✓
- `awardXP` / `xpProgress` / `xpToNextLevel` defined in Task 3, used in Tasks 7–11, 16 ✓
