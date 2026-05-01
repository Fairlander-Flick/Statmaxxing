---
name: Stats
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393841'
  surface-container-lowest: '#0d0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#303038'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#c8c5cb'
  on-secondary: '#303034'
  secondary-container: '#47464b'
  on-secondary-container: '#b6b4ba'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e4e1e7'
  secondary-fixed-dim: '#c8c5cb'
  on-secondary-fixed: '#1b1b1f'
  on-secondary-fixed-variant: '#47464b'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '300'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is engineered for a high-performance fitness-RPG hybrid. It merges the disciplined, high-fidelity aesthetic of modern developer tools with the motivational energy of a progression-based game. The brand personality is "Technical Athlete"—precise, data-driven, and premium. 

The visual style is a hybrid of **Minimalism** and **Glassmorphism**. It utilizes heavy whitespace and a strictly neutral foundation to allow user data and progress metrics to take center stage. The "RPG" elements are communicated through neon-tinted accents and high-contrast typography rather than literal illustrative tropes, maintaining a professional SaaS feel while evoking the excitement of "leveling up."

## Colors

The palette is anchored by a deep, "ink-trap" dark mode base to reduce eye strain during workouts and enhance the vibrance of the **Electric Indigo** primary color. 

- **Primary:** #6366F1 serves as the "Action" color, representing energy and progression.
- **Surface:** In dark mode, surfaces use #16161E to create a subtle lift from the #0F0F13 background. 
- **Functional:** Success, Warning, and Error states should be desaturated to maintain the premium aesthetic, using thin 1px strokes rather than heavy color blocks.
- **Glass:** Dark mode utilizes a white-alpha overlay (4-8%) with heavy backdrop blur (20px+) for elevated surfaces.

## Typography

This design system utilizes **Plus Jakarta Sans** for its modern, geometric curves which feel both athletic and approachable. 

- **Headings:** Set with bold to extra-bold weights and tight letter-spacing to create a "squashed," high-impact look suitable for RPG stats and heavy lifting metrics.
- **Body:** Uses the "Light" (300) weight to provide a sophisticated contrast against the heavy headers, ensuring the UI feels airy and premium.
- **Data Points:** Use **Inter** for smaller labels and tabular data to ensure maximum legibility at micro-sizes.

## Layout & Spacing

The design system uses a strict **8px grid system**. Layouts should prioritize center-aligned containers for web and edge-to-edge cards for mobile.

- **Grid:** A 12-column fluid grid for desktop with wide 24px gutters.
- **Padding:** Use a consistent 16px (md) or 24px (lg) padding for card internals. 
- **Rhythm:** Vertical rhythm is driven by the "base" 4px unit, where spacing between a heading and body is typically 8px (sm), and spacing between sections is 48px (xl).

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Frosted Glass** rather than traditional heavy shadows.

- **Level 0 (Background):** #0F0F13.
- **Level 1 (Cards/Containers):** #16161E with a 1px stroke of `rgba(255,255,255,0.08)`.
- **Level 2 (Modals/Overlays):** Translucent background (10% opacity white) with a 32px backdrop blur and a soft, 15% opacity black shadow with a 30px spread.
- **Interactive:** Hover states on cards should trigger a subtle increase in border-opacity (from 8% to 20%) and a faint glow from the electric indigo primary color.

## Shapes

The shape language is consistently rounded to evoke a modern, friendly SaaS feel while maintaining geometric integrity.

- **Standard Radius:** 16px (rounded-lg) for cards, large buttons, and input fields.
- **Small Radius:** 8px (rounded-md) for smaller interactive elements like checkboxes or tags.
- **Pill:** Reserved exclusively for status indicators (e.g., "Level Up", "Active") and specific primary CTA buttons.

## Components

- **Buttons:** Primary buttons use a solid #6366F1 fill with white text. Secondary buttons use a ghost style: 1px border and no fill, or a subtle semi-transparent indigo tint.
- **Cards:** The "Stats Card" is the core component. It features a frosted glass background in dark mode, 16px border radius, and a subtle 1px top-border highlight to simulate light catching the edge.
- **Inputs:** Minimalist fields with 1px borders. Focus states should transform the border to Electric Indigo with a soft outer glow.
- **Progress Bars:** High-contrast containers. The "fill" should be a linear gradient from #6366F1 to #818CF8 to create a sense of motion and energy.
- **Icons:** Use Lucide icons with a 1.5px stroke weight. Icons should be monochrome (white or light grey) unless they are indicating a specific active "Power" or "Buff" state.
- **RPG Elements:** Progress "pips" for experience points and hexagonal containers for "Level" badges to subtly nod to gaming tropes without breaking the SaaS aesthetic.