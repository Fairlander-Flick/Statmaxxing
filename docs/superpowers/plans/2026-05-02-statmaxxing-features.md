# Statmaxxing Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unified Goals storage, Settings Goals UI, weight target line, macro progress bars, Pomodoro mode, and Dashboard today chips.

**Architecture:** All goal values live in a single `useGoals` hook backed by `settings:goals` in AsyncStorage. Four screens consume it: Settings (edit), Health (display targets), Mind (Pomodoro uses `focusMinutes`-aware save), Dashboard (chip display). Migration runs once on first `useGoals` load to copy the legacy `health:waterGoal` key.

**Tech Stack:** React Native + Expo, AsyncStorage, TypeScript, react-native-chart-kit (weight screen), react-native-svg (TimerRing already uses it)

---

## File Map

| File | Change |
|------|--------|
| `lib/storage.ts` | Add `Goals` type, `DEFAULT_GOALS`, `KEYS.goalsConfig`; remove `KEYS.waterGoal` |
| `lib/useGoals.ts` | New hook — loads/saves goals, runs waterGoal migration |
| `app/settings.tsx` | Replace single water-goal row with full Goals & Targets section |
| `app/health.tsx` | Use `useGoals` for water + weight target; add macro progress bars |
| `app/mind.tsx` | Add `'pomodoro'` mode with phase auto-transition and work-seconds-only save |
| `app/index.tsx` | Use `useGoals` for chips; add Today row with 4 stat chips |

---

## Task 1: Data Layer — storage.ts

**Files:**
- Modify: `lib/storage.ts`

- [ ] **Step 1: Add `Goals` type and `DEFAULT_GOALS` constant**

In `lib/storage.ts`, after the existing type exports (before or after `MindLog` — pick a logical spot near the end of types), add:

```ts
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
```

- [ ] **Step 2: Update `KEYS` object**

In the `KEYS` const:
- Add `goalsConfig: 'settings:goals',` to the `KEYS` object (e.g. inside a `// Settings` comment block)
- Remove the line `waterGoal: 'health:waterGoal',`

The Health block in KEYS should go from:
```ts
  sleepLogs: 'health:sleep',
  waterLogs: 'health:water',
  waterGoal: 'health:waterGoal',
  weightLogs: 'health:weight',
```
To:
```ts
  sleepLogs: 'health:sleep',
  waterLogs: 'health:water',
  weightLogs: 'health:weight',
```
And add a Settings block:
```ts
  // Settings
  goalsConfig: 'settings:goals',
```

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add Goals type and goalsConfig storage key"
git push
```

---

## Task 2: `lib/useGoals.ts` — Goals Hook

**Files:**
- Create: `lib/useGoals.ts`

- [ ] **Step 1: Create the hook**

```ts
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
```

- [ ] **Step 2: Verify the file compiles**

Run `npx tsc --noEmit` from the project root. Expected: no errors related to `useGoals.ts`. (If tsc isn't available, do a quick `npx expo start` and check the terminal for TypeScript errors.)

- [ ] **Step 3: Commit**

```bash
git add lib/useGoals.ts
git commit -m "feat: add useGoals hook with waterGoal migration"
git push
```

---

## Task 3: Settings Screen — Goals & Targets Section

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Update imports and remove legacy waterGoal state**

At the top of `settings.tsx`, add the import:
```ts
import { useGoals } from '../lib/useGoals';
```

Remove `waterGoal` from the import of `KEYS` usages — `KEYS.waterGoal` is gone. Keep the rest.

Inside `SettingsScreen`, remove:
```ts
const [waterGoal, setWaterGoal] = useState('');
```
And the `useEffect` that loads it:
```ts
useEffect(() => {
  loadData<number>(KEYS.waterGoal, 2500).then((val) => setWaterGoal(val.toString()));
}, []);
```
And the save handler:
```ts
const handleSaveWaterGoal = async () => {
  const goal = parseInt(waterGoal);
  if (!isNaN(goal) && goal > 0) await saveData(KEYS.waterGoal, goal);
};
```

Add in their place:
```ts
const { goals, setGoal } = useGoals();

const [goalInputs, setGoalInputs] = useState({
  steps: '',
  sleepHours: '',
  waterMl: '',
  focusMinutes: '',
  weightTargetKg: '',
  calories: '',
  proteinG: '',
  carbsG: '',
  fatG: '',
});
```

Add an effect to sync inputs when goals load:
```ts
useEffect(() => {
  setGoalInputs({
    steps: goals.steps.toString(),
    sleepHours: goals.sleepHours.toString(),
    waterMl: goals.waterMl.toString(),
    focusMinutes: goals.focusMinutes.toString(),
    weightTargetKg: goals.weightTargetKg !== null ? goals.weightTargetKg.toString() : '',
    calories: goals.calories.toString(),
    proteinG: goals.proteinG.toString(),
    carbsG: goals.carbsG.toString(),
    fatG: goals.fatG.toString(),
  });
}, [goals.steps, goals.waterMl, goals.sleepHours, goals.focusMinutes,
    goals.weightTargetKg, goals.calories, goals.proteinG, goals.carbsG, goals.fatG]);
```

Add helper functions:
```ts
const handleGoalInput = (key: keyof typeof goalInputs, val: string) => {
  setGoalInputs(prev => ({ ...prev, [key]: val }));
};

const handleGoalSave = (key: 'steps' | 'waterMl' | 'focusMinutes' | 'calories' | 'proteinG' | 'carbsG' | 'fatG') => {
  const parsed = parseInt(goalInputs[key]);
  if (!isNaN(parsed) && parsed > 0) setGoal(key, parsed);
};

const handleGoalSaveFloat = (key: 'sleepHours') => {
  const parsed = parseFloat(goalInputs[key]);
  if (!isNaN(parsed) && parsed > 0) setGoal(key, parsed);
};

const handleWeightTargetSave = () => {
  const raw = goalInputs.weightTargetKg;
  if (raw === '') { setGoal('weightTargetKg', null); return; }
  const parsed = parseFloat(raw);
  if (!isNaN(parsed) && parsed > 0) setGoal('weightTargetKg', parsed);
};

const clearWeightTarget = () => {
  setGoalInputs(prev => ({ ...prev, weightTargetKg: '' }));
  setGoal('weightTargetKg', null);
};
```

- [ ] **Step 2: Replace the "Daily Water Goal" row with the Goals & Targets card**

Find the JSX section containing the `Daily Water Goal` row (currently inside a `SectionCard`). Replace that entire `SectionCard` (the one with the water goal row) with:

```tsx
<SectionCard>
  <Text style={[s.sectionLabel, { color: colors.textMuted, marginBottom: 4 }]}>GOALS & TARGETS</Text>

  {/* Steps */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="footsteps-outline" size={20} color={colors.str} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Daily Steps</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>steps</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.steps}
      onChangeText={(v) => handleGoalInput('steps', v)}
      onBlur={() => handleGoalSave('steps')}
      onSubmitEditing={() => handleGoalSave('steps')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>

  {/* Sleep */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="moon-outline" size={20} color={colors.art} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Sleep Goal</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>h per night</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.sleepHours}
      onChangeText={(v) => handleGoalInput('sleepHours', v)}
      onBlur={handleGoalSaveFloat}
      onSubmitEditing={handleGoalSaveFloat}
      keyboardType="decimal-pad"
      selectTextOnFocus
    />
  </View>

  {/* Water */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="water-outline" size={20} color={colors.vit} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Water Goal</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>ml per day</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.waterMl}
      onChangeText={(v) => handleGoalInput('waterMl', v)}
      onBlur={() => handleGoalSave('waterMl')}
      onSubmitEditing={() => handleGoalSave('waterMl')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>

  {/* Focus */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="timer-outline" size={20} color={colors.foc} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Focus Goal</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>min per day</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.focusMinutes}
      onChangeText={(v) => handleGoalInput('focusMinutes', v)}
      onBlur={() => handleGoalSave('focusMinutes')}
      onSubmitEditing={() => handleGoalSave('focusMinutes')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>

  {/* Target Weight */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="analytics-outline" size={20} color={colors.soc} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Target Weight</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>kg — blank to hide line</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TextInput
        style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        value={goalInputs.weightTargetKg}
        onChangeText={(v) => handleGoalInput('weightTargetKg', v)}
        onBlur={handleWeightTargetSave}
        onSubmitEditing={handleWeightTargetSave}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textMuted}
        selectTextOnFocus
      />
      {goals.weightTargetKg !== null && (
        <TouchableOpacity onPress={clearWeightTarget}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  </View>

  {/* Nutrition sub-label */}
  <Text style={[s.settingSubLabel, { color: colors.textMuted, marginTop: 10, marginBottom: 2, paddingLeft: 4, fontWeight: '600', letterSpacing: 0.5 }]}>NUTRITION TARGETS</Text>

  {/* Calories */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="flame-outline" size={20} color={colors.dis} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Daily Calories</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>kcal</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.calories}
      onChangeText={(v) => handleGoalInput('calories', v)}
      onBlur={() => handleGoalSave('calories')}
      onSubmitEditing={() => handleGoalSave('calories')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>

  {/* Protein */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="barbell-outline" size={20} color={colors.foc} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Protein</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>g per day</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.proteinG}
      onChangeText={(v) => handleGoalInput('proteinG', v)}
      onBlur={() => handleGoalSave('proteinG')}
      onSubmitEditing={() => handleGoalSave('proteinG')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>

  {/* Carbs */}
  <View style={s.settingRow}>
    <View style={s.settingIconWrap}>
      <Ionicons name="nutrition-outline" size={20} color={colors.str} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Carbs</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>g per day</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.carbsG}
      onChangeText={(v) => handleGoalInput('carbsG', v)}
      onBlur={() => handleGoalSave('carbsG')}
      onSubmitEditing={() => handleGoalSave('carbsG')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>

  {/* Fat */}
  <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
    <View style={s.settingIconWrap}>
      <Ionicons name="water-outline" size={20} color={colors.art} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.settingLabel, { color: colors.text }]}>Fat</Text>
      <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>g per day</Text>
    </View>
    <TextInput
      style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      value={goalInputs.fatG}
      onChangeText={(v) => handleGoalInput('fatG', v)}
      onBlur={() => handleGoalSave('fatG')}
      onSubmitEditing={() => handleGoalSave('fatG')}
      keyboardType="numeric"
      selectTextOnFocus
    />
  </View>
</SectionCard>
```

- [ ] **Step 3: Remove now-unused `saveData` and `KEYS.waterGoal` references from the file**

`KEYS.waterGoal` no longer exists. Check that `loadData` / `saveData` are still needed for other things (they are — mock data uses them). The `waterGoal` state, its effect, and `handleSaveWaterGoal` were removed in step 1.

- [ ] **Step 4: Start expo and manually verify**

```bash
npx expo start
```

Open Settings → scroll to Goals & Targets. Verify:
- All 9 rows render with correct icons and units
- Editing a value and blurring persists it (navigate away and back — value stays)
- × button on Target Weight clears the field and shows placeholder `—`
- NUTRITION TARGETS sub-label appears above Calories

- [ ] **Step 5: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: replace water goal row with Goals & Targets section in settings"
git push
```

---

## Task 4: Health Screen — Water Goal Migration + Weight Target Line

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Replace `KEYS.waterGoal` / `WATER_GOAL_DEFAULT` with `useGoals`**

Add import at the top:
```ts
import { useGoals } from '../lib/useGoals';
```

Remove `const WATER_GOAL_DEFAULT = 2500;` constant.

Inside `HealthScreen`, add:
```ts
const { goals } = useGoals();
```

Remove the `[waterGoal, setWaterGoal]` state and the `loadData<number>(KEYS.waterGoal, WATER_GOAL_DEFAULT).then(setWaterGoal)` call inside `useEffect`. Replace all uses of the local `waterGoal` variable with `goals.waterMl`.

The `useEffect` that animates the fill bar currently reads:
```ts
useEffect(() => {
  const pct = Math.min((waterToday / waterGoal) * 100, 100);
  ...
}, [waterToday, waterGoal]);
```
Change to:
```ts
}, [waterToday, goals.waterMl]);
```
And use `goals.waterMl` inside.

- [ ] **Step 2: Add weight target line overlay**

The weight chart is rendered inside:
```tsx
<View style={[gs.card, { paddingHorizontal: 0, paddingVertical: 12, overflow: 'hidden' }]}>
  <LineChart ... />
</View>
```

Replace that `View`+`LineChart` block with:
```tsx
{(() => {
  const chartW = Math.min(SCREEN_WIDTH - layout.hPadding * 2, layout.maxWidth - layout.hPadding * 2);
  const chartH = 200;
  const weights = periodWeights.map(w => w.kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const targetY = goals.weightTargetKg !== null
    ? ((maxW - goals.weightTargetKg) / range) * (chartH - 40) + 10
    : null;
  return (
    <View style={[gs.card, { paddingHorizontal: 0, paddingVertical: 12, overflow: 'hidden' }]}>
      <View style={{ position: 'relative' }}>
        <LineChart
          data={chartData!}
          width={chartW}
          height={chartH}
          chartConfig={{ backgroundColor: colors.surface, backgroundGradientFrom: colors.surface, backgroundGradientTo: colors.surface, decimalPlaces: 1, color: () => colors.soc, labelColor: () => colors.textMuted, propsForDots: { r: '3', strokeWidth: '1', stroke: colors.soc } }}
          bezier
          style={{ borderRadius: 8 }}
          withInnerLines={false}
          withOuterLines={false}
        />
        {targetY !== null && targetY > 0 && targetY < chartH && (
          <View
            style={{
              position: 'absolute',
              top: targetY,
              left: 0,
              right: 0,
              height: 1,
              borderTopWidth: 1,
              borderTopColor: colors.textMuted,
              borderStyle: 'dashed',
            }}
          >
            <Text style={{ position: 'absolute', right: 8, top: -14, fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>
              Target
            </Text>
          </View>
        )}
      </View>
    </View>
  );
})()}
```

> Note: `borderStyle: 'dashed'` on a `View` works on iOS and web. On Android it may render as solid — acceptable per spec since it's a visual hint only.

- [ ] **Step 3: Start expo and manually verify**

```bash
npx expo start
```

- Open Health → Water tab: water goal ring should still animate correctly using `goals.waterMl`.
- Open Health → Weight tab: add at least 2 weight entries. Set a Target Weight in Settings. Confirm a dashed "Target" line appears on the chart. Clear the target in Settings — line should disappear.

- [ ] **Step 4: Commit**

```bash
git add app/health.tsx
git commit -m "feat: use useGoals for water goal and add weight target line"
git push
```

---

## Task 5: Health Screen — Macro Progress Bars

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Add `MacroBar` helper component** (inside `health.tsx`, above the `HealthScreen` function)

```tsx
function MacroBar({ label, actual, target, color, unit }: {
  label: string; actual: number; target: number; color: string; unit: string;
}) {
  const { colors } = useTheme();
  if (target <= 0) return null;
  const pct = (actual / target) * 100;
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: colors.textSub, fontSize: 12, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: colors.textSub, fontSize: 12 }}>
          {actual.toFixed(0)} / {target} {unit}
          {'  '}
          <Text style={{ color: pct >= 100 ? color : colors.textMuted }}>{pct.toFixed(0)}%</Text>
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: `${Math.min(pct, 100)}%` }} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Insert macro progress section in Nutrition tab**

In the `{activeTab === 'nutrition' && ...}` block, after the "Macro overview card" (`<View style={gs.card}>...</View>` that shows `Today's Totals`) and before the Library/New Food buttons row, insert:

```tsx
{/* Macro progress bars */}
{(goals.calories > 0 || goals.proteinG > 0 || goals.carbsG > 0 || goals.fatG > 0) && (
  <View style={gs.card}>
    <Text style={[gs.cardTitle, { marginBottom: 12 }]}>Progress to Goals</Text>
    <MacroBar label="Calories" actual={totalToday.calories} target={goals.calories} color={colors.vit} unit="kcal" />
    <MacroBar label="Protein"  actual={totalToday.protein}  target={goals.proteinG} color={colors.vit} unit="g" />
    <MacroBar label="Carbs"    actual={totalToday.carbs}    target={goals.carbsG}   color={colors.vit} unit="g" />
    <MacroBar label="Fat"      actual={totalToday.fat}      target={goals.fatG}     color={colors.vit} unit="g" />
  </View>
)}
```

- [ ] **Step 3: Start expo and verify**

```bash
npx expo start
```

- Set Calories/Protein/Carbs/Fat goals in Settings (e.g. 2500 / 150 / 300 / 70).
- Open Health → Food tab. Log some food entries.
- Confirm progress bars render below "Today's Totals" card.
- Confirm a row is hidden when its target is 0.
- Confirm bar fills proportionally; overage (>100%) shows at full width without clipping.

- [ ] **Step 4: Commit**

```bash
git add app/health.tsx
git commit -m "feat: add macro progress bars to nutrition tab"
git push
```

---

## Task 6: Mind Screen — Pomodoro Mode

**Files:**
- Modify: `app/mind.tsx`

- [ ] **Step 1: Add pomodoro state variables**

Inside `MindScreen`, alongside the existing timer state, add:

```ts
const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
const [pomodoroRound, setPomodoroRound] = useState(1);
const [phaseStartSecs, setPhaseStartSecs] = useState(0);
const [workSecsAccum, setWorkSecsAccum] = useState(0);
```

Change the `entryMode` type from `'timer' | 'manual'` to `'timer' | 'pomodoro' | 'manual'`:
```ts
const [entryMode, setEntryMode] = useState<'timer' | 'pomodoro' | 'manual'>('timer');
```

- [ ] **Step 2: Update mode toggle JSX**

Find the mode toggle view:
```tsx
{(['timer', 'manual'] as const).map((mode) => (
```

Replace with:
```tsx
{(['timer', 'pomodoro', 'manual'] as const).map((mode) => (
  <TouchableOpacity
    key={mode}
    onPress={() => {
      setEntryMode(mode);
      // reset pomodoro state on mode switch
      if (mode === 'pomodoro') {
        setPomodoroPhase('work');
        setPomodoroRound(1);
        setPhaseStartSecs(0);
        setWorkSecsAccum(0);
        setElapsedSecs(0);
        setTimerRunning(false);
      }
    }}
    style={[s.modeBtn, {
      backgroundColor: entryMode === mode ? colors.accentDim : colors.surfaceAlt,
      borderColor: entryMode === mode ? colors.accent : colors.border,
    }]}
  >
    <Ionicons
      name={mode === 'timer' ? 'timer-outline' : mode === 'pomodoro' ? 'cafe-outline' : 'create-outline'}
      size={15}
      color={entryMode === mode ? colors.accent : colors.textSub}
    />
    <Text style={[s.modeBtnText, { color: entryMode === mode ? colors.accent : colors.textSub }]}>
      {mode === 'timer' ? 'Timer' : mode === 'pomodoro' ? 'Pomodoro' : 'Log Manually'}
    </Text>
  </TouchableOpacity>
))}
```

- [ ] **Step 3: Add pomodoro phase-transition logic in the timer interval**

Find the `useEffect` that runs the timer interval (the one that increments `elapsedSecs` when `timerRunning`). It likely looks like:

```ts
useEffect(() => {
  if (timerRunning) {
    intervalRef.current = setInterval(() => {
      setElapsedSecs(s => s + 1);
    }, 1000);
  } else {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }
  return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
}, [timerRunning]);
```

Replace the `setElapsedSecs(s => s + 1)` line to also handle pomodoro transitions:

```ts
intervalRef.current = setInterval(() => {
  setElapsedSecs(prev => {
    const next = prev + 1;
    if (entryMode === 'pomodoro') {
      const phaseElapsed = next - phaseStartSecs;
      const phaseDuration = pomodoroPhase === 'work' ? 25 * 60 : 5 * 60;
      if (phaseElapsed >= phaseDuration) {
        if (pomodoroPhase === 'work') {
          setWorkSecsAccum(w => w + phaseDuration);
          setPomodoroPhase('break');
        } else {
          setPomodoroPhase('work');
          setPomodoroRound(r => r + 1);
        }
        setPhaseStartSecs(next);
      }
    }
    return next;
  });
}, 1000);
```

> Note: `entryMode`, `pomodoroPhase`, and `phaseStartSecs` are read inside `setElapsedSecs` callback via closure. Since `entryMode` and `pomodoroPhase` are React state, the interval may close over stale values. To fix, add refs mirroring those values:

Add near the other refs:
```ts
const entryModeRef = useRef(entryMode);
const pomodoroPhaseRef = useRef(pomodoroPhase);
const phaseStartSecsRef = useRef(phaseStartSecs);
```

Add effects to keep them in sync:
```ts
useEffect(() => { entryModeRef.current = entryMode; }, [entryMode]);
useEffect(() => { pomodoroPhaseRef.current = pomodoroPhase; }, [pomodoroPhase]);
useEffect(() => { phaseStartSecsRef.current = phaseStartSecs; }, [phaseStartSecs]);
```

Then in the interval callback, use `entryModeRef.current`, `pomodoroPhaseRef.current`, and `phaseStartSecsRef.current` instead of the state variables.

Full corrected interval:
```ts
intervalRef.current = setInterval(() => {
  setElapsedSecs(prev => {
    const next = prev + 1;
    if (entryModeRef.current === 'pomodoro') {
      const phaseElapsed = next - phaseStartSecsRef.current;
      const phaseDuration = pomodoroPhaseRef.current === 'work' ? 25 * 60 : 5 * 60;
      if (phaseElapsed >= phaseDuration) {
        if (pomodoroPhaseRef.current === 'work') {
          setWorkSecsAccum(w => w + phaseDuration);
          setPomodoroPhase('break');
          pomodoroPhaseRef.current = 'break';
        } else {
          setPomodoroPhase('work');
          pomodoroPhaseRef.current = 'work';
          setPomodoroRound(r => r + 1);
        }
        setPhaseStartSecs(next);
        phaseStartSecsRef.current = next;
      }
    }
    return next;
  });
}, 1000);
```

- [ ] **Step 4: Add Pomodoro ring UI**

Find the `{entryMode === 'timer' && (...TimerRing...)}` block. After it (or as a sibling condition), add:

```tsx
{entryMode === 'pomodoro' && (
  <View style={[gs.card, { alignItems: 'center', paddingVertical: 28 }]}>
    {/* Phase label */}
    <Text style={{ color: pomodoroPhase === 'work' ? colors.foc : colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
      {pomodoroPhase === 'work' ? `WORK · Round ${pomodoroRound}` : 'BREAK'}
    </Text>

    <View style={{ marginVertical: 12 }}>
      {(() => {
        const phaseElapsed = elapsedSecs - phaseStartSecs;
        const phaseDuration = pomodoroPhase === 'work' ? 25 * 60 : 5 * 60;
        const progress = phaseElapsed / phaseDuration;
        return (
          <TimerRing
            progress={progress}
            elapsed={formatTime(phaseDuration - phaseElapsed > 0 ? phaseDuration - phaseElapsed : 0)}
            isRunning={timerRunning}
            color={pomodoroPhase === 'work' ? colors.foc : colors.textMuted}
          />
        );
      })()}
    </View>

    {/* Pause / Resume / Reset */}
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      <TouchableOpacity style={[gs.btnPrimary, { flex: 1, backgroundColor: colors.foc }]} onPress={() => setTimerRunning(r => !r)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={timerRunning ? 'pause' : 'play'} size={16} color="#fff" />
          <Text style={gs.btnPrimaryText}>{timerRunning ? 'Pause' : 'Resume'}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={gs.btnSecondary} onPress={() => {
        setTimerRunning(false);
        setElapsedSecs(0);
        setPomodoroPhase('work');
        setPomodoroRound(1);
        setPhaseStartSecs(0);
        setWorkSecsAccum(0);
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="refresh" size={16} color={colors.text} />
          <Text style={gs.btnSecondaryText}>Reset</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
)}
```

- [ ] **Step 5: Add Pomodoro save section**

Find the existing `{entryMode === 'timer' && elapsedSecs > 0 && (...Session Quality + Save...)}` block.

Find the `saveSession` function (or wherever the timer save logic lives). It should log `Math.round(elapsedSecs / 60)` minutes. You need to handle pomodoro mode separately.

Look for the save call that creates a `MindLog` entry. It will look something like:
```ts
const log: MindLog = { ..., durationMins: Math.round(elapsedSecs / 60), ... };
```

Change it to:
```ts
const durationMins = entryMode === 'pomodoro'
  ? Math.round((workSecsAccum + (pomodoroPhase === 'work' ? elapsedSecs - phaseStartSecs : 0)) / 60)
  : Math.round(elapsedSecs / 60);
const log: MindLog = { ..., durationMins, ... };
```

After save in pomodoro mode, also reset pomodoro state:
```ts
setPomodoroPhase('work');
setPomodoroRound(1);
setPhaseStartSecs(0);
setWorkSecsAccum(0);
```

Add a sibling condition to show the quality/save card for pomodoro mode:
```tsx
{entryMode === 'pomodoro' && (workSecsAccum > 0 || (pomodoroPhase === 'work' && elapsedSecs > phaseStartSecs)) && (
  // Same Session Quality JSX as the timer save block — copy it verbatim
  // Change the displayed minute count to:
  // Math.round((workSecsAccum + (pomodoroPhase === 'work' ? elapsedSecs - phaseStartSecs : 0)) / 60)
)}
```

- [ ] **Step 6: Start expo and verify**

```bash
npx expo start
```

- Open Mind → select Pomodoro mode.
- Start timer. Confirm ring shows countdown to 25:00, phase label shows `WORK · Round 1`, ring color is `colors.foc`.
- Fast-test by temporarily changing `25 * 60` to `10` in the interval logic, then restoring.
- When break phase starts: label shows `BREAK`, ring color changes to `colors.textMuted`.
- Pause/Reset work as expected.
- Save session: only work minutes counted, not break time.

- [ ] **Step 7: Commit**

```bash
git add app/mind.tsx
git commit -m "feat: add Pomodoro mode to Mind screen with phase auto-transition"
git push
```

---

## Task 7: Dashboard — Today Goal Progress Chips

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Add `useGoals` import and hook**

Add import:
```ts
import { useGoals } from '../lib/useGoals';
```

Inside the dashboard component (at the top of the function body), add:
```ts
const { goals } = useGoals();
```

- [ ] **Step 2: Remove `waterGoal` from `todaySummary` and `computeStats`**

In `computeStats`, the `Promise.all` currently fetches `loadData<number>(KEYS.waterGoal, 2500)`. Remove that entry from the array and remove `waterGoal` from the destructured result.

In `setTodaySummary(...)`, remove `waterGoal` from the object.

In `todaySummary` type annotation (the `useState` initial value), remove `waterGoal: number`.

All places that read `todaySummary.waterGoal` should now read `goals.waterMl` instead.

- [ ] **Step 3: Add `TodayChip` component** (inside `index.tsx`, above the main component)

```tsx
function TodayChip({ icon, color, actual, goal, unit }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  actual: number | null;
  goal: number;
  unit: string;
}) {
  const { colors } = useTheme();
  if (goal <= 0) return null;
  const met = actual !== null && actual >= goal;
  const borderColor = met ? color : colors.border;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 8, borderWidth: 1,
      borderColor,
      backgroundColor: colors.surface,
    }}>
      {met ? (
        <Ionicons name="checkmark-circle" size={14} color={color} />
      ) : (
        <Ionicons name={icon} size={14} color={actual === null ? colors.textMuted : color} />
      )}
      {met ? (
        <Text style={{ fontSize: 12, color, fontWeight: '600' }}>Done</Text>
      ) : actual === null ? (
        <Text style={{ fontSize: 12, color: colors.textMuted }}>— / {goal} {unit}</Text>
      ) : (
        <Text style={{ fontSize: 12, color: colors.textSub }}>{actual} / {goal} {unit}</Text>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Insert Today chip row into dashboard JSX**

In the mobile layout (`return` at the bottom of the component), find the `<View style={[ss.header, ...]}>` block. Immediately **after** that closing `</View>`, inside the `ScrollView` (or before the first scrollable content), add:

```tsx
{/* Today Goal Chips */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: layout.hPadding, paddingVertical: 10 }}
  style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
>
  <TodayChip
    icon="footsteps-outline"
    color={colors.str}
    actual={todaySummary.steps > 0 ? todaySummary.steps : null}
    goal={goals.steps}
    unit="steps"
  />
  <TodayChip
    icon="water-outline"
    color={colors.vit}
    actual={todaySummary.water > 0 ? todaySummary.water : null}
    goal={goals.waterMl}
    unit="ml"
  />
  <TodayChip
    icon="moon-outline"
    color={colors.art}
    actual={todaySummary.sleep}
    goal={goals.sleepHours}
    unit="h"
  />
  <TodayChip
    icon="timer-outline"
    color={colors.foc}
    actual={todaySummary.mindMins > 0 ? todaySummary.mindMins : null}
    goal={goals.focusMinutes}
    unit="min"
  />
</ScrollView>
```

For the **web/desktop layout** (the `isWeb` branch, ≥768px), find the equivalent header area and add the same chips but as a wrapping flex row (no horizontal ScrollView):

```tsx
{/* Today Goal Chips — web */}
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: layout.hPadding, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
  <TodayChip icon="footsteps-outline" color={colors.str} actual={todaySummary.steps > 0 ? todaySummary.steps : null} goal={goals.steps} unit="steps" />
  <TodayChip icon="water-outline" color={colors.vit} actual={todaySummary.water > 0 ? todaySummary.water : null} goal={goals.waterMl} unit="ml" />
  <TodayChip icon="moon-outline" color={colors.art} actual={todaySummary.sleep} goal={goals.sleepHours} unit="h" />
  <TodayChip icon="timer-outline" color={colors.foc} actual={todaySummary.mindMins > 0 ? todaySummary.mindMins : null} goal={goals.focusMinutes} unit="min" />
</View>
```

- [ ] **Step 5: Start expo and verify**

```bash
npx expo start
```

- Open Dashboard. Confirm 4 chips appear below the header.
- Log some activity (steps, water, sleep, mind session). Navigate back to Dashboard — chips update.
- Meet a goal — chip shows checkmark and border brightens to the stat color.
- Set a goal to 0 in Settings — that chip disappears.
- On web (≥768px): chips wrap instead of scrolling.

- [ ] **Step 6: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add today goal progress chips to dashboard"
git push
```

---

## Self-Review Checklist

- [x] **Spec coverage**
  - §1 Data Layer: Task 1 + 2 — `Goals` type, `DEFAULT_GOALS`, `KEYS.goalsConfig`, `useGoals` hook, waterGoal migration ✓
  - §2 Settings: Task 3 — all 9 rows, nutrition sub-label, × clear button ✓
  - §3 Health weight target line: Task 4 ✓
  - §3 Health macro progress bars: Task 5 — all 4 rows, `colors.vit`, hidden when target 0, no clipping ✓
  - §4 Mind Pomodoro: Task 6 — phase toggle, auto-transition, work-only save, colors ✓
  - §5 Dashboard chips: Task 7 — 4 chips, goal-met checkmark, null state, goal=0 hidden, mobile scroll / web wrap ✓

- [x] **No placeholders** — all steps include complete code

- [x] **Type consistency**
  - `Goals` defined in Task 1, imported in Tasks 2, 3, 4, 5, 7
  - `useGoals` returns `{ goals: Goals; setGoal }` — consistent across all consumers
  - `KEYS.goalsConfig` used in Task 2 hook — matches definition in Task 1
  - `KEYS.waterGoal` removed in Task 1, all consumers migrated in Tasks 3, 4, 7
  - `TimerRing` props unchanged — `progress, elapsed, isRunning, color` — matches Task 6 usage
