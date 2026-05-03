# Performance Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply all Quick Win optimizations from OPTIMIZATIONS.md — eliminating redundant StyleSheet allocations, parallelizing storage reads, and replacing a sequential delete loop.

**Architecture:** Pure refactors — no new abstractions, no behavior changes. Each task targets one file. The deeper optimizations (in-memory cache, bundle size, component extraction) are documented in OPTIMIZATIONS.md but NOT included here; they require separate planning.

**Tech Stack:** React Native, AsyncStorage, React hooks (`useMemo`)

---

## File Map

| File | Change |
|------|--------|
| `app/health.tsx` | F-01: memoize `gs`; F-02: parallelize init loadData; F-04: memoize TAB_CONFIG; F-06: extract `applyMultiplier` |
| `app/index.tsx` | F-01: memoize `gs` |
| `app/train.tsx` | F-01: memoize `gs` |
| `app/mind.tsx` | F-01: memoize `gs` |
| `app/social.tsx` | F-01: memoize `gs` |
| `app/settings.tsx` | F-01: memoize `gs`; F-03: multiRemove |
| `lib/useGoals.ts` | F-05: conditional write-back |

---

## Task 1: Memoize `makeGlobalStyles` — settings.tsx and train.tsx

**Files:**
- Modify: `app/settings.tsx`
- Modify: `app/train.tsx`

- [ ] **Step 1: Read settings.tsx imports and gs line**

Open `app/settings.tsx`. Confirm line 4 imports `useState, useEffect` from react and line 60 has `const gs = makeGlobalStyles(colors);`.

- [ ] **Step 2: Add useMemo to settings.tsx imports**

In `app/settings.tsx`, change:
```ts
import { useState, useEffect } from 'react';
```
to:
```ts
import { useState, useEffect, useMemo } from 'react';
```

- [ ] **Step 3: Memoize gs in settings.tsx**

In `app/settings.tsx`, change:
```ts
const gs = makeGlobalStyles(colors);
```
to:
```ts
const gs = useMemo(() => makeGlobalStyles(colors), [colors]);
```

- [ ] **Step 4: Memoize gs in train.tsx**

Open `app/train.tsx`. The file imports `{ useState, useEffect }` from react (line 1). Change to:
```ts
import { useState, useEffect, useMemo } from 'react';
```

Then find `const gs = makeGlobalStyles(colors);` (line 19) and change to:
```ts
const gs = useMemo(() => makeGlobalStyles(colors), [colors]);
```

- [ ] **Step 5: Verify app starts without error**

Run: `npm start` (Expo), open the Train and Settings tabs, confirm they render correctly.

- [ ] **Step 6: Commit**

```bash
git add app/settings.tsx app/train.tsx
git commit -m "perf: memoize makeGlobalStyles in settings and train screens"
git push
```

---

## Task 2: Memoize `makeGlobalStyles` — mind.tsx and social.tsx

**Files:**
- Modify: `app/mind.tsx`
- Modify: `app/social.tsx`

- [ ] **Step 1: Add useMemo to mind.tsx**

In `app/mind.tsx`, find the react import (line 1, `import { useState, useEffect, ... } from 'react'`). Add `useMemo` to the import list.

Then find `const gs = makeGlobalStyles(colors);` (line 65) inside the component and change to:
```ts
const gs = useMemo(() => makeGlobalStyles(colors), [colors]);
```

- [ ] **Step 2: Add useMemo to social.tsx**

In `app/social.tsx`, find the react import (line 1). Add `useMemo` to the import list.

Then find `const gs = makeGlobalStyles(colors);` (line 38) and change to:
```ts
const gs = useMemo(() => makeGlobalStyles(colors), [colors]);
```

- [ ] **Step 3: Verify**

Open Mind and Social tabs. Confirm they render correctly.

- [ ] **Step 4: Commit**

```bash
git add app/mind.tsx app/social.tsx
git commit -m "perf: memoize makeGlobalStyles in mind and social screens"
git push
```

---

## Task 3: Memoize `makeGlobalStyles` — index.tsx

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Locate imports**

In `app/index.tsx` line 1: `import { useState, useEffect, useCallback, useRef } from 'react';`. Add `useMemo`:
```ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
```

- [ ] **Step 2: Memoize gs**

Find `const gs = makeGlobalStyles(colors);` (line 402) and change to:
```ts
const gs = useMemo(() => makeGlobalStyles(colors), [colors]);
```

- [ ] **Step 3: Verify**

Open the Home/Dashboard tab. Confirm stats and charts render correctly.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "perf: memoize makeGlobalStyles in index screen"
git push
```

---

## Task 4: Replace Sequential `removeItem` Loop with `multiRemove`

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Read the clearAllData function**

In `app/settings.tsx`, find the data-clear function around line 140–150. It contains:
```ts
for (const key of logKeys) await AsyncStorage.removeItem(key);
```

- [ ] **Step 2: Replace with multiRemove**

Change that line to:
```ts
await AsyncStorage.multiRemove(logKeys);
```

`AsyncStorage` is already imported in `settings.tsx` (line 10), so no import change needed.

- [ ] **Step 3: Verify**

In the Settings screen, tap "Clear All Data". Confirm it completes and logs are wiped. Navigate to Health/Train to confirm logs are gone.

- [ ] **Step 4: Commit**

```bash
git add app/settings.tsx
git commit -m "perf: use AsyncStorage.multiRemove for batch key deletion"
git push
```

---

## Task 5: Extract `applyMultiplier` Helper in health.tsx

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Add helper function before component**

In `app/health.tsx`, add this function before `export default function HealthScreen()`:
```ts
function applyMultiplier(base: Macro, multiplier: number): Macro {
  return {
    calories: base.calories * multiplier,
    carbs: base.carbs * multiplier,
    protein: base.protein * multiplier,
    fat: base.fat * multiplier,
    fiber: base.fiber * multiplier,
  };
}
```

- [ ] **Step 2: Replace first inline multiplication (add new food path)**

Find the inline macro multiplication around line 148 that looks like:
```ts
const macros: Macro = { calories: baseMacros.calories * multiplier, carbs: baseMacros.carbs * multiplier, protein: baseMacros.protein * multiplier, fat: baseMacros.fat * multiplier, fiber: baseMacros.fiber * multiplier };
```
Replace with:
```ts
const macros = applyMultiplier(baseMacros, multiplier);
```
where `baseMacros` is the locally constructed macro object from the form inputs.

- [ ] **Step 3: Replace second inline multiplication (add from library path)**

Find the second identical macro multiplication around line 162 that looks like:
```ts
const macros = { calories: selectedFood.baseMacros.calories * multiplier, carbs: selectedFood.baseMacros.carbs * multiplier, protein: selectedFood.baseMacros.protein * multiplier, fat: selectedFood.baseMacros.fat * multiplier, fiber: selectedFood.baseMacros.fiber * multiplier };
```
Replace with:
```ts
const macros = applyMultiplier(selectedFood.baseMacros, multiplier);
```

- [ ] **Step 4: Verify**

In the Health screen, go to the Food tab. Add a new food entry manually. Add a food from the library. Confirm macros are calculated and displayed correctly for both paths.

- [ ] **Step 5: Commit**

```bash
git add app/health.tsx
git commit -m "refactor: extract applyMultiplier to eliminate duplicated macro math"
git push
```

---

## Task 6: Memoize TAB_CONFIG in health.tsx

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Confirm useMemo is already imported**

In `app/health.tsx`, check the react import line (line 1). If `useMemo` is not already there, add it:
```ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
```

- [ ] **Step 2: Memoize TAB_CONFIG**

Find `const TAB_CONFIG` inside `HealthScreen` component. It looks like:
```ts
const TAB_CONFIG: { id: HealthTab; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
  { id: 'sleep', label: 'Sleep', icon: 'moon-outline', color: colors.art },
  { id: 'water', label: 'Water', icon: 'water-outline', color: colors.vit },
  { id: 'weight', label: 'Weight', icon: 'barbell-outline', color: colors.str },
  { id: 'nutrition', label: 'Food', icon: 'fast-food-outline', color: colors.str },
];
```

Replace with:
```ts
const TAB_CONFIG = useMemo(() => [
  { id: 'sleep' as HealthTab, label: 'Sleep', icon: 'moon-outline' as React.ComponentProps<typeof Ionicons>['name'], color: colors.art },
  { id: 'water' as HealthTab, label: 'Water', icon: 'water-outline' as React.ComponentProps<typeof Ionicons>['name'], color: colors.vit },
  { id: 'weight' as HealthTab, label: 'Weight', icon: 'barbell-outline' as React.ComponentProps<typeof Ionicons>['name'], color: colors.str },
  { id: 'nutrition' as HealthTab, label: 'Food', icon: 'fast-food-outline' as React.ComponentProps<typeof Ionicons>['name'], color: colors.str },
], [colors.art, colors.vit, colors.str]);
```

- [ ] **Step 3: Verify**

Open Health screen. Confirm all 4 tabs (Sleep, Water, Weight, Food) are visible and tappable.

- [ ] **Step 4: Commit**

```bash
git add app/health.tsx
git commit -m "perf: memoize TAB_CONFIG array in health screen"
git push
```

---

## Task 7: Parallelize health.tsx Init Data Loads

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Locate the useEffect**

In `app/health.tsx`, find the `useEffect(() => { ... }, [])` that fires on mount. It currently calls:
```ts
loadData<SleepLog[]>(KEYS.sleepLogs, []).then((logs) => { ... });
loadTodayWater();
loadData<WeightLog[]>(KEYS.weightLogs, []).then(setWeightHistory);
loadData<FoodItem[]>(KEYS.foodLibrary, []).then(setFoodLibrary);
loadData<NutritionLog[]>(KEYS.nutritionLogs, []).then((logs) => setTodayNutrition(logs.filter((l) => l.date === today)));
```

- [ ] **Step 2: Replace with Promise.all**

Replace the entire body of that `useEffect` with:
```ts
useEffect(() => {
  const today = toDay();
  Promise.all([
    loadData<SleepLog[]>(KEYS.sleepLogs, []),
    loadData<WeightLog[]>(KEYS.weightLogs, []),
    loadData<FoodItem[]>(KEYS.foodLibrary, []),
    loadData<NutritionLog[]>(KEYS.nutritionLogs, []),
  ]).then(([sleepLogs, weightLogs, foodLib, nutritionLogs]) => {
    const todayLog = sleepLogs.filter(l => l.date === today).pop();
    if (todayLog) setTodaySleep(todayLog.hours);
    setSleepHistory(sleepLogs.slice(-10).reverse());
    setWeightHistory(weightLogs);
    setFoodLibrary(foodLib);
    setTodayNutrition(nutritionLogs.filter(l => l.date === today));
  });
  loadTodayWater();
}, []);
```

Note: `today` was previously declared outside `useEffect` as `const today = toDay()` at the top of the component. If that line still exists at the top level, remove the `const today = toDay()` from inside the effect to avoid shadowing. If `today` is only used inside effects and handlers, consolidate.

- [ ] **Step 3: Verify**

Open Health screen. Confirm Sleep history, Weight history, Food library, and Today's nutrition all load correctly. Switch tabs between Sleep, Water, Weight, Food and confirm each tab's data is correct.

- [ ] **Step 4: Commit**

```bash
git add app/health.tsx
git commit -m "perf: parallelize health screen init loads with Promise.all"
git push
```

---

## Task 8: Conditional Write-Back in useGoals

**Files:**
- Modify: `lib/useGoals.ts`

- [ ] **Step 1: Read the current useEffect body**

In `lib/useGoals.ts`, the `useEffect` body is:
```ts
(async () => {
  const stored = await loadData<Partial<Goals>>(KEYS.goalsConfig, {});
  let merged: Goals = { ...DEFAULT_GOALS, ...stored };
  merged = await migrateWaterGoal(merged);
  setGoals(merged);
  await saveData(KEYS.goalsConfig, merged);
})();
```

- [ ] **Step 2: Update migrateWaterGoal to return whether migration occurred**

Change `migrateWaterGoal` to return `{ goals: Goals; migrated: boolean }`:
```ts
async function migrateWaterGoal(current: Goals): Promise<{ goals: Goals; migrated: boolean }> {
  const raw = await AsyncStorage.getItem('health:waterGoal');
  if (raw === null) return { goals: current, migrated: false };
  const parsed = parseInt(raw, 10);
  if (!isNaN(parsed) && parsed > 0) {
    await AsyncStorage.removeItem('health:waterGoal');
    return { goals: { ...current, waterMl: parsed }, migrated: true };
  }
  return { goals: current, migrated: false };
}
```

- [ ] **Step 3: Update the useEffect to only write on first-time or migration**

Replace the `useEffect` body with:
```ts
(async () => {
  const stored = await loadData<Partial<Goals>>(KEYS.goalsConfig, {});
  const isFirstTime = Object.keys(stored).length === 0;
  let merged: Goals = { ...DEFAULT_GOALS, ...stored };
  const { goals: migrated, migrated: didMigrate } = await migrateWaterGoal(merged);
  merged = migrated;
  setGoals(merged);
  if (isFirstTime || didMigrate) {
    await saveData(KEYS.goalsConfig, merged);
  }
})();
```

- [ ] **Step 4: Verify first-time user flow**

Clear all data via Settings → "Clear All Data". Restart the app. Navigate to any screen that uses goals (Health, Dashboard). Confirm goals still display default values correctly (not NaN or zero).

- [ ] **Step 5: Verify existing user flow**

After goals are stored, restart the app. Confirm goals load from storage (not reset to defaults).

- [ ] **Step 6: Commit**

```bash
git add lib/useGoals.ts
git commit -m "perf: skip goals write-back when no migration or first-time init needed"
git push
```
