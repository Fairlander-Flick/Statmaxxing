# Comprehensive Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 bugs, 10 UX issues, 4 design inconsistencies, and 4 polish items identified across the full codebase.

**Architecture:** All changes are in-place edits to existing files. No new screens — one new shared component (`WeightRangeChart`). No new dependencies. All fixes respect the Sessiz Keskinlik design language and `useTheme()` pattern.

**Tech Stack:** React Native + Expo Router, AsyncStorage, react-native-svg. No test runner.

---

## File Map

| File | Role |
|------|------|
| `lib/ThemeContext.tsx` | Fix hardcoded light-mode-breaking border in `cardCompact` |
| `app/index.tsx` | 6 fixes: stale dates, ring dedup, focus chip, graph persist, note save, empty state |
| `app/health.tsx` | 3 fixes: MacroBar overflow + colors, weight confirm, replace LineChart |
| `app/mind.tsx` | 3 fixes: session opacity, activity delete, task date grouping |
| `app/train.tsx` | 1 fix: Turkish label |
| `app/social.tsx` | 4 fixes: Turkish types, time presets, history view, header kicker |
| `app/settings.tsx` | 1 fix: editable profile name |
| `components/WeightRangeChart.tsx` | New shared component extracted from index.tsx + `targetKg` prop added |
| `lib/storage.ts` | Add `KEYS.profileName`, update `PersonType` to English |
| `lib/mockData.ts` | Update mock person type to English |

---

## Task 1: Fix `cardCompact` light-mode border (B1)

**Files:**
- Modify: `lib/ThemeContext.tsx:159`

- [ ] **Step 1: Replace hardcoded border**

In `makeGlobalStyles`, change `cardCompact.borderColor` from `'rgba(255,255,255,0.07)'` to `c.border`:

```tsx
cardCompact: {
  backgroundColor: c.surfaceAlt,
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 14,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: c.border,  // was: 'rgba(255,255,255,0.07)'
},
```

- [ ] **Step 2: Verify**

Switch to light mode in settings. Compact cards (sleep history, weight history, workout history, mind sessions) should show a visible border consistent with other cards.

- [ ] **Step 3: Commit**

```bash
git add lib/ThemeContext.tsx
git commit -m "fix: cardCompact border uses theme color instead of hardcoded dark value"
```

---

## Task 2: Fix MacroBar overflow + macro progress bar colors (B2, D2)

**Files:**
- Modify: `app/health.tsx:610-630`

- [ ] **Step 1: Cap width and use per-macro colors**

Replace the MacroBar function and the progress bars section (the `(goals.calories > 0 || ...)` block):

```tsx
// Updated progress bars section — each macro gets its semantic color
{(goals.calories > 0 || goals.proteinG > 0 || goals.carbsG > 0 || goals.fatG > 0) && (
  <View style={gs.card}>
    <Text style={[gs.cardTitle, { marginBottom: 12 }]}>Progress to Goals</Text>
    <MacroBar label="Calories" actual={totalToday.calories} target={goals.calories} color={colors.dis} unit="kcal" />
    <MacroBar label="Protein"  actual={totalToday.protein}  target={goals.proteinG} color={colors.foc} unit="g" />
    <MacroBar label="Carbs"    actual={totalToday.carbs}    target={goals.carbsG}   color={colors.str} unit="g" />
    <MacroBar label="Fat"      actual={totalToday.fat}      target={goals.fatG}     color={colors.vit} unit="g" />
  </View>
)}
```

Update `MacroBar` to clamp the width:

```tsx
function MacroBar({ label, actual, target, color, unit }: {
  label: string; actual: number; target: number; color: string; unit: string;
}) {
  const { colors } = useTheme();
  if (target <= 0) return null;
  const pct = Math.min((actual / target) * 100, 100); // clamp at 100%
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
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: `${pct}%` }} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify**

Open Health → Food tab. Log a lot of calories (>2000). Progress bars should stop at 100%, not overflow. Each macro bar (Calories, Protein, Carbs, Fat) should have a distinct color.

- [ ] **Step 3: Commit**

```bash
git add app/health.tsx
git commit -m "fix: MacroBar clamps at 100% width, each macro gets semantic color"
```

---

## Task 3: Fix mind session list opacity crash (B3)

**Files:**
- Modify: `app/mind.tsx:734`

- [ ] **Step 1: Replace opacity formula**

Find the session map block:

```tsx
// BEFORE
style={[gs.card, { padding: 14, marginBottom: 10,
  opacity: 1 - (idx * 0.12),
}]}
```

Replace with a floor at 0.4:

```tsx
// AFTER
style={[gs.card, { padding: 14, marginBottom: 10,
  opacity: Math.max(0.4, 1 - idx * 0.1),
}]}
```

This fades from 1.0 → 0.9 → 0.8 → … → 0.4, never going invisible.

- [ ] **Step 2: Verify**

Log 10+ focus sessions (or use mock data). All sessions in the list should remain legible — oldest ones slightly dimmer but not invisible.

- [ ] **Step 3: Commit**

```bash
git add app/mind.tsx
git commit -m "fix: mind session opacity floors at 0.4 so older sessions stay legible"
```

---

## Task 4: Fix stale `last30` dates after midnight (B4)

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Move `last30` inside `computeStats`**

Remove the module-level line:
```tsx
// DELETE THIS LINE (~line 404):
const last30 = Array.from({ length: 30 }, (_, i) => getDateBefore(29 - i));
```

Add state for the date range:
```tsx
// Add alongside other state declarations:
const [last30Dates, setLast30Dates] = useState<string[]>([]);
```

At the top of `computeStats` (inside the useCallback, before loading data), add:
```tsx
const last30 = Array.from({ length: 30 }, (_, i) => getDateBefore(29 - i));
setLast30Dates(last30);
```

In `renderGraphCard`, replace all references to `last30` with `last30Dates`:
```tsx
// momentum case — date labels:
<Text style={{ fontSize: 10, color: colors.textMuted }}>{last30Dates[0]?.slice(5)}</Text>
<Text style={{ fontSize: 10, color: colors.textMuted }}>{last30Dates[last30Dates.length - 1]?.slice(5)}</Text>
```

- [ ] **Step 2: Verify**

The dates shown in the 30-day momentum chart x-axis should match today's actual date range (not be stale from when the app was launched).

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "fix: compute last30 dates dynamically inside computeStats to avoid stale dates after midnight"
```

---

## Task 5: Remove ring section duplication in dashboard (B5)

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Extract ring items array**

Add a derived variable before `ringSection` is defined (around line 777):

```tsx
const ringItems = [
  { label: 'STEPS', value: todaySummary.steps.toLocaleString(), goal: `/ ${goals.steps.toLocaleString()}`, pct: goals.steps > 0 ? todaySummary.steps / goals.steps : 0, color: colors.str },
  { label: 'WATER', value: `${(todaySummary.water / 1000).toFixed(1)}L`, goal: `/ ${(goals.waterMl / 1000).toFixed(1)}L`, pct: goals.waterMl > 0 ? todaySummary.water / goals.waterMl : 0, color: colors.foc },
  { label: 'SLEEP', value: `${todaySummary.sleep ?? 0}h`, goal: `/ ${goals.sleepHours}h`, pct: goals.sleepHours > 0 ? (todaySummary.sleep ?? 0) / goals.sleepHours : 0, color: colors.vit },
  { label: 'FOCUS', value: `${todaySummary.mindMins}m`, goal: `/ ${goals.focusMinutes}m`, pct: goals.focusMinutes > 0 ? todaySummary.mindMins / goals.focusMinutes : 0, color: colors.accent },
];
```

Update `ringSection` to map over `ringItems`:

```tsx
const ringSection = (
  <View style={[gs.card, { marginBottom: 0 }]}>
    <Text style={[gs.sectionTitle, { marginBottom: 14 }]}>RINGS</Text>
    <View style={ss.ringGrid}>
      {ringItems.map(r => (
        <RingCard key={r.label}
          label={r.label} value={r.value} goal={r.goal} pct={r.pct}
          color={r.color} trackColor={colors.border}
          borderColor={colors.border}
          surfaceColor={isDesktop ? colors.surfaceAlt : colors.surface}
          textColor={colors.text} textMutedColor={colors.textMuted}
        />
      ))}
    </View>
  </View>
);
```

In the **mobile render** (around line 1270), replace the duplicate inline ring grid:

```tsx
// REMOVE this entire block (the inline <View style={[ss.ringGrid...]}> with 4 RingCards):
<View style={[ss.ringGrid, { marginBottom: 12 }]}>
  {[...].map(r => ( <RingCard ... /> ))}
</View>

// REPLACE WITH:
<View style={[ss.ringGrid, { marginBottom: 12 }]}>
  {ringItems.map(r => (
    <RingCard key={r.label}
      label={r.label} value={r.value} goal={r.goal} pct={r.pct}
      color={r.color} trackColor={colors.border} borderColor={colors.border}
      surfaceColor={colors.surface}
      textColor={colors.text} textMutedColor={colors.textMuted}
    />
  ))}
</View>
```

- [ ] **Step 2: Verify**

Both mobile and desktop dashboard show the same 4 rings with correct values. No visual regression.

- [ ] **Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "refactor: extract ringItems array to eliminate ring section duplication"
```

---

## Task 6: Focus chip quick log (U1)

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Extend modal state type**

```tsx
// Change:
const [quickLogModal, setQuickLogModal] = useState<'water' | 'sleep' | 'steps' | null>(null);
// To:
const [quickLogModal, setQuickLogModal] = useState<'water' | 'sleep' | 'steps' | 'focus' | null>(null);
```

- [ ] **Step 2: Add `quickLogFocus` function** (after `quickLogSteps`):

```tsx
const quickLogFocus = async (minutes: number) => {
  const logs = await loadData<MindLog[]>(KEYS.mindLogs, []);
  const existing = logs.filter(l => l.date === today && l.activityName === 'Quick Log');
  const totalExisting = existing.reduce((s, l) => s + l.durationMinutes, 0);
  await appendToList<MindLog>(KEYS.mindLogs, {
    id: generateId(), date: today,
    activityId: 'quick', activityName: 'Quick Log',
    statBoost: 'FOC', durationMinutes: minutes, feelingScore: 7,
  });
  await awardXP('foc', Math.min(Math.floor(minutes / 5) * 2, 40));
  await computeStats();
};
```

This requires `MindLog` and `appendToList` to be imported — both are already imported in index.tsx (`appendToList` from storage, `MindLog` from storage). Verify the imports at the top of the file.

- [ ] **Step 3: Wrap Focus TodayChip in both mobile and desktop renders**

In mobile render (around line 1261):
```tsx
// BEFORE:
<TodayChip icon="timer-outline" color={colors.foc} actual={todaySummary.mindMins > 0 ? todaySummary.mindMins : null} goal={goals.focusMinutes} unit="min" />

// AFTER:
<TouchableOpacity onPress={() => setQuickLogModal('focus')}>
  <TodayChip icon="timer-outline" color={colors.foc} actual={todaySummary.mindMins > 0 ? todaySummary.mindMins : null} goal={goals.focusMinutes} unit="min" />
</TouchableOpacity>
```

Apply the same wrapper in the desktop chip row (around line 1177).

- [ ] **Step 4: Add QuickLogModal for focus** (in both mobile and desktop return blocks, alongside the other 3 modals):

```tsx
<QuickLogModal
  visible={quickLogModal === 'focus'}
  title="Log Focus"
  unit="min"
  presets={[15, 25, 45]}
  onSave={quickLogFocus}
  onClose={() => setQuickLogModal(null)}
/>
```

- [ ] **Step 5: Verify**

Tap the focus chip on dashboard. A modal appears with 15/25/45 min presets. Saving updates the focus chip value and the TODAY card.

- [ ] **Step 6: Commit**

```bash
git add app/index.tsx
git commit -m "feat: focus chip opens quick log modal with 15/25/45 min presets"
```

---

## Task 7: Persist graph selector preferences (U2)

**Files:**
- Modify: `app/index.tsx`
- Modify: `lib/storage.ts`

- [ ] **Step 1: Add storage key**

In `lib/storage.ts`, add to the `KEYS` object:

```ts
// In KEYS object, under Settings section:
selectedGraphs: 'settings:selectedGraphs',
```

- [ ] **Step 2: Load and save graph selection in index.tsx**

Replace the current `useState`:
```tsx
// BEFORE:
const [selectedGraphs, setSelectedGraphs] = useState<string[]>(['momentum', 'compare']);

// AFTER:
const [selectedGraphs, setSelectedGraphs] = useState<string[]>(['momentum', 'compare']);

useEffect(() => {
  loadData<string[]>(KEYS.selectedGraphs, ['momentum', 'compare']).then(setSelectedGraphs);
}, []);
```

Replace `toggleGraph`:
```tsx
const toggleGraph = async (id: string) => {
  const next = selectedGraphs.includes(id)
    ? selectedGraphs.filter(g => g !== id)
    : [...selectedGraphs, id];
  setSelectedGraphs(next);
  await saveData(KEYS.selectedGraphs, next);
};
```

Make `toggleGraph` async — since it's used in an `onPress`, the async is fine without awaiting in JSX.

- [ ] **Step 3: Verify**

Select some graphs (e.g. sleep + weight). Refresh the page. The same graphs should still be selected.

- [ ] **Step 4: Commit**

```bash
git add lib/storage.ts app/index.tsx
git commit -m "feat: persist graph selector preferences to AsyncStorage"
```

---

## Task 8: Allow mood-only daily note save (U3)

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Update `saveDailyNote` to allow empty text**

```tsx
const saveDailyNote = async () => {
  const notes = await loadData<DailyNote[]>(KEYS.dailyNotes, []);
  const existing = notes.find(n => n.date === today);
  let updated: DailyNote[];
  const text = noteText.trim();
  if (existing) {
    updated = notes.map(n => n.date === today ? { ...n, text, mood: noteMood } : n);
  } else {
    updated = [...notes, { id: generateId(), date: today, text, mood: noteMood }];
  }
  await saveData(KEYS.dailyNotes, updated);
  setDailyNotes(updated);
  setNoteSaved(true);
  setTimeout(() => setNoteSaved(false), 2000);
};
```

- [ ] **Step 2: Remove the `disabled` constraint on the Save button**

```tsx
// BEFORE:
<TouchableOpacity
  onPress={saveDailyNote}
  disabled={!noteText.trim()}
  style={[gs.btnPrimary, { marginTop: 12, opacity: noteText.trim() ? 1 : 0.4 }]}
>

// AFTER:
<TouchableOpacity
  onPress={saveDailyNote}
  style={[gs.btnPrimary, { marginTop: 12 }]}
>
```

- [ ] **Step 3: Verify**

Set a mood (e.g. 8), leave the text field empty, tap Save Note. No crash. The note saves with empty text. The button is always active.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "fix: allow saving daily note with mood only, no text required"
```

---

## Task 9: Dashboard empty state for new users (U6)

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Compute whether user has any data**

Add a derived boolean after the state declarations:

```tsx
const hasAnyData = todaySummary.sleep !== null
  || todaySummary.water > 0
  || todaySummary.steps > 0
  || todaySummary.workouts > 0
  || todaySummary.mindMins > 0;
```

- [ ] **Step 2: Add empty state below the ring grid in mobile render**

After the ring grid and before `{pentagonCard}`, insert:

```tsx
{!hasAnyData && (
  <View style={[gs.card, { alignItems: 'center', paddingVertical: 28, marginBottom: 0 }]}>
    <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
      Nothing logged yet today.{'\n'}Tap a chip above to get started.
    </Text>
  </View>
)}
```

Do the same for the desktop layout (insert after the ring section in the left column, before `{todayLog}`):

```tsx
{!hasAnyData && (
  <View style={[gs.card, { alignItems: 'center', paddingVertical: 20 }]}>
    <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
      Nothing logged yet today.{'\n'}Tap a chip above to get started.
    </Text>
  </View>
)}
```

- [ ] **Step 3: Verify**

Clear all log data from Settings, then open the dashboard. A hint card appears beneath the rings. After logging anything, the card disappears.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "feat: show empty state hint on dashboard when no data logged today"
```

---

## Task 10: Language consistency — fix all Turkish labels (U5, D3)

**Files:**
- Modify: `app/train.tsx:215`
- Modify: `app/train.tsx:138`
- Modify: `app/mind.tsx:270`
- Modify: `app/health.tsx:213`
- Modify: `app/social.tsx:126`

- [ ] **Step 1: Fix `train.tsx`**

Change the reset button label:
```tsx
// BEFORE (line ~215):
<Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Bugünü Sıfırla</Text>
// AFTER:
<Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Reset Today</Text>
```

Change the header kicker:
```tsx
// BEFORE (line ~138):
<Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
  Güç
</Text>
// AFTER:
<Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
  Strength
</Text>
```

- [ ] **Step 2: Fix `mind.tsx` header kicker**

```tsx
// BEFORE:
Odak
// AFTER:
Focus
```

- [ ] **Step 3: Fix `health.tsx` header kicker**

```tsx
// BEFORE:
Vitalite
// AFTER:
Vitality
```

- [ ] **Step 4: Fix `social.tsx` header kicker**

```tsx
// BEFORE:
Sosyal
// AFTER:
Social
```

- [ ] **Step 5: Verify**

All screen headers show English kicker text. The Train screen reset button says "Reset Today".

- [ ] **Step 6: Commit**

```bash
git add app/train.tsx app/mind.tsx app/health.tsx app/social.tsx
git commit -m "fix: replace Turkish UI labels with English (kickers, reset button)"
```

---

## Task 11: Fix Social PersonType English storage (D4)

**Files:**
- Modify: `lib/storage.ts`
- Modify: `app/social.tsx`
- Modify: `lib/mockData.ts`

- [ ] **Step 1: Update `PersonType` in storage.ts**

Find the PersonType definition and update:

```ts
// In lib/storage.ts
export type PersonType = 'Family' | 'Friend' | 'Pet' | 'Other';
```

- [ ] **Step 2: Update all PersonType usage in `social.tsx`**

```tsx
const PERSON_TYPES: PersonType[] = ['Family', 'Friend', 'Pet', 'Other'];

const TYPE_ICON: Record<PersonType, React.ComponentProps<typeof Ionicons>['name']> = {
  Family: 'home-outline', Friend: 'people-outline', Pet: 'paw-outline', Other: 'person-outline',
};

// Remove TYPE_DISPLAY — types are already English, use them directly
// Replace all TYPE_DISPLAY[p.type] references with just p.type
```

In the `SocialScreen` component, replace `TYPE_DISPLAY[p.type]` with `p.type` everywhere it appears.

Update TYPE_COLOR:
```tsx
const TYPE_COLOR: Record<PersonType, string> = {
  Family: colors.vit, Friend: colors.soc, Pet: colors.str, Other: colors.textSub,
};
```

Remove the `TYPE_DISPLAY` constant entirely since it's no longer needed.

- [ ] **Step 3: Update mock data**

In `lib/mockData.ts`, find the dummy person definition:

```ts
// BEFORE:
const dummyPerson = existingPeople.length ? existingPeople[0] : { id: 's1', name: 'Alperen', type: 'Arkadaş', closeness: 8 };
// AFTER:
const dummyPerson = existingPeople.length ? existingPeople[0] : { id: 's1', name: 'Alperen', type: 'Friend', closeness: 8 };
```

- [ ] **Step 4: Verify**

Go to Social → People. Add a new person. The type buttons show Family / Friend / Pet / Other. Existing Turkish-stored persons will show their raw Turkish value — use Settings → Clear All Data to reset if testing with clean state.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts app/social.tsx lib/mockData.ts
git commit -m "fix: PersonType values changed to English (Family/Friend/Pet/Other)"
```

---

## Task 12: Weight delete confirmation (U4)

**Files:**
- Modify: `app/health.tsx`

- [ ] **Step 1: Add `Alert` import**

`Alert` is already imported in health.tsx (check line 4). If not present, add it to the import line.

- [ ] **Step 2: Wrap `deleteWeightLog` with confirmation**

```tsx
const deleteWeightLog = async (id: string) => {
  Alert.alert('Remove', 'Remove this weight entry?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Remove', style: 'destructive', onPress: async () => {
        const updated = weightHistory.filter((l) => l.id !== id);
        await saveData(KEYS.weightLogs, updated);
        setWeightHistory(updated);
      },
    },
  ]);
};
```

- [ ] **Step 3: Verify**

In Health → Weight, tap the trash icon on a logged weight. An "Are you sure?" dialog appears. Cancelling does nothing; Remove deletes the entry.

- [ ] **Step 4: Commit**

```bash
git add app/health.tsx
git commit -m "fix: weight log deletion requires confirmation alert"
```

---

## Task 13: Extract WeightRangeChart and replace Health chart (D1)

**Files:**
- Create: `components/WeightRangeChart.tsx`
- Modify: `app/index.tsx` (remove inline definition, add import)
- Modify: `app/health.tsx` (replace LineChart with WeightRangeChart)

- [ ] **Step 1: Create `components/WeightRangeChart.tsx`**

Extract the `WeightRangeChart` function from `app/index.tsx` (lines ~254-372). Add a `targetKg` prop:

```tsx
import { useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { PanResponder } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';

type DayPoint = { date: string; value: number };

interface Props {
  data: DayPoint[];
  chartWidth?: number;
  targetKg?: number;
}

export default function WeightRangeChart({ data, chartWidth, targetKg }: Props) {
  const { colors } = useTheme();
  const w = chartWidth ?? 300;
  const H = 120;
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const startIdx = useRef(0);

  const xToIdx = (x: number) => Math.max(0, Math.min(data.length - 1, Math.round((x / w) * (data.length - 1))));
  const xForIdx = (i: number) => (i / Math.max(data.length - 1, 1)) * w;

  const kgValues = data.map(d => d.value).filter(v => v > 0);
  const minKg = kgValues.length ? Math.min(...kgValues) - 0.5 : 60;
  const maxKg = kgValues.length ? Math.max(...kgValues) + 0.5 : 100;
  const kgRange = maxKg - minKg || 1;
  const yForKg = (kg: number) => H - ((kg - minKg) / kgRange) * H;

  const pathD = data
    .filter(d => d.value > 0)
    .map((d, i) => {
      const origIdx = data.indexOf(d);
      return `${i === 0 ? 'M' : 'L'} ${xForIdx(origIdx)},${yForKg(d.value)}`;
    })
    .join(' ');

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const idx = xToIdx(evt.nativeEvent.locationX);
      startIdx.current = idx;
      setRange({ start: idx, end: idx });
    },
    onPanResponderMove: (evt) => {
      const idx = xToIdx(evt.nativeEvent.locationX);
      setRange({ start: Math.min(startIdx.current, idx), end: Math.max(startIdx.current, idx) });
    },
    onPanResponderRelease: () => {},
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => true,
    onShouldBlockNativeResponder: () => false,
  })).current;

  const selInfo = (() => {
    if (!range || range.start === range.end) return null;
    const fromKg = data[range.start]?.value;
    const toKg = data[range.end]?.value;
    if (!fromKg || !toKg) return null;
    const delta = toKg - fromKg;
    const pct = (delta / fromKg) * 100;
    const days = range.end - range.start;
    return { delta, pct, from: fromKg, to: toKg, days };
  })();

  const selColor = selInfo ? (selInfo.delta <= 0 ? colors.green : colors.red) : colors.accent;
  const targetY = targetKg !== undefined && targetKg !== null
    ? yForKg(Math.max(minKg, Math.min(maxKg, targetKg)))
    : null;

  return (
    <View>
      {selInfo ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '400', color: selColor }}>
            {selInfo.delta > 0 ? '+' : ''}{selInfo.delta.toFixed(2)} kg
          </Text>
          <Text style={{ fontSize: 13, color: selColor, paddingBottom: 3 }}>
            {selInfo.delta > 0 ? '+' : ''}{selInfo.pct.toFixed(1)}%
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, paddingBottom: 3 }}>
            {selInfo.from.toFixed(1)} → {selInfo.to.toFixed(1)} kg · {selInfo.days}d
          </Text>
        </View>
      ) : (
        <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>
          Drag to select a range
        </Text>
      )}
      <View
        {...panResponder.panHandlers}
        {...(Platform.OS === 'web' ? {
          onMouseDown: (e: any) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const idx = xToIdx(e.clientX - rect.left);
            startIdx.current = idx;
            setRange({ start: idx, end: idx });
          },
          onMouseMove: (e: any) => {
            if (e.buttons !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const idx = xToIdx(e.clientX - rect.left);
            setRange({ start: Math.min(startIdx.current, idx), end: Math.max(startIdx.current, idx) });
          },
        } : {})}
      >
        <Svg width={w} height={H}>
          {range && range.start !== range.end && (
            <Rect
              x={xForIdx(range.start)} y={0}
              width={xForIdx(range.end) - xForIdx(range.start)} height={H}
              fill={selColor + '18'}
            />
          )}
          {data.length > 1 && pathD && (
            <Path d={pathD} stroke={colors.soc} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          )}
          {targetY !== null && (
            <Line
              x1={0} y1={targetY} x2={w} y2={targetY}
              stroke={colors.textMuted} strokeWidth="1" strokeDasharray="4,4"
            />
          )}
          {range && data[range.start]?.value > 0 && (
            <Circle cx={xForIdx(range.start)} cy={yForKg(data[range.start].value)} r={4} fill={selColor} />
          )}
          {range && range.start !== range.end && data[range.end]?.value > 0 && (
            <Circle cx={xForIdx(range.end)} cy={yForKg(data[range.end].value)} r={4} fill={selColor} />
          )}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>{data[0]?.date.slice(5)}</Text>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>{data[data.length - 1]?.date.slice(5)}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Update `app/index.tsx`**

Remove the inline `WeightRangeChart` function definition (lines ~254-372).

Add import at the top:
```tsx
import WeightRangeChart from '../components/WeightRangeChart';
```

The `renderGraphCard` `'weight'` case already calls `<WeightRangeChart data={weightData} chartWidth={innerW} />` — no change needed there.

- [ ] **Step 3: Update `app/health.tsx`**

Remove the `LineChart` import:
```tsx
// REMOVE:
import { LineChart } from 'react-native-chart-kit';
```

Add WeightRangeChart import:
```tsx
import WeightRangeChart from '../components/WeightRangeChart';
```

Replace the entire `{chartData && (() => { ... })()}` block (the one with `LineChart`) with:

```tsx
{periodWeights.length >= 2 && (() => {
  const chartW = Math.min(SCREEN_WIDTH - layout.hPadding * 2, layout.maxWidth - layout.hPadding * 2);
  const chartData = periodWeights.map(w => ({ date: w.date, value: w.kg }));
  return (
    <View style={[gs.card, { paddingVertical: 16 }]}>
      <WeightRangeChart
        data={chartData}
        chartWidth={chartW}
        targetKg={goals.weightTargetKg ?? undefined}
      />
    </View>
  );
})()}
```

- [ ] **Step 4: Verify**

Health → Weight tab shows the draggable range chart (same as dashboard). Target weight line appears when set in Settings. No more LineChart. Dashboard weight chart still works.

- [ ] **Step 5: Commit**

```bash
git add components/WeightRangeChart.tsx app/index.tsx app/health.tsx
git commit -m "refactor: extract WeightRangeChart to shared component, replace react-native-chart-kit in health screen"
```

---

## Task 14: Mind activity delete (U7)

**Files:**
- Modify: `app/mind.tsx`

- [ ] **Step 1: Add `deleteActivity` function**

After `addActivity`:
```tsx
const deleteActivity = async (id: string) => {
  const updated = activities.filter(a => a.id !== id);
  await saveData(KEYS.mindActivities, updated);
  setActivities(updated);
  if (selectedActivity?.id === id) setSelectedActivity(null);
};
```

- [ ] **Step 2: Add delete button to each activity chip**

In the activity picker ScrollView, wrap each chip in a View with a small delete button. Replace the current chip render:

```tsx
{activities.map((a) => {
  const isActive = selectedActivity?.id === a.id;
  const statCol = STAT_COLOR[a.statBoost] ?? colors.accent;
  const actIcon = ACT_ICONS[a.name] ?? 'star';
  return (
    <View key={a.id} style={{ position: 'relative' }}>
      <TouchableOpacity
        style={[s.activityChip, {
          borderColor: isActive ? statCol + '80' : colors.border,
          backgroundColor: isActive ? statCol + '18' : colors.surface,
        }]}
        onPress={() => setSelectedActivity(a)}
      >
        <View style={[s.chipIconWrap, { backgroundColor: statCol + '20' }]}>
          <Ionicons name={actIcon} size={14} color={statCol} />
        </View>
        <Text style={[s.activityText, { color: isActive ? statCol : colors.text }]}>{a.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteActivity(a.id)}
        style={{
          position: 'absolute', top: -6, right: -6,
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
          alignItems: 'center', justifyContent: 'center',
        }}
        hitSlop={6}
      >
        <Ionicons name="close" size={10} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
})}
```

- [ ] **Step 3: Verify**

Each activity chip has a small `×` badge in the top-right corner. Tapping it removes the activity from the list and from storage. If the deleted activity was selected, the selection clears.

- [ ] **Step 4: Commit**

```bash
git add app/mind.tsx
git commit -m "feat: mind activities can be deleted via × badge on each chip"
```

---

## Task 15: Mind task date grouping (U10)

**Files:**
- Modify: `app/mind.tsx`

- [ ] **Step 1: Separate today's tasks from older ones**

Replace the `pendingTasks` and `doneTasks` derivations:

```tsx
const pendingTasks = tasks.filter((t) => !t.done);
const doneTasks = tasks.filter((t) => t.done);
// Add:
const todayPendingTasks = pendingTasks.filter(t => t.createdAt === today);
const olderPendingTasks = pendingTasks.filter(t => t.createdAt !== today);
```

- [ ] **Step 2: Update the task list render**

In the task rows section, split the render:

```tsx
{/* Today's tasks */}
{todayPendingTasks.map((task) => <TaskRow key={task.id} task={task} ... />)}

{/* Older tasks — shown as a backlog section */}
{olderPendingTasks.length > 0 && (
  <>
    <View style={{
      paddingHorizontal: 16, paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8 }}>
        BACKLOG · {olderPendingTasks.length}
      </Text>
    </View>
    {olderPendingTasks.map((task) => <TaskRow key={task.id} task={task} ... />)}
  </>
)}

{/* Done tasks */}
{doneTasks.map((task) => <TaskRow key={task.id} task={task} ... />)}
```

To avoid repeating the task row JSX, extract a `TaskRow` inner component:

```tsx
// Define before the return statement:
const TaskRow = ({ task }: { task: FocusTask }) => {
  const isActive = activeTaskId === task.id;
  return (
    <TouchableOpacity
      onPress={() => !task.done && setActiveTaskId(isActive ? null : task.id)}
      activeOpacity={task.done ? 1 : 0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: isActive ? colors.foc + '0d' : 'transparent',
      }}
    >
      <TouchableOpacity onPress={() => toggleTask(task.id)} hitSlop={8}>
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={task.done ? colors.foc : colors.border}
        />
      </TouchableOpacity>
      <Text style={{
        flex: 1, fontSize: 14,
        color: task.done ? colors.textMuted : colors.text,
        textDecorationLine: task.done ? 'line-through' : 'none',
        fontWeight: isActive ? '600' : '400',
      }}>
        {task.text}
      </Text>
      {isActive && (
        <View style={{ backgroundColor: colors.foc + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.foc }}>FOCUS</Text>
        </View>
      )}
      <TouchableOpacity onPress={() => deleteTask(task.id)} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
```

- [ ] **Step 3: Verify**

Add tasks on different days (or manually change `createdAt` in storage). Tasks from today appear first. Tasks from earlier days appear under a "BACKLOG · N" section header.

- [ ] **Step 4: Commit**

```bash
git add app/mind.tsx
git commit -m "feat: mind tasks grouped by today vs backlog (older tasks)"
```

---

## Task 16: Social time presets (U8)

**Files:**
- Modify: `app/social.tsx`

- [ ] **Step 1: Add quick-add buttons above the minutes input**

Find the `selectedPersonId && (...)` section that shows the time input card. Add quick buttons above the TextInput:

```tsx
{selectedPersonId && (
  <View style={gs.card}>
    <Text style={[gs.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>
      Time spent with {people.find((p) => p.id === selectedPersonId)?.name}
    </Text>
    <View style={fw}>
      {/* Quick presets */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[15, 30, 60, 90].map(mins => (
          <TouchableOpacity
            key={mins}
            onPress={async () => {
              const person = people.find((p) => p.id === selectedPersonId);
              if (!person) return;
              const updated = await appendToList<SocialLog>(KEYS.socialLogs, { id: generateId(), date: today, personId: selectedPersonId, personName: person.name, minutes: mins });
              setAllSocialLogs(updated);
              setTodayLogs(updated.filter((l) => l.date === today));
              setSelectedPersonId(null);
              await awardXP('soc', 10);
            }}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 10,
              backgroundColor: colors.soc + '15',
              borderWidth: 1, borderColor: colors.soc + '40',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.soc }}>{mins}m</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={gs.input} placeholder="Custom minutes…" placeholderTextColor={colors.textSub} keyboardType="numeric" value={minutes} onChangeText={setMinutes} />
      <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.soc }]} onPress={logTime}>
        <Text style={gs.btnPrimaryText}>Log Time</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

- [ ] **Step 2: Verify**

Select a person in Social → Log Time. Four preset buttons (15m, 30m, 60m, 90m) appear. Tapping one immediately logs the time and deselects the person.

- [ ] **Step 3: Commit**

```bash
git add app/social.tsx
git commit -m "feat: social log shows 15/30/60/90 min quick-add presets"
```

---

## Task 17: Social interaction history view (U9)

**Files:**
- Modify: `app/social.tsx`

- [ ] **Step 1: Add 'history' to the view toggle**

Update the toggle to include a third option:

```tsx
// State:
const [activeView, setActiveView] = useState<'log' | 'people' | 'history'>('log');

// Toggle buttons — add 'history':
{(['log', 'people', 'history'] as const).map((v) => (
  <TouchableOpacity key={v}
    style={[s.toggleBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      activeView === v && { backgroundColor: colors.soc + '22', borderColor: colors.soc }]}
    onPress={() => setActiveView(v)}>
    <Ionicons
      name={v === 'log' ? 'time-outline' : v === 'people' ? 'people-outline' : 'calendar-outline'}
      size={18}
      color={activeView === v ? colors.soc : colors.textSub}
    />
    <Text style={[s.toggleBtnText, { color: activeView === v ? colors.soc : colors.textSub }]}>
      {v === 'log' ? 'Log Time' : v === 'people' ? 'People' : 'History'}
    </Text>
  </TouchableOpacity>
))}
```

- [ ] **Step 2: Add history view content**

After the `{activeView === 'people' && (...)}` block, add:

```tsx
{/* ── HISTORY ── */}
{activeView === 'history' && (() => {
  // Group last 14 days of logs by date
  const last14: string[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const logsByDate = last14.map(date => ({
    date,
    logs: allSocialLogs.filter(l => l.date === date),
    total: allSocialLogs.filter(l => l.date === date).reduce((s, l) => s + l.minutes, 0),
  })).filter(d => d.logs.length > 0);

  if (logsByDate.length === 0) {
    return (
      <View style={[gs.card, { alignItems: 'center', paddingVertical: 32 }]}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>No social logs in the last 14 days.</Text>
      </View>
    );
  }

  return (
    <>
      {logsByDate.map(({ date, logs, total }) => (
        <View key={date} style={[gs.card, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
            </Text>
            <Text style={{ fontSize: 12, color: colors.soc, fontWeight: '600' }}>{total} min total</Text>
          </View>
          {logs.map(l => (
            <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
              <Avatar name={l.personName} color={colors.soc} />
              <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{l.personName}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.soc }}>{l.minutes} min</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
})()}
```

Ensure `StyleSheet` is imported from react-native (it already is).

- [ ] **Step 3: Verify**

Social → History tab shows the last 14 days of interactions grouped by date, with person avatars and times. Days with no logs are skipped.

- [ ] **Step 4: Commit**

```bash
git add app/social.tsx
git commit -m "feat: social history tab shows last 14 days of interactions grouped by date"
```

---

## Task 18: Settings editable profile name (S1)

**Files:**
- Modify: `lib/storage.ts`
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add profile name storage key**

In `lib/storage.ts`:
```ts
// In KEYS object:
profileName: 'settings:profileName',
```

- [ ] **Step 2: Add editable name in settings**

In `app/settings.tsx`, add state:
```tsx
const [profileName, setProfileName] = useState('Athlete');
const [editingName, setEditingName] = useState(false);
```

Add effect to load name:
```tsx
useEffect(() => {
  loadData<string>(KEYS.profileName, 'Athlete').then(setProfileName);
}, []);
```

Replace the hardcoded profile card name text with an editable field:
```tsx
{/* In the profile card, replace the static name: */}
{editingName ? (
  <TextInput
    style={[gs.input, { marginBottom: 0, flex: 1, fontSize: 16, fontWeight: '600' }]}
    value={profileName}
    onChangeText={setProfileName}
    onBlur={async () => {
      setEditingName(false);
      await saveData(KEYS.profileName, profileName.trim() || 'Athlete');
    }}
    autoFocus
    returnKeyType="done"
    onSubmitEditing={async () => {
      setEditingName(false);
      await saveData(KEYS.profileName, profileName.trim() || 'Athlete');
    }}
  />
) : (
  <TouchableOpacity onPress={() => setEditingName(true)} style={{ flex: 1 }}>
    <Text style={[s.profileName, { color: colors.text }]}>{profileName}</Text>
    <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>Tap to edit</Text>
  </TouchableOpacity>
)}
```

- [ ] **Step 3: Verify**

Settings → profile card shows the name. Tapping it opens an inline text input. Typing a new name and pressing Done or blurring saves it. Reloading the app preserves the name.

- [ ] **Step 4: Commit**

```bash
git add lib/storage.ts app/settings.tsx
git commit -m "feat: profile name in settings is editable and persisted"
```

---

## Task 19: Pomodoro haptic + sleep history limit (S2, S3)

**Files:**
- Modify: `app/mind.tsx`
- Modify: `app/health.tsx`

- [ ] **Step 1: Add haptic on pomodoro phase end**

At the top of `app/mind.tsx`, add import:
```tsx
import { Vibration } from 'react-native';
```

In the interval effect, after `setPhaseStartSecs(elapsed);`, add:
```tsx
Vibration.vibrate(400);
```

Full context (inside the `if (phaseElapsed >= phaseDuration)` block):
```tsx
if (phaseElapsed >= phaseDuration) {
  Vibration.vibrate(400); // haptic pulse on phase transition
  if (pomodoroPhaseRef.current === 'work') {
    setWorkSecsAccum(w => w + phaseDuration);
    setPomodoroPhase('break');
    pomodoroPhaseRef.current = 'break';
  } else {
    setPomodoroPhase('work');
    pomodoroPhaseRef.current = 'work';
    setPomodoroRound(r => r + 1);
  }
  setPhaseStartSecs(elapsed);
  phaseStartSecsRef.current = elapsed;
}
```

- [ ] **Step 2: Increase sleep history limit**

In `app/health.tsx`, the sleep history is loaded with `.slice(-10).reverse()`. Change to 30:

```tsx
// In the loadData effect:
setSleepHistory(logs.slice(-30).reverse());

// In saveSleep:
setSleepHistory(updated.slice(-30).reverse());

// In deleteSleepLog:
setSleepHistory(updated.slice(-30).reverse());
```

- [ ] **Step 3: Verify**

Pomodoro: set a 25-min work session, wait for phase end — device vibrates once. Sleep history shows up to 30 entries.

- [ ] **Step 4: Commit**

```bash
git add app/mind.tsx app/health.tsx
git commit -m "feat: pomodoro vibrates on phase end; sleep history shows up to 30 entries"
```

---

## Self-Review Checklist

**Spec coverage:**
- B1 ✅ cardCompact border → Task 1
- B2 ✅ MacroBar overflow → Task 2
- B3 ✅ mind session opacity → Task 3
- B4 ✅ stale last30 dates → Task 4
- B5 ✅ ring duplication → Task 5
- U1 ✅ focus chip tap → Task 6
- U2 ✅ graph selector persist → Task 7
- U3 ✅ mood-only note save → Task 8
- U4 ✅ weight delete confirm → Task 12
- U5 ✅ Turkish "Bugünü Sıfırla" → Task 10
- U6 ✅ empty state → Task 9
- U7 ✅ activity delete → Task 14
- U8 ✅ social time presets → Task 16
- U9 ✅ social history → Task 17
- U10 ✅ task date grouping → Task 15
- D1 ✅ health chart replacement → Task 13
- D2 ✅ macro bar colors → Task 2
- D3 ✅ header kickers → Task 10
- D4 ✅ PersonType English → Task 11
- S1 ✅ profile name → Task 18
- S2 ✅ pomodoro haptic → Task 19
- S3 ✅ sleep history limit → Task 19
- S4 (art stat unused) — acknowledged, no action: removing it would require a storage migration; it exists as a reserved theme color

**No placeholders detected.**

**Type consistency:** `DayPoint` type is defined in index.tsx and duplicated in WeightRangeChart.tsx — both define `{ date: string; value: number }`. This is intentional since they're local to each file.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-04-comprehensive-improvements.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
