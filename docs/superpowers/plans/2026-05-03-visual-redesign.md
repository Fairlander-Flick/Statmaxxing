# Visual Redesign — Elevated Sessiz Keskinlik (Slate Cool) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the warm-brown dark palette with the Slate Cool color system, enforce a 5-level typography scale, add 3-tier card hierarchy, update gamification visuals, and apply consistent screen headers across all 6 screens.

**Architecture:** ThemeContext is the foundation — all color tokens, typography constants, and card style variants live there. Screens then use `useTheme()` + `makeGlobalStyles()` exclusively. No new data types or storage keys are needed; this is purely a visual layer change.

**Tech Stack:** React Native, Expo Router, react-native-svg, `lib/ThemeContext.tsx` (`makeGlobalStyles` / `useTheme`), `lib/useLayout.ts`.

**Parallelization:** Tasks 1 and 2 must be done first (in order). After Task 2 is committed, Tasks 3–9 are independent and can be dispatched in parallel.

---

## Task 1: Slate Cool color tokens + typography scale + card variants in ThemeContext

**Files:**
- Modify: `lib/ThemeContext.tsx`
- Modify: `lib/useLayout.ts`

### Color tokens

- [ ] **Step 1: Update `DARK_COLORS` in `lib/ThemeContext.tsx`**

Replace the entire `DARK_COLORS` object with:

```typescript
export const DARK_COLORS = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceAlt: '#222535',
  surfaceElevated: '#2a2e40',
  border: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.13)',
  text: '#ffffff',
  textSub: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.44)',
  accent: '#c2827a',
  accentHover: '#d4968e',
  accentDim: 'rgba(194,130,122,0.14)',
  // Semantic metric colors
  vit: '#7eaacc',
  str: '#c08878',
  foc: '#8aaa8a',
  art: '#8ca8c4',
  soc: '#c0a878',
  dis: '#c4aa80',
  // Neutral alternatives
  green: '#8aa388',
  greenDim: 'rgba(138,163,136,0.15)',
  orange: '#c4aa80',
  orangeDim: 'rgba(196,170,128,0.15)',
  purple: '#8ca8c4',
  purpleDim: 'rgba(140,168,196,0.15)',
  red: '#c27070',
  redDim: 'rgba(194,112,112,0.15)',
  yellow: '#c4aa80',
};
```

- [ ] **Step 2: Update `makeGlobalStyles` — typography scale, card variants, spacing**

Replace the entire `makeGlobalStyles` function body with:

```typescript
export function makeGlobalStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    // ── Typography scale ────────────────────────────────────────────────────
    typoDisplay: {
      fontSize: 48, fontWeight: '900' as const, letterSpacing: -2,
    },
    typoHeading: {
      fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3,
    },
    typoLabel: {
      fontSize: 11, fontWeight: '600' as const, letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    typoBody: {
      fontSize: 14, fontWeight: '400' as const, letterSpacing: 0,
    },
    typoCaption: {
      fontSize: 11, fontWeight: '400' as const, letterSpacing: 0,
    },
    // ── Card hierarchy ──────────────────────────────────────────────────────
    // Standard card — most cards
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    // Compact card — log rows (icon + date + value)
    cardCompact: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.07)',
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: c.text,
      marginBottom: 8,
      letterSpacing: -0.1,
    },
    // Section label — 11px uppercase
    label: {
      fontSize: 11,
      color: c.textMuted,
      marginBottom: 6,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: c.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 4,
    },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      color: c.text,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      marginBottom: 12,
    },
    btnPrimary: {
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center' as const,
      backgroundColor: c.accent,
    },
    btnPrimaryText: {
      color: '#fff',
      fontWeight: '600' as const,
      fontSize: 14,
      letterSpacing: 0.1,
    },
    btnSecondary: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnSecondaryText: {
      color: c.text,
      fontWeight: '500' as const,
      fontSize: 14,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: c.text,
      marginBottom: 2,
      letterSpacing: -0.3,
    },
    screenSub: {
      fontSize: 14,
      color: c.textSub,
      marginBottom: 20,
      fontWeight: '400' as const,
    },
    pill: {
      backgroundColor: c.accentDim,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pillText: {
      color: c.accent,
      fontWeight: '600' as const,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
  });
}
```

- [ ] **Step 3: Update `lib/useLayout.ts` — mobile hPadding 16 → 20**

In `lib/useLayout.ts`, find the `if (width < 600)` block and change `hPadding: 16` to `hPadding: 20`, and `inputMaxWidth: width - 32` to `inputMaxWidth: width - 40`:

```typescript
  if (width < 600) {
    breakpoint = 'mobile';
    maxWidth = width;
    hPadding = 20;
    inputMaxWidth = width - 40;
    statColumns = 3;
  }
```

- [ ] **Step 4: Commit**

```bash
git add lib/ThemeContext.tsx lib/useLayout.ts
git commit -m "feat: apply Slate Cool color system + typography scale + card variants"
```

---

## Task 2: PentagonChart — colored spokes, stroke weight, double-ring dots

**Files:**
- Modify: `components/PentagonChart.tsx`

- [ ] **Step 1: Update spoke lines to use per-stat colors at 30% opacity**

In the `Svg` block where spoke lines are rendered (`fullPts.map`), change from using `colors.border` to the stat color at 30% opacity:

```tsx
{fullPts.map(([x, y], i) => (
  <Line key={i} x1={cx} y1={cy} x2={x} y2={y}
    stroke={STAT_COLORS[STAT_ORDER[i]] + '4d'}
    strokeWidth={1} />
))}
```
(0x4d = 77 ≈ 30% of 255)

- [ ] **Step 2: Update data polygon — stroke 2px at 60% opacity, fill 12% opacity**

Replace the `<Polygon>` for `statPts`:

```tsx
<Polygon
  points={toSvgPoints(statPts)}
  fill={colors.accent + '1f'}
  stroke={colors.accent + '99'}
  strokeWidth={2}
/>
```
(0x1f = 31 ≈ 12%; 0x99 = 153 ≈ 60%)

- [ ] **Step 3: Replace stat dots with double-ring style**

Replace the single `<Circle>` per stat point with a double-ring:

```tsx
{statPts.map(([x, y], i) => (
  <React.Fragment key={i}>
    <Circle cx={x} cy={y} r={5}
      fill={colors.bg}
      stroke={STAT_COLORS[STAT_ORDER[i]]}
      strokeWidth={2}
    />
    <Circle cx={x} cy={y} r={2.5}
      fill={STAT_COLORS[STAT_ORDER[i]]}
    />
  </React.Fragment>
))}
```

Make sure `React` is imported: `import React from 'react';` is already at line 1.

- [ ] **Step 4: Commit**

```bash
git add components/PentagonChart.tsx
git commit -m "feat: pentagon chart colored spokes, double-ring dots, 2px stroke"
```

---

## Task 3: Custom bottom tab bar in `_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

The goal is to replace the default Expo tab bar on mobile with a custom component that shows an active pill background and a 2px top indicator. The sidebar on web is unchanged.

- [ ] **Step 1: Add `CustomTabBar` component above `Sidebar`**

After the `TABS` array and before `function Sidebar()`, add:

```tsx
function CustomTabBar({ state, descriptors, navigation }: {
  state: any; descriptors: any; navigation: any;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: 8,
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;
        const tab = TABS.find(t => t.name === route.name);
        if (!tab) return null;

        return (
          <TouchableOpacity
            key={route.key}
            style={{ flex: 1, alignItems: 'center' }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            activeOpacity={0.8}
          >
            <View style={{
              alignItems: 'center',
              backgroundColor: isFocused ? colors.accent + '1a' : 'transparent',
              borderRadius: 12,
              paddingVertical: 6,
              paddingHorizontal: 4,
              width: 52,
            }}>
              {isFocused && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  width: 20,
                  height: 2,
                  backgroundColor: colors.accent,
                  borderBottomLeftRadius: 2,
                  borderBottomRightRadius: 2,
                }} />
              )}
              <Ionicons
                name={isFocused ? tab.iconFilled : tab.icon}
                size={20}
                color={isFocused ? colors.accent : colors.textSub}
                style={{ opacity: isFocused ? 1 : 0.35 }}
              />
              <Text style={{
                fontSize: 9,
                fontWeight: isFocused ? '700' : '400',
                color: isFocused ? colors.accent : colors.textSub,
                marginTop: 2,
                opacity: isFocused ? 1 : 0.35,
              }}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: Update `AppContent` to use `CustomTabBar` on mobile**

In `AppContent`, replace the `<Tabs screenOptions={{ ... }}>` block. The key changes:
- Add `tabBar` prop for non-desktop
- Remove hardcoded warm-brown bg from `tabBarStyle` and use theme colors
- Remove the old `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarLabelStyle`

```tsx
  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop ? { display: 'none' } : { display: 'none' },
      }}
      tabBar={(props) => isDesktop ? <View /> : <CustomTabBar {...props} />}
    >
      {/* All Tabs.Screen entries unchanged */}
```

Note: set `tabBarStyle: { display: 'none' }` for both cases since we're rendering the tab bar via `tabBar` prop instead.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: custom bottom tab bar with pill bg and top indicator"
```

---

## Task 4: Dashboard `app/index.tsx` — spotlight card, XP bars, level badges, header

**Files:**
- Modify: `app/index.tsx`

### 4a. Spotlight card for top daily metric

The spec says: "Spotlight card for today's top metric — whichever of sleep%, water%, or steps% is highest against its goal."

- [ ] **Step 1: Add a `SpotlightTopMetric` derived value in the component body**

After the `const today = toDay();` line and derived section, add:

```typescript
  const spotlightMetric = (() => {
    const sleepPct = goals.sleepHours > 0 ? (todaySummary.sleep ?? 0) / goals.sleepHours : 0;
    const waterPct = goals.waterMl > 0 ? todaySummary.water / goals.waterMl : 0;
    const stepsPct = goals.steps > 0 ? todaySummary.steps / goals.steps : 0;
    if (sleepPct >= waterPct && sleepPct >= stepsPct) {
      return { label: 'SLEEP', value: `${todaySummary.sleep ?? 0}h`, pct: sleepPct, color: colors.vit, icon: 'moon' as const };
    }
    if (waterPct >= stepsPct) {
      return { label: 'WATER', value: `${(todaySummary.water / 1000).toFixed(1)}L`, pct: waterPct, color: colors.foc, icon: 'water' as const };
    }
    return { label: 'STEPS', value: todaySummary.steps.toLocaleString(), pct: stepsPct, color: colors.str, icon: 'footsteps' as const };
  })();
```

- [ ] **Step 2: Add a `spotlightCard` block (inline JSX variable)**

After the `const todayLog = (...)` block, add:

```tsx
  const spotlightCard = (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: spotlightMetric.color + '59',
      overflow: 'hidden',
    }}>
      {/* Top edge */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: spotlightMetric.color }} />
      {/* Label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: spotlightMetric.color }} />
        <Text style={{ fontSize: 9, fontWeight: '700', color: spotlightMetric.color, letterSpacing: 1, textTransform: 'uppercase' }}>
          TODAY'S BEST
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <Text style={{ fontSize: 48, fontWeight: '900', color: spotlightMetric.color, letterSpacing: -2, lineHeight: 52 }}>
          {spotlightMetric.value}
        </Text>
        <View style={{ paddingBottom: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
            {spotlightMetric.label}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 2 }}>
            {Math.round(spotlightMetric.pct * 100)}% of goal
          </Text>
        </View>
      </View>
    </View>
  );
```

- [ ] **Step 3: Insert `spotlightCard` in both mobile and desktop render**

In the mobile render (inside the ScrollView's content View), add `{spotlightCard}` immediately before the ring grid:
```tsx
          {spotlightCard}
          <View style={[ss.ringGrid, { marginBottom: 16 }]}>
```

In the desktop left column, add `{spotlightCard}` at the top:
```tsx
            <View style={{ width: 340, gap: 12 }}>
              {spotlightCard}
              {ringSection}
              {pentagonCard}
              {todayLog}
            </View>
```

### 4b. XP bars — 6px height, per-stat color, no flexWrap

- [ ] **Step 4: Update the `pentagonCard` XP bar section**

Find the XP bar View inside `pentagonCard`:
```tsx
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' }}>
        {(['vit', 'str', 'dis', 'soc', 'foc'] as const).map(stat => {
          const sl = statLevels[stat];
          const pct = xpProgress(sl);
          const statColor = colors[stat];
          return (
            <View key={stat} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: statColor, letterSpacing: 0.5 }}>{stat.toUpperCase()}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Lv.{sl.level}</Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(pct * 100)}%` as any, height: 4, borderRadius: 2, backgroundColor: statColor }} />
              </View>
            </View>
          );
        })}
      </View>
```

Replace with (6px bars, stat color fills, `LevelBadge` replacing "Lv.X" text):

```tsx
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' }}>
        {(['vit', 'str', 'dis', 'soc', 'foc'] as const).map(stat => {
          const sl = statLevels[stat];
          const pct = xpProgress(sl);
          const statColor = colors[stat];
          return (
            <View key={stat} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: statColor, letterSpacing: 0.5 }}>{stat.toUpperCase()}</Text>
                <View style={{
                  backgroundColor: statColor + '26',
                  borderWidth: 1, borderColor: statColor + '59',
                  borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
                }}>
                  <Text style={{ color: statColor, fontSize: 8, fontWeight: '700' }}>{sl.level}</Text>
                </View>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(pct * 100)}%` as any, height: 6, borderRadius: 3, backgroundColor: statColor }} />
              </View>
            </View>
          );
        })}
      </View>
```

### 4c. Typography + spacing cleanup

- [ ] **Step 5: Update `gs.card` usages' `marginBottom` from 12 to 16 where hardcoded**

Search for `marginBottom: 12` or `marginBottom: 0` in inline card style overrides and normalize. Key places: `ringSection`, `pentagonCard`, `weeklySummaryCard`. The `gs.card` already has `marginBottom: 16` after Task 1, so remove any inline `marginBottom: 12` overrides that override it downward.

Specifically in `pentagonCard`:
```tsx
  const pentagonCard = (
    <View style={[gs.card, { alignItems: 'center', paddingVertical: 24 }]}>
```
(Remove `marginBottom: 0` override if present — the default 16 is correct.)

In `ringSection`:
```tsx
  const ringSection = (
    <View style={gs.card}>
```
(Remove `marginBottom: 0`.)

- [ ] **Step 6: Commit**

```bash
git add app/index.tsx
git commit -m "feat: dashboard spotlight card, 6px stat XP bars with level badges"
```

---

## Task 5: Health screen `app/health.tsx` — header, spotlight sleep, compact log rows

**Files:**
- Modify: `app/health.tsx`

### 5a. Screen header

- [ ] **Step 1: Replace the existing `<View style={[s.header, ...]}>` block**

Current header renders "HEALTH TRACKER" + tab-name title. Replace with the new pattern:

```tsx
      <View style={[s.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.vit }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Vitalite
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.vit, letterSpacing: -0.3 }}>
            {activeTabConfig.label}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={activeTabConfig.icon} size={18} color={colors.vit} />
        </View>
      </View>
```

Also update `s.headerTitle` in the local StyleSheet (remove the old 22px/800 definition since it's no longer used):

Remove `headerTitle` and `headerSub` from the `s` StyleSheet at the bottom of the file since they're no longer referenced.

### 5b. Sleep Spotlight card

- [ ] **Step 2: Replace the sleep summary card with a Spotlight card**

Find the `{todaySleep !== null && (...)}` block inside `{activeTab === 'sleep' && (`:

```tsx
              {todaySleep !== null && (
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1.5,
                  borderColor: colors.vit + '59',
                  overflow: 'hidden',
                }}>
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.vit }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.vit }} />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.vit, letterSpacing: 1, textTransform: 'uppercase' }}>
                      TONIGHT'S SLEEP
                    </Text>
                  </View>
                  <Text style={{ fontSize: 48, fontWeight: '900', color: colors.vit, letterSpacing: -2 }}>
                    {Number.isInteger(todaySleep) ? todaySleep : Number(todaySleep).toFixed(1)}h
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4 }}>Logged ✓</Text>
                </View>
              )}
```

### 5c. Log rows → Compact cards

- [ ] **Step 3: Update sleep history log rows to use compact card style**

Find `{sleepHistory.map((w) => (` block:

```tsx
                  {sleepHistory.map((w) => (
                    <View key={w.id} style={[gs.cardCompact, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 8,
                        backgroundColor: colors.art + '26',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name="moon" size={14} color={colors.art} />
                      </View>
                      <Text style={{ fontSize: 14, color: colors.textSub }}>{w.date}</Text>
                      <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: colors.art }}>
                        {Number.isInteger(w.hours) ? w.hours : Number(w.hours).toFixed(1)}h
                      </Text>
                      <TouchableOpacity onPress={() => deleteSleepLog(w.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={17} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
```

- [ ] **Step 4: Update weight history log rows to compact card style**

Find `{weightHistory.slice(-10).reverse().map((w) => (` block:

```tsx
                  {weightHistory.slice(-10).reverse().map((w) => (
                    <View key={w.id} style={[gs.cardCompact, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 8,
                        backgroundColor: colors.soc + '26',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name="scale" size={14} color={colors.soc} />
                      </View>
                      <Text style={{ fontSize: 14, color: colors.textSub }}>{w.date}</Text>
                      <Text style={{ flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700', color: colors.soc }}>
                        {w.kg} kg
                      </Text>
                      <TouchableOpacity onPress={() => deleteWeightLog(w.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={17} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
```

### 5d. Typography updates

- [ ] **Step 5: Update `s.bigStat` and `s.headerTitle` in the local `s` StyleSheet**

Remove `headerSub` and `headerTitle` from `const s = StyleSheet.create({...})` since they're no longer referenced after Step 1.

Update `bigStat`:
```typescript
  bigStat: { fontSize: 48, fontWeight: '900' as const, letterSpacing: -2, lineHeight: 54 },
```

- [ ] **Step 6: Commit**

```bash
git add app/health.tsx
git commit -m "feat: health screen header, spotlight sleep card, compact log rows"
```

---

## Task 6: Train screen `app/train.tsx` — header, spotlight workout, typography

**Files:**
- Modify: `app/train.tsx`

### 6a. Screen header (home view only)

The train screen has 3 views: home, create, run. Apply the header pattern only to the home view.

- [ ] **Step 1: Replace the `screenTitle`/`screenSub` block at the top of the home view**

Find the home view JSX (inside `if (view === 'home')`). Replace:
```tsx
            <Text style={gs.screenTitle}>Train</Text>
            <Text style={gs.screenSub}>Your workout programs</Text>
```

With the screen header pattern as an inline View (no separate header bar on this screen; the existing layout uses ScrollView without a fixed header):

```tsx
            <View style={{ paddingBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.str }} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Güç
                </Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.str, letterSpacing: -0.3 }}>
                Train
              </Text>
            </View>
```

### 6b. Recent workout log rows → Compact cards

- [ ] **Step 2: Update workout log rows**

Find `{workoutLogs.map((log) => (` block:

```tsx
                {workoutLogs.map((log) => (
                  <View key={log.id} style={[gs.cardCompact, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: colors.str + '26',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name="barbell" size={14} color={colors.str} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{log.programName}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{log.dayLabel} · {log.date}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteWorkoutLog(log.id)} style={{ padding: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))}
```

### 6c. Spotlight card for today's workout (if logged)

- [ ] **Step 3: Add a spotlight card before the "Create Program" button**

Check if any `workoutLogs` entry has `date === toDay()`:

```tsx
            {workoutLogs.find(l => l.date === toDay()) ? (
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1.5,
                borderColor: colors.str + '59',
                overflow: 'hidden',
              }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.str }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.str }} />
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.str, letterSpacing: 1, textTransform: 'uppercase' }}>
                    TODAY'S WORKOUT
                  </Text>
                </View>
                {(() => {
                  const todayLog = workoutLogs.find(l => l.date === toDay())!;
                  return (
                    <>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.str, letterSpacing: -0.3 }}>
                        {todayLog.programName}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4 }}>
                        {todayLog.dayLabel} · {todayLog.sets.length} exercises
                      </Text>
                    </>
                  );
                })()}
              </View>
            ) : (
              <View style={gs.card}>
                <Text style={[gs.sectionTitle, { marginBottom: 8 }]}>TODAY</Text>
                <Text style={{ fontSize: 14, color: colors.textMuted }}>No workout logged yet</Text>
              </View>
            )}
```

Insert this JSX block before `<View style={fw}>` (the Create Program button block) in the home view.

- [ ] **Step 4: Commit**

```bash
git add app/train.tsx
git commit -m "feat: train screen header, spotlight today workout, compact log rows"
```

---

## Task 7: Mind screen `app/mind.tsx` — header, spotlight focus session, typography

**Files:**
- Modify: `app/mind.tsx`

First read the full file to understand existing structure, then apply:

- [ ] **Step 1: Read `app/mind.tsx` fully to locate header and today's session display**

```bash
# no command needed — read via Read tool
```

- [ ] **Step 2: Add screen header**

Find the top of the main screen return (after `<SafeAreaView>`). Add the header View before the scroll content:

```tsx
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.foc }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Odak
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foc, letterSpacing: -0.3 }}>
            Focus
          </Text>
        </View>
      </View>
```

- [ ] **Step 3: Add spotlight card for today's focus session if any minutes logged today**

After loading today's logs, the screen computes today's total. Wrap the today's session display in a spotlight card. Locate the "today's focus" summary display and replace with:

```tsx
      {todayMins > 0 && (
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: colors.foc + '59',
          overflow: 'hidden',
        }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.foc }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.foc }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.foc, letterSpacing: 1, textTransform: 'uppercase' }}>
              TODAY'S FOCUS
            </Text>
          </View>
          <Text style={{ fontSize: 48, fontWeight: '900', color: colors.foc, letterSpacing: -2 }}>
            {todayMins}m
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4 }}>Focus time logged</Text>
        </View>
      )}
```

Note: The exact variable name for today's focus minutes in `mind.tsx` may differ — check the file and use the actual state variable name (likely computed from `mindLogs` filtered to today).

- [ ] **Step 4: Commit**

```bash
git add app/mind.tsx
git commit -m "feat: mind screen header, spotlight today focus session"
```

---

## Task 8: Social screen `app/social.tsx` — header, spotlight top interaction

**Files:**
- Modify: `app/social.tsx`

- [ ] **Step 1: Add screen header**

After `<SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>`, add the header before the existing content:

```tsx
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.soc }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Sosyal
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.soc, letterSpacing: -0.3 }}>
            People
          </Text>
        </View>
      </View>
```

- [ ] **Step 2: Add spotlight card for today's top interaction**

In the `log` view, add before the log input form: if `todayLogs.length > 0`, show a spotlight card for the longest interaction today:

```tsx
      {activeView === 'log' && todayLogs.length > 0 && (() => {
        const top = todayLogs.reduce((a, b) => a.minutes > b.minutes ? a : b);
        const person = people.find(p => p.id === top.personId);
        return (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1.5,
            borderColor: colors.soc + '59',
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.soc }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.soc }} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.soc, letterSpacing: 1, textTransform: 'uppercase' }}>
                TODAY'S TOP INTERACTION
              </Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.soc, letterSpacing: -0.3 }}>
              {person?.name ?? 'Someone'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 4 }}>
              {top.minutes} min · {top.activity}
            </Text>
          </View>
        );
      })()}
```

Note: Insert this inside the main ScrollView content, in the `'log'` view section. Find the exact structure by reading the file.

- [ ] **Step 3: Commit**

```bash
git add app/social.tsx
git commit -m "feat: social screen header, spotlight today top interaction"
```

---

## Task 9: Settings screen `app/settings.tsx` — typography scale, card types

**Files:**
- Modify: `app/settings.tsx`

The settings screen uses `SectionCard` + `SettingRow` local components. It has no Spotlight card (no daily metric).

- [ ] **Step 1: Read the full `app/settings.tsx` to understand structure**

After reading, apply these changes:

- [ ] **Step 2: Update screen header**

Settings uses `gs.screenTitle` for its title. The spec says "Settings — textMuted color, no badge". Find the screen title text and update:

Locate where the screen title is rendered (there may be a `Text` with `gs.screenTitle`). Replace with:

```tsx
          <View style={{ paddingBottom: 20 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Configuration
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              Settings
            </Text>
          </View>
```

- [ ] **Step 3: Ensure `SectionCard` uses the correct style**

The existing `SectionCard` component uses `s.sectionCard` which may have `borderRadius: 12` and `borderColor: colors.border`. Verify it matches the Standard card spec (12px radius, 1px border, `colors.border`) — it should already be correct after Task 1 updates `colors.border`.

- [ ] **Step 4: Update any hardcoded `fontSize: 10` section labels to 11**

Search the file for `fontSize: 10` used on section headers (uppercase labels) and update to `fontSize: 11`.

- [ ] **Step 5: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: settings screen header and typography scale"
```

---

## Self-Review Checklist

### Spec coverage

| Spec section | Task | Status |
|---|---|---|
| 1. Slate Cool color tokens | Task 1 | ✓ |
| 2. Typography scale (5 levels) | Task 1 | ✓ |
| 3. Spacing grid (hPadding 20) | Task 1 | ✓ |
| 4a. Spotlight card | Tasks 4–8 | ✓ |
| 4b. Standard card | Task 1 (gs.card) | ✓ |
| 4c. Compact card (log rows) | Tasks 5–6 | ✓ |
| 5a. Pentagon chart spokes/dots | Task 2 | ✓ |
| 5b. XP bars 6px, per-stat color | Task 4 | ✓ |
| 5c. Level badge | Task 4 | ✓ |
| 6a. Bottom tab bar custom | Task 3 | ✓ |
| 6b. Screen headers | Tasks 5–9 | ✓ |
| 7. Per-screen Spotlight card | Tasks 4–8 | ✓ |

### Missing items / notes

- **`art` color in `DARK_COLORS`**: The spec updates `vit`, `str`, `foc`, `art`, `soc`, `dis`. Task 1 updates `art` to `#8ca8c4`. Also `LIGHT_COLORS.dis` and `LIGHT_COLORS.soc` share the same value — leave light mode untouched per spec.
- **`mind.tsx` today's minutes variable**: Read the file in Task 7 Step 1 to confirm the exact state variable name before applying the spotlight card.
- **`social.tsx` log structure**: The `SocialLog` type has `personId`, `minutes`, `activity` — confirm field names in `lib/storage.ts` before writing the spotlight card JSX.
- **Compact card `overflow`**: `cardCompact` doesn't need `overflow: 'hidden'` — only spotlight cards do (for the top-edge absolute line).
- **No `shadowColor`, `elevation`, `box-shadow`** — confirm no such properties are added in any task.

### Type consistency

- `gs.cardCompact` is defined in Task 1 and used in Tasks 5–6 ✓
- `colors.vit`, `colors.str`, etc. updated in Task 1, referenced in Tasks 2–9 ✓
- `colors.accent + '1a'` (10% opacity hex) used in Task 3 custom tab bar ✓
- `spotlightMetric.color + '59'` (35% opacity) used consistently for spotlight card borders ✓
