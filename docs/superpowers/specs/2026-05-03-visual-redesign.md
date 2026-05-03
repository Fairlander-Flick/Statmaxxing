# Statmaxxing — Visual Redesign Spec

**Date:** 2026-05-03  
**Approach:** Elevated Sessiz Keskinlik — same warm/minimal philosophy, but with a real design system underneath  
**Color Theme:** Slate Cool  
**Scope:** All screens (index, health, train, mind, social, settings) + shared components

---

## 1. Color System — Slate Cool

Replace the current warm-brown palette in `lib/ThemeContext.tsx` dark mode with:

| Token | Old | New | Role |
|---|---|---|---|
| `bg` | `#13100e` | `#0f1117` | App background |
| `surface` | `#1a1410` | `#1a1d27` | Card background |
| `surfaceAlt` | `#201c17` | `#222535` | Secondary surface, input bg |
| `border` | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.09)` | Card borders |
| `text` | `#e8e0d6` | `#ffffff` | Primary text |
| `textSub` | `#e8e0d6` at 72% | `#ffffffb8` | Secondary text |
| `textMuted` | `#e8e0d6` at 48% | `#ffffff70` | Muted / captions |
| `accent` | `#c2827a` | `#c2827a` | Keep — fits both warm and cool |
| `accentDim` | warm tint | `rgba(194,130,122,0.14)` | Accent fill |

Semantic stat colors — slightly more saturated to pop on darker bg:

| Stat | Old | New |
|---|---|---|
| `vit` | `#7ea0bc` | `#7eaacc` |
| `str` | `#b08070` | `#c08878` |
| `foc` | `#8a9b8a` | `#8aaa8a` |
| `art` | `#8c98a8` | `#8ca8c4` |
| `soc` | `#b09870` | `#c0a878` |
| `dis` | `#c4a679` | `#c4aa80` |

Light mode: no changes — already uses neutral beige (`#f7f4f0`), works fine with the new dark mode.

---

## 2. Typography Scale

Add a `typography` export to `lib/ThemeContext.tsx` (or inline as constants in `makeGlobalStyles`). Five levels, used consistently across all screens:

| Name | Size | Weight | Letter-spacing | Use |
|---|---|---|---|---|
| `display` | 48px | 900 | -2px | Big stat numbers (sleep hours, calories, weight) |
| `heading` | 20px | 700 | -0.3px | Screen titles, card main titles |
| `label` | 11px | 600 | +1px | Section headers ("THIS WEEK", "STAT PROFILE") — uppercase |
| `body` | 14px | 400 | 0 | List items, descriptions, form labels |
| `caption` | 11px | 400 | 0 | Timestamps, secondary info, muted detail |

**Rules:**
- Section title labels: always `label` size + uppercase + `textMuted` color. Never 10px.
- Screen header title: always `heading` size (20px/700), colored with the screen's stat color.
- Log list values: `body` size, stat color, `700` weight.
- Never use font sizes outside this scale (remove all ad-hoc `fontSize: 17`, `fontSize: 22`, `fontSize: 52` except for `display` stat numbers).

---

## 3. Spacing Grid

All padding, gap, and margin values must be multiples of 4px. Canonical values:

| Token | Value | Use |
|---|---|---|
| `space.micro` | 4px | Icon gap, tight inline |
| `space.xs` | 8px | Inner card element gap |
| `space.sm` | 12px | Small card padding, row gap |
| `space.md` | 16px | **Card padding (all cards)**, gap between cards |
| `space.lg` | 20px | Screen horizontal padding |
| `space.xl` | 24px | Section gap (between card groups) |
| `space.2xl` | 32px | Top-of-screen breathing room |

Enforce: all `hPadding` → 20px, Standard card `padding` → 16px, Spotlight card `padding` → 20px, all card-to-card `gap` → 16px, section gaps → 24px.

---

## 4. Card Hierarchy

Three card variants, used consistently. Add to `makeGlobalStyles` in `lib/ThemeContext.tsx`:

### 4a. Spotlight Card
Used for the single most important metric on each screen. Max **one per screen**.

- `background`: `surface`
- `border`: 1.5px, stat color at 35% opacity
- Top edge: 2px horizontal line in stat color (absolute positioned, 0 opacity elsewhere)
- `padding`: 20px
- `borderRadius`: 14px
- Label: stat color, 9px, 700 weight, uppercase, with a 6px colored dot prefix

### 4b. Standard Card
Most cards — grouped info, weekly summaries, forms.

- `background`: `surface`
- `border`: 1px, `border` token
- `padding`: 16px
- `borderRadius`: 12px
- No colored border (neutral)

### 4c. Compact Card (log row)
Dense list items: icon + date + value on one line.

- `background`: `surfaceAlt`
- `border`: 1px, `border` token at 75% opacity
- `padding`: 10px 14px
- `borderRadius`: 10px
- Icon wrap: 28×28px, 8px borderRadius, stat color at 15% bg
- Value: `body` size, stat color, 700 weight, right-aligned

---

## 5. Gamification UI

### 5a. Pentagon Chart (`components/PentagonChart.tsx`)
- Spoke lines: each colored with its stat color at 30% opacity (not all neutral gray)
- Data polygon stroke: 2px (up from 1.5px), accent color at 60% opacity
- Data polygon fill: accent at 12% opacity (down from 28% — looks cleaner on dark bg)
- Stat dots: double-ring style — outer circle (r=5) filled with `bg` + stat color stroke (2px); inner dot (r=2.5) filled with stat color

### 5b. XP Progress Bars (`app/index.tsx` — pentagonCard)
- Height: 6px (up from 4px)
- Track: `surfaceAlt` background
- Fill: each bar uses its own stat color (not all the same color)
- Layout: `flexDirection: 'row'`, **no `flexWrap`**, `flex: 1` on each item — all 5 bars in one row, equal width
- No `minWidth` constraint

### 5c. Level Badge
Replace `"Lv.{n}"` plain text with a small badge component:

```
┌─────────┐
│   1     │  ← stat color, 8px bold
└─────────┘
  outline border: stat color 35%
  background: stat color 15%
  borderRadius: 4px
  padding: 1px 5px
```

Used in: XP bar rows (replaces "Lv.X" text), screen headers.

---

## 6. Navigation

### 6a. Bottom Tab Bar (`app/_layout.tsx`)
Expo Router's `<Tabs>` does not support per-item pill backgrounds natively. Implementation: pass a custom `tabBar` prop that renders a `View` row — each tab item is a `TouchableOpacity` with the active pill/indicator drawn inline. This replaces the default Expo tab bar on mobile only; the sidebar on web (`≥768px`) is unchanged.

Active tab state changes:
- Active item bg: `rgba(accent, 0.10)`, `borderRadius: 12px`, `paddingVertical: 6px`, `paddingHorizontal: 4px`
- Top indicator: absolute `View`, 2px height × 20px width, `accent` color, centered horizontally at top of item, `borderRadius: 0 0 2px 2px`
- Inactive icon opacity: 0.35
- Tab label: 9px, 700 weight active / 400 inactive

### 6b. Screen Headers
Each screen gets a unique identity. Pattern:

```
[colored dot] STAT CATEGORY (9px label, muted)     [stat icon + level badge]
Screen Name   (20px heading, stat color)
```

Mapping:
| Screen | Stat label | Color token | Badge stat |
|---|---|---|---|
| Health | Vitalite | `vit` | VIT |
| Train | Güç | `str` | STR |
| Mind | Odak | `foc` | FOC |
| Social | Sosyal | `soc` | SOC |
| Settings | — | `textMuted` | — |

---

## 7. Per-Screen Changes

All screens share the changes above (typography, spacing, card types, colors). Screen-specific notes:

- **index.tsx (Dashboard):** Spotlight card for today's top metric — whichever of sleep%, water%, or steps% is highest against its goal. Pentagon card stays as-is structurally, gets gamification updates.
- **health.tsx:** Sleep summary → Spotlight card. Water, Weight, Nutrition → Standard cards. Log rows → Compact cards.
- **train.tsx:** Today's workout → Spotlight card if logged, else Standard "no workout yet" card.
- **mind.tsx:** Today's focus session → Spotlight card.
- **social.tsx:** Today's top interaction → Spotlight card.
- **settings.tsx:** All Standard cards. No Spotlight (no daily metric).

---

## 8. Files to Change

| File | Changes |
|---|---|
| `lib/ThemeContext.tsx` | New dark mode color tokens, `typography` constants in `makeGlobalStyles` |
| `app/_layout.tsx` | Bottom tab active state (pill bg + top indicator) |
| `app/index.tsx` | Card types, XP bar height/layout, level badges, header pattern |
| `app/health.tsx` | Card types, header pattern, typography scale |
| `app/train.tsx` | Card types, header pattern, typography scale |
| `app/mind.tsx` | Card types, header pattern, typography scale |
| `app/social.tsx` | Card types, header pattern, typography scale |
| `app/settings.tsx` | Typography scale, card types |
| `components/PentagonChart.tsx` | Colored spokes, double-ring dots, stroke weight |

**Do not touch:** `lib/storage.ts`, `lib/xp.ts`, `lib/weeklyStats.ts`, `lib/patterns.ts` — pure logic, no UI.

---

## 9. Constraints (from CLAUDE.md)

- No `shadowColor`, `elevation`, or `box-shadow` — anywhere
- No imports from `constants/theme.ts`
- All theme via `useTheme()` / `makeGlobalStyles()`
- Storage keys unchanged
- No network calls

---

## Out of Scope

- Light mode palette changes
- New screens or features
- Animation/transition changes
- Font family changes (system font stays)
