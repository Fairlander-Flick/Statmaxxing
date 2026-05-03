# Statmaxxing — Gamification & Insights Design Spec
**Date:** 2026-05-03  
**Status:** Approved

---

## Overview

Transform Statmaxxing from a passive tracker into an RPG-style progression system with visible stat levels, weekly goals, a streak calendar with journal, dashboard quick-log, and pattern-based insights. The ART stat is removed; the system becomes a clean 5-stat pentagon.

---

## 1. Stat System Overhaul — 5 Stats (ART Removed)

### Stat set
| Key | Name | Color semantic | What it measures |
|-----|------|----------------|-----------------|
| vit | Vitality | `colors.vit` | Sleep, water, weight, nutrition |
| str | Strength | `colors.str` | Workouts, steps |
| foc | Focus | `colors.foc` | Focus sessions, tasks completed |
| soc | Social | `colors.soc` | Time with people |
| dis | Discipline | `colors.dis` | Hitting daily/weekly goals, streaks |

**ART removal impact:**
- `ThemeContext.tsx`: remove `art` color export (keep the hex value as an internal constant if needed for backwards compat, but remove from the public `colors` object)
- `mind.tsx` DEFAULT_ACTIVITIES: Drawing → `foc`, Music → `foc`
- All `statBoost: 'ART'` references in stored `MindActivity` data → treated as `foc` at read time (migration shim in storage loader)
- STAT_OPTS in mind.tsx: remove `ART`
- Score computation (index.tsx): remove ART bucket

---

## 2. Pentagon Radar Chart

A filled radar/spider chart with 5 axes, one per stat. Displayed prominently on the dashboard (Today screen), replacing or sitting above the existing ring row.

**Value source:** Each axis value = today's normalized score for that stat (0–100). Same computation as the existing daily score but broken out per-stat bucket.

**Visual spec:**
- Regular pentagon, vertex labels: VIT / STR / FOC / SOC / DIS
- Filled polygon: semi-transparent fill using `colors.accent + '30'`
- Stroke: `colors.accent`
- Background grid: 3 concentric pentagons at 33%, 66%, 100% — using `colors.border`
- Vertex dots: small filled circles in each stat's semantic color
- Size: ~240px on mobile, ~280px on desktop
- No shadows (Sessiz Keskinlik)

**Component:** `components/PentagonChart.tsx` — pure SVG, accepts `{ vit, str, foc, soc, dis }` (0–100 each).

---

## 3. Stat Levels + XP System

Each of the 5 stats has its own level and XP pool, persisted in `settings:statLevels`.

### XP threshold curve
`threshold(n) = 750 + 250 × 2ⁿ`

| Level | XP to reach next |
|-------|-----------------|
| 1 → 2 | 1,000 |
| 2 → 3 | 1,250 |
| 3 → 4 | 1,750 |
| 4 → 5 | 2,750 |
| 5 → 6 | 4,750 |
| 6 → 7 | 8,750 |

### XP sources (awarded at log time)
| Action | Stat | XP |
|--------|------|----|
| Log sleep | VIT | +10 |
| Log water | VIT | +5 |
| Log weight | VIT | +5 |
| Hit sleep goal | VIT | +15 |
| Hit water goal | VIT | +15 |
| Log workout | STR | +20 |
| Hit step goal | STR | +15 |
| Log workout (hit all goals in session) | STR | +10 bonus |
| 5 min focus session | FOC | +2 (per 5 min, capped at +40/day) |
| Complete a focus task | FOC | +8 |
| Log social time | SOC | +10 |
| Hit ALL daily goals | DIS | +25 |
| Weekly streak +1 | DIS | +30 |

### Storage type
```typescript
type StatLevel = { level: number; xp: number };
type StatLevels = { vit: StatLevel; str: StatLevel; foc: StatLevel; soc: StatLevel; dis: StatLevel };
// Key: settings:statLevels
// Default: all level 1, xp 0
```

### UI
- Dashboard: each stat ring replaced by a level badge + mini XP bar below
- Pentagon chart vertices labeled with "VIT Lv.3"
- Level-up toast (non-blocking, 2 seconds): "⬆ VIT reached Level 4!"

### XP helper — `lib/xp.ts`
- `awardXP(stat, amount): Promise<StatLevels>` — loads, adds XP, handles level-up, saves
- `xpToNextLevel(level): number` — returns threshold for given level
- `computeLevel(totalXp): { level, xp, toNext }` — pure function

---

## 4. Weekly Goals + Streak

### Weekly goals (set in Settings)
```typescript
type WeeklyGoals = {
  focusMinutes: number;    // total focus minutes for the week
  gymSessions: number;     // days with a workout log
  waterMlTotal: number;    // total ml for the week
  caloriesTotal: number;   // total kcal for the week
  stepsTotal: number;      // total steps for the week
};
// Key: settings:weeklyGoals
```

### Weekly streak
- A week = Mon–Sun (ISO week)
- A week is "complete" if ALL weekly goals were hit
- Streak = consecutive complete weeks
- Stored as `settings:weeklyStreak` → `{ current: number; best: number; lastCompleteWeek: string }`
- Computed and updated on app load (check if last week was complete)

### UI
- Dashboard header: "🔥 3-week streak" badge next to the score
- Settings: new "Weekly Goals" section with number inputs

---

## 5. Streak Calendar

A GitHub-style contribution calendar showing the last 90 days (13 weeks × 7 days grid).

**Cell color:** Based on ratio of daily goals hit:
- 0 goals hit → `colors.surfaceAlt` (grey)
- 1–2 → `colors.dis + '40'`
- 3–4 → `colors.dis + '80'`
- All goals hit → `colors.dis` (full)

**Tap a day:** Opens a bottom sheet / modal showing:
- Date header
- Goals hit that day (checkmarks)
- Journal note for that day (if exists)
- Mood score (if logged)
- Quick stat summary (focus mins, steps, sleep)

**Data source:** Reads all log arrays, computes per-day goal hits. No pre-caching needed at this scale (< 365 days of data).

**Placement:** Dashboard, below the pentagon chart, collapsible section titled "History".

---

## 6. Daily Note + Mood

```typescript
type DailyNote = {
  id: string;
  date: string;      // YYYY-MM-DD
  text: string;
  mood: number;      // 1–10
};
// Key: mind:notes (one entry per date, upsert by date)
```

### UI
- Dashboard: a card "How's today?" showing a 1–10 mood picker + text input
- On save: persists note, shows briefly "Saved ✓"
- If today's note already exists: shows existing note pre-filled (editable)
- Past notes accessible by tapping a day in the streak calendar (see §5)

---

## 7. Dashboard Quick Log

Tapping a stat ring or its label on the dashboard opens a compact modal:

| Ring | Modal content |
|------|--------------|
| VIT (water) | +250 / +500 / +750 / custom input → adds to today's water |
| VIT (sleep) | Hours input → saves today's sleep log |
| STR (steps) | Steps input → saves today's step log |

Modal is a small bottom sheet, closes on save. Health and Train screens remain the full entry points for complex data (nutrition, workouts).

---

## 8. Water Preset Buttons

Health screen → Water tab: add three quick-add buttons above the existing form.

Buttons: **+250 ml** / **+500 ml** / **+750 ml**

Each button reads today's water log, adds the increment, saves. Shows updated total immediately.

---

## 9. Weekly Summary

A collapsible card on the dashboard titled "This Week" showing:
- Per-stat: this week's total vs last week's total + delta arrow
- Overall weekly score vs last week
- Weekly goals progress bars
- Placed below streak calendar

---

## 10. Pattern Detection

Runs on 14+ days of data. Computes Pearson-like correlations between:
- Sleep hours vs FOC score next day
- Workout day vs mood score next day  
- Water goal hit vs VIT score

Threshold: only surface an insight if |correlation| > 0.4.

Output: max 2 insight strings, shown in a dashboard "Insights" card. Card hidden if < 14 days of data.

---

## Data Model Summary

### New storage keys
| Key | Type | Where |
|-----|------|-------|
| `settings:statLevels` | `StatLevels` | lib/storage.ts |
| `settings:weeklyGoals` | `WeeklyGoals` | lib/storage.ts |
| `settings:weeklyStreak` | `WeeklyStreakState` | lib/storage.ts |
| `mind:notes` | `DailyNote[]` | lib/storage.ts |

### New files
| File | Purpose |
|------|---------|
| `lib/xp.ts` | XP award, level computation |
| `lib/weeklyStats.ts` | Weekly goal progress, streak check |
| `lib/patterns.ts` | Pattern detection / correlations |
| `components/PentagonChart.tsx` | Radar chart SVG component |

### Modified files
| File | Change |
|------|--------|
| `lib/storage.ts` | Add 4 new types + keys |
| `lib/ThemeContext.tsx` | Remove `art` from colors |
| `app/index.tsx` | Pentagon, levels, calendar, journal card, quick-log, weekly summary, insights |
| `app/mind.tsx` | Remove ART, add XP award on session save, remove ART stat option |
| `app/health.tsx` | Water preset buttons, XP on log |
| `app/train.tsx` | XP on workout/step log |
| `app/social.tsx` | XP on social log |
| `app/settings.tsx` | Weekly goals section |

---

## Implementation Order

1. **ART removal + 5-stat cleanup** (touches many files, do first so everything downstream is consistent)
2. **New storage types** (StatLevels, WeeklyGoals, WeeklyStreak, DailyNote)
3. **`lib/xp.ts`** — XP/level logic
4. **Pentagon chart component**
5. **Dashboard: pentagon + level badges**
6. **XP hooks in health/train/mind/social** (award XP on log)
7. **Weekly goals in Settings**
8. **`lib/weeklyStats.ts`** + weekly streak display on dashboard
9. **Streak calendar component**
10. **Daily note + mood card**
11. **Journal access from calendar**
12. **Dashboard quick-log modals**
13. **Water preset buttons**
14. **Weekly summary card**
15. **`lib/patterns.ts`** + insights card
