# Statmaxxing — Optimization Audit

---

## 1) Optimization Summary

**Current health:** Moderate. No architectural anti-patterns, but several high-frequency inefficiencies add latency on every render and every tab switch.

**Top 3 highest-impact improvements:**
1. Memoize `makeGlobalStyles` — called raw inside every component render, triggering `StyleSheet.create()` on every state update across 6 screens.
2. Parallelize health screen data loading — 4 sequential `loadData` calls fire one-by-one instead of using `Promise.all`.
3. Replace sequential `removeItem` loop in settings with `AsyncStorage.multiRemove`.

**Biggest risk if no changes:** As data grows (users with 365 days of logs), `computeStats` in `index.tsx` loads and filters 8 full arrays on every refresh — O(n) per domain across the entire history with no pagination or slicing.

---

## 2) Findings (Prioritized)

---

### F-01: `makeGlobalStyles` Called on Every Render

- **Category:** Frontend / CPU
- **Severity:** High
- **Impact:** Reduces unnecessary `StyleSheet.create()` calls (JS → native bridge) on every render
- **Evidence:** `app/health.tsx:23`, `app/index.tsx:402`, `app/train.tsx:19`, `app/mind.tsx:65`, `app/social.tsx:38`, `app/settings.tsx:60` — all call `makeGlobalStyles(colors)` at the top of the component body with no memoization
- **Why it's inefficient:** `StyleSheet.create()` allocates and registers a new stylesheet object on the native side on every render. Each re-render (e.g., typing in an input, opening a modal) re-runs this for 20+ style entries.
- **Recommended fix:** Replace with `useMemo(() => makeGlobalStyles(colors), [colors])` in each screen. Since `colors` only changes on theme toggle, StyleSheet is created exactly twice per session.
- **Tradeoffs / Risks:** None — `colors` reference is stable within a theme mode (same object from context).
- **Expected impact estimate:** Eliminates 20–40 native bridge calls per user interaction across all screens.
- **Removal Safety:** Safe
- **Reuse Scope:** Service-wide (all 6 screens)

---

### F-02: Health Screen — Sequential `loadData` Calls on Mount

- **Category:** I/O
- **Severity:** High
- **Impact:** Reduces health screen cold-start latency by ~3× (4 serial reads → 1 parallel batch)
- **Evidence:** `app/health.tsx:70–78` — `loadData` for sleep, weight, food library, and nutrition logs are chained as independent `.then()` callbacks fired sequentially after `useEffect` triggers
- **Why it's inefficient:** Each `AsyncStorage.getItem` is an async I/O round-trip. Running 4 of them sequentially means total latency = sum of all 4 reads. They have no dependencies on each other.
- **Recommended fix:**
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
- **Tradeoffs / Risks:** None — reads are independent.
- **Expected impact estimate:** ~60–70% reduction in health screen initial load time on older devices.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file (`app/health.tsx`)

---

### F-03: Settings — Sequential `removeItem` Loop

- **Category:** I/O
- **Severity:** High
- **Impact:** Reduces "clear all data" latency proportional to number of keys (currently N storage keys = N sequential round-trips)
- **Evidence:** `app/settings.tsx:146` — `for (const key of logKeys) await AsyncStorage.removeItem(key)` fires one delete at a time
- **Why it's inefficient:** `AsyncStorage` provides `multiRemove(keys)` specifically for batch deletes. Each `removeItem` is a separate async bridge call.
- **Recommended fix:**
  ```ts
  await AsyncStorage.multiRemove(logKeys);
  ```
- **Tradeoffs / Risks:** None — `multiRemove` is a first-party AsyncStorage API.
- **Expected impact estimate:** N× speedup where N = number of storage keys (~10 keys currently → 10× faster clear).
- **Removal Safety:** Safe
- **Reuse Scope:** Local file (`app/settings.tsx`)

---

### F-04: `TAB_CONFIG` Array Recreated on Every Render

- **Category:** Frontend / Memory
- **Severity:** Medium
- **Impact:** Eliminates pointless object allocation on every render of the health screen
- **Evidence:** `app/health.tsx` — `const TAB_CONFIG = [{ id: 'sleep', ... }, ...]` defined inside component body without memoization; depends on `colors` which is stable within a theme
- **Why it's inefficient:** Creates 4 new objects per render. Causes any component that receives `TAB_CONFIG` as a prop to see a new reference every time, potentially triggering unnecessary child re-renders.
- **Recommended fix:** `const TAB_CONFIG = useMemo(() => [...], [colors.art, colors.vit, colors.foc, colors.str])` or move it outside the component if `colors` is provided via a parameter.
- **Tradeoffs / Risks:** None.
- **Expected impact estimate:** Low per-render, but compound with high-frequency re-renders.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file (`app/health.tsx`)

---

### F-05: `useGoals` Writes Storage on Every Mount (Not Just Migration)

- **Category:** I/O
- **Severity:** Medium
- **Impact:** Removes 1 unnecessary `saveData` write per mount per screen that calls `useGoals` (currently health, index, settings — 3 screens)
- **Evidence:** `lib/useGoals.ts:12–20` — after merging `DEFAULT_GOALS` + stored goals + migration, `saveData(KEYS.goalsConfig, merged)` is called unconditionally on every mount, not only when migration occurred
- **Why it's inefficient:** If no migration happened and stored goals already exist, writing them back is a no-op that still pays the full `JSON.stringify` + `AsyncStorage.setItem` cost.
- **Recommended fix:** Only write back if migration happened:
  ```ts
  const stored = await loadData<Partial<Goals>>(KEYS.goalsConfig, {});
  let merged: Goals = { ...DEFAULT_GOALS, ...stored };
  const migrated = await migrateWaterGoal(merged);
  const didMigrate = migrated !== merged;
  merged = migrated;
  setGoals(merged);
  if (didMigrate || Object.keys(stored).length === 0) {
    await saveData(KEYS.goalsConfig, merged);
  }
  ```
- **Tradeoffs / Risks:** First-time users (empty storage) still get the initial write. Low risk.
- **Expected impact estimate:** Saves 1 `setItem` call per screen mount (3 screens × every app open).
- **Removal Safety:** Needs Verification (test first-time user flow)
- **Reuse Scope:** Module (`lib/useGoals.ts`)

---

### F-06: Macro Multiplication Logic Duplicated in `health.tsx`

- **Category:** Code Reuse / Algorithm
- **Severity:** Medium
- **Impact:** Reduces bug surface; one fix covers both code paths
- **Evidence:** `app/health.tsx:148` and `app/health.tsx:162` — identical inline macro multiplication `{ calories: baseMacros.calories * multiplier, carbs: ... }` written twice for "add new food" vs "add from library"
- **Why it's inefficient:** Drift risk — if macro rounding or a new macro field is added, only one path may be updated.
- **Recommended fix:** Extract helper:
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
- **Tradeoffs / Risks:** None.
- **Expected impact estimate:** Maintenance quality, no runtime impact.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file (`app/health.tsx`)

---

### F-07: `react-native-chart-kit` Used for a Single `LineChart`

- **Category:** Build / Frontend
- **Severity:** Medium
- **Impact:** Reduces JS bundle size; the library brings `react-native-svg` (already a dep), lodash, and bezier path calculations
- **Evidence:** `app/health.tsx` — `import { LineChart } from 'react-native-chart-kit'` is the only use of this package in the entire codebase; all other charts are custom SVG
- **Why it's inefficient:** `react-native-chart-kit` is a 150+ KB dependency used for a weight trend line that could be replaced with the same custom SVG pattern already used in `index.tsx` (`WeightRangeChart`, `SimpleBarChart`, etc.).
- **Recommended fix:** Replace the `LineChart` with a custom SVG line chart matching the `Spark`/`WeightRangeChart` pattern already in `index.tsx`. Remove `react-native-chart-kit` from `package.json`.
- **Tradeoffs / Risks:** Requires reimplementing the weight history line chart. Medium effort.
- **Expected impact estimate:** ~50–100 KB reduction in JS bundle.
- **Removal Safety:** Safe (after replacement)
- **Reuse Scope:** Service-wide (bundle)

---

### F-08: No In-Memory Cache — Data Re-Loaded on Every Tab Switch

- **Category:** I/O / Caching
- **Severity:** Medium
- **Impact:** Eliminates repeated AsyncStorage reads for the same data within a session
- **Evidence:** `app/health.tsx`, `app/train.tsx`, `app/mind.tsx`, `app/social.tsx` — each screen's `useEffect([], [])` fires on every mount (Expo Router remounts on tab switch in some configurations); `computeStats` in `index.tsx` loads 8 keys on every pull-to-refresh
- **Why it's inefficient:** AsyncStorage is async disk I/O (SQLite on native, IndexedDB on web). Re-reading the same data that hasn't changed is wasted I/O.
- **Recommended fix:** Add a simple in-memory store module (`lib/cache.ts`) with a `Map<string, { data: unknown; ts: number }>`. Wrap `loadData` with a TTL cache (e.g., 30s). On `saveData`, invalidate the cache entry for that key.
- **Tradeoffs / Risks:** Stale data possible if the app is backgrounded and data changes externally (not a risk here — fully local-first). Medium implementation effort.
- **Expected impact estimate:** Eliminates all redundant reads after first load; significant on slower Android devices.
- **Removal Safety:** Safe
- **Reuse Scope:** Service-wide (`lib/storage.ts`)

---

### F-09: `computeStats` Loads All Historical Data with No Slicing

- **Category:** Algorithm / Memory
- **Severity:** Medium
- **Impact:** Prevents memory and CPU scaling issues as log history grows
- **Evidence:** `app/index.tsx:447–454` — all 8 log arrays are loaded in full via `Promise.all`. Downstream, `last30` date slice is computed but the full arrays are held in memory for the entire duration of `computeStats`.
- **Why it's inefficient:** After 1 year of daily logs, each array can have 365 entries (sleep, water, weight, steps) or thousands (nutrition). Loading all of them to compute 30-day stats is wasteful.
- **Recommended fix:** Either (a) store logs with a date-indexed structure so only recent N days can be fetched, or (b) keep lists capped at ~90 days during `appendToList` by trimming on write. Option (b) is simpler and fits the current storage model.
- **Tradeoffs / Risks:** Capping at 90 days means stats older than that are lost. Acceptable for a personal fitness tracker. If long-term history is desired, defer this.
- **Expected impact estimate:** Caps memory per array at ~90 entries. Prevents exponential growth.
- **Removal Safety:** Needs Verification
- **Reuse Scope:** Service-wide (`lib/storage.ts` — `appendToList`)

---

### F-10: `index.tsx` is a 968-line God Component

- **Category:** Maintainability / Frontend
- **Severity:** Low (for runtime), High (for maintenance)
- **Impact:** Reduces re-render surface area; currently any state change in `index.tsx` re-renders the entire dashboard including all chart components
- **Evidence:** `app/index.tsx` — 968 lines, contains `Ring`, `Spark`, `SimpleBarChart`, `CaloriesChart`, `WeightRangeChart`, `TodayChip`, `StatRow`, `SocialGraph`, `StreakBadge`, and the main `HomeScreen` all in one file
- **Why it's inefficient:** Sub-components defined in the same file as the parent are not automatically memoized. Any parent state change re-renders all children. `useCallback` / `useMemo` is used only for `computeStats` and `onRefresh`, but the rendering of ~12 chart components is unconstrained.
- **Recommended fix:** Extract sub-components to `components/` directory. Wrap with `React.memo` where appropriate. Start with the most expensive: `WeightRangeChart`, `SimpleBarChart`, `CaloriesChart`.
- **Tradeoffs / Risks:** Non-trivial refactor. Props must be stable for `memo` to help.
- **Expected impact estimate:** Reduces re-renders of heavy chart components during UI interactions (e.g., graph tab selection).
- **Removal Safety:** Safe
- **Reuse Scope:** Local file / module

---

### F-11: `waterLogs` Read Twice in Water Save Path

- **Category:** I/O
- **Severity:** Low
- **Impact:** Saves 1 redundant AsyncStorage read per water log entry
- **Evidence:** `app/health.tsx:87–99` — `loadTodayWater()` reads `KEYS.waterLogs`, then `addWater()` (which calls `loadData<WaterLog[]>` again at line 92) reads the same key, each independent of the other
- **Why it's inefficient:** Two round-trips to storage for the same key in the same user action.
- **Recommended fix:** Pass the already-loaded logs from `loadTodayWater` into the save function, or refactor to a single `loadData` call that initializes both state and the save closure.
- **Tradeoffs / Risks:** Minor refactor.
- **Expected impact estimate:** Saves 1 read per water log save.
- **Removal Safety:** Safe
- **Reuse Scope:** Local file (`app/health.tsx`)

---

## 3) Quick Wins (Do First)

| # | Finding | Effort | Impact |
|---|---------|--------|--------|
| F-03 | `AsyncStorage.multiRemove` in settings | 2 min | High |
| F-01 | `useMemo` for `makeGlobalStyles` in all 6 screens | 15 min | High |
| F-06 | Extract `applyMultiplier` helper in health | 5 min | Medium |
| F-02 | `Promise.all` for health screen init loads | 10 min | High |
| F-04 | `useMemo` for `TAB_CONFIG` in health | 3 min | Medium |
| F-05 | Conditional write-back in `useGoals` | 10 min | Medium |

---

## 4) Deeper Optimizations (Do Next)

| # | Finding | Effort | Impact |
|---|---------|--------|--------|
| F-08 | In-memory storage cache with TTL | 2–3 hrs | Medium–High |
| F-07 | Replace `react-native-chart-kit` LineChart with custom SVG | 1–2 hrs | Medium |
| F-09 | Cap `appendToList` at 90 days on write | 30 min | Medium |
| F-10 | Extract chart components from `index.tsx`, wrap with `React.memo` | 3–4 hrs | Low–Medium |

---

## 5) Validation Plan

### Before/After Benchmarks
- **Render time:** Add `console.time('render')` / `console.timeEnd('render')` in `useEffect` on each screen. Compare before and after F-01 fix.
- **Init load time:** Timestamp `useEffect` entry and last `setState` call in health screen. Compare F-02 fix.
- **Settings clear:** `console.time('clear')` around the removeItem block. Compare F-03 fix.

### Profiling Strategy
- Use React Native's built-in Flipper profiler (or the Expo DevTools performance tab) to confirm render counts drop after F-01 memoization.
- Use `AsyncStorage` debug logging (set `AsyncStorage.setDebug(true)`) to count reads/writes before and after F-08 cache.

### Metrics to Compare
| Metric | Target |
|--------|--------|
| Health screen cold-start | < 100ms (from ~300ms on slow device) |
| `computeStats` execution time | No regression after F-09 cap |
| Renders per graph tab toggle | 1 (only the changed tab component) after F-10 |
| Settings clear (10 keys) | < 20ms (from ~200ms) |

### Correctness Tests
- After F-02: verify all 4 data types still load and display correctly after parallel fetch.
- After F-05: verify first-time user (empty storage) still persists goals correctly.
- After F-09: verify 91-day-old logs are not shown in dashboard after cap.

---

## 6) Optimized Code / Patch

### F-03 Patch (`app/settings.tsx`)
```ts
// Before (line 146):
for (const key of logKeys) await AsyncStorage.removeItem(key);

// After:
await AsyncStorage.multiRemove(logKeys);
```

### F-01 Patch (apply to all 6 screens)
```ts
// Before:
const gs = makeGlobalStyles(colors);

// After:
const gs = useMemo(() => makeGlobalStyles(colors), [colors]);
```
Add `useMemo` to imports.

### F-06 Patch (`app/health.tsx` — add before component)
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
Replace both inline macro multiplications with `applyMultiplier(baseMacros, multiplier)`.

### F-02 Patch (`app/health.tsx` — replace useEffect)
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
