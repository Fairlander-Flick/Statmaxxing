# Statmaxxing — Goals, Pomodoro & Dashboard Design

**Date:** 2026-05-02
**Status:** Approved

---

## Scope

Four connected features:

1. Unified goals storage + Settings UI
2. Health screen: weight target line + macro progress bars
3. Mind screen: true Pomodoro mode
4. Dashboard: today's goal progress chips

Out of scope: cloud sync (future), notifications, 1RM estimation, custom social types.

---

## 1. Data Layer

### New type: `Goals`

Add to `lib/storage.ts`:

```ts
export type Goals = {
  steps: number;          // default 8000
  sleepHours: number;     // default 7.5
  waterMl: number;        // default 2500 — migrates from health:waterGoal
  focusMinutes: number;   // default 90
  weightTargetKg: number | null; // null = no target line shown
  calories: number;       // default 2500
  proteinG: number;       // default 150
  carbsG: number;         // default 300
  fatG: number;           // default 70
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
```

Add to `KEYS`:

```ts
goalsConfig: 'settings:goals',
```

Remove `waterGoal: 'health:waterGoal'` from KEYS.

### Migration

On first load of `useGoals`, if `health:waterGoal` exists in AsyncStorage: copy its value into `goals.waterMl`, then delete the old key.

### New hook: `lib/useGoals.ts`

```ts
export function useGoals(): {
  goals: Goals;
  setGoal: <K extends keyof Goals>(key: K, value: Goals[K]) => Promise<void>;
}
```

- Loads `settings:goals` on mount, merges with `DEFAULT_GOALS` for missing keys.
- `setGoal` merges a single key and persists the full object.
- All screens that need goal values import this hook — no direct AsyncStorage calls for goals elsewhere.

---

## 2. Settings Screen

Replace the current standalone "Daily Water Goal" row with a **"Goals & Targets"** section card.

### Goals & Targets card rows

| Row | Key | Unit |
|-----|-----|------|
| Daily Steps | `steps` | steps |
| Sleep Goal | `sleepHours` | h |
| Water Goal | `waterMl` | ml |
| Focus Goal | `focusMinutes` | min |
| Target Weight | `weightTargetKg` | kg + × clear button |
| Daily Calories | `calories` | kcal |
| Protein | `proteinG` | g |
| Carbs | `carbsG` | g |
| Fat | `fatG` | g |

- All rows use the existing inline `TextInput` pattern (same as the old water goal row).
- Calories/Protein/Carbs/Fat grouped under a "Nutrition Targets" sub-label within the same card.
- Target Weight row has a `×` button that sets `weightTargetKg` to `null`.
- All changes persist immediately via `setGoal` on `onBlur` / `onSubmitEditing`.

---

## 3. Health Screen

### Weight chart — target line

When `goals.weightTargetKg !== null`, render a horizontal dashed line overlaid on the `LineChart` at the y-position corresponding to the target value. Implemented as an absolutely-positioned `View` inside a wrapper, since `react-native-chart-kit` has no native reference line API. Label: "Target", color: `colors.textMuted`.

### Nutrition tab — macro progress bars

Add a progress section above the food log list. Only shown when at least one macro target (`calories`, `proteinG`, `carbsG`, `fatG`) is > 0.

**Layout (4 rows):**

```
Calories   1,840 / 2,500 kcal  ████████░░  74%
Protein      112 / 150 g       ███████░░░  75%
Carbs        210 / 300 g       ███████░░░  70%
Fat           58 / 70 g        ████████░░  83%
```

- All bars: `colors.vit` (health domain color).
- Same fill bar component/pattern as the water tab progress bar.
- If a target is 0, that row is hidden.
- Bar can exceed 100% (overage shown in full color, no clipping).

---

## 4. Mind Screen — Pomodoro Mode

### Mode toggle

Extend existing `'timer' | 'manual'` toggle to `'timer' | 'pomodoro' | 'manual'`.

### Pomodoro behavior

- Intervals: 25 min work → 5 min break, repeating.
- `TimerRing` shows progress within the current interval.
- Phase label above ring: `WORK · Round 3` or `BREAK`.
- Auto-transition on interval end: phase flips, ring resets, timer continues automatically.
- Pause / Reset buttons behave same as current timer mode.
- On Save: only accumulated work-interval seconds count toward session total (break time excluded).
- Session quality rating (1–10) shown on save, same as current timer mode.

### Colors

- Work phase: `colors.foc`
- Break phase: `colors.textMuted`

No new components — `TimerRing` already accepts `progress`, `elapsed`, `isRunning`, `color`.

---

## 5. Dashboard — Goal Progress Chips

Add a **"Today"** row below the header, above the radar chart.

### Each chip shows

```
[icon]  actual / goal [unit]
```

| Stat | Icon | Color | Key |
|------|------|-------|-----|
| Steps | `footsteps-outline` | `colors.str` | `steps` |
| Water | `water-outline` | `colors.vit` | `waterMl` |
| Sleep | `moon-outline` | `colors.art` | `sleepHours` |
| Focus | `timer-outline` | `colors.foc` | `focusMinutes` |

- Goal met → checkmark replaces the fraction, chip border brightens.
- Not logged today → value shows `—`, text in `colors.textMuted`.
- Chip hidden if its goal is 0 or `null`.
- Nutrition macros NOT shown on dashboard (too granular — lives in Health screen only).

### Layout

- Mobile: horizontal `ScrollView` of chips.
- Web (≥768px): wrapping flex row.
- Chip style: small bordered card, no shadow, no elevation (Sessiz Keskinlik).

---

## Files Changed

| File | Change |
|------|--------|
| `lib/storage.ts` | Add `Goals` type, `DEFAULT_GOALS`, `KEYS.goalsConfig`, remove `KEYS.waterGoal` |
| `lib/useGoals.ts` | New hook |
| `app/settings.tsx` | Replace water goal row with Goals & Targets section |
| `app/health.tsx` | Weight target line + macro progress bars |
| `app/mind.tsx` | Pomodoro mode |
| `app/index.tsx` | Today's goal progress chips |
