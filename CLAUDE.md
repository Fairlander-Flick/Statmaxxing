# CLAUDE.md

## Must-follow constraints

- No test or lint scripts exist — don't run `npm test` or `npm run lint`.
- `constants/theme.ts` is a legacy shim; never import from it. All screens must use `useTheme()` from `lib/ThemeContext.tsx`.
- All data types and AsyncStorage helpers live in `lib/storage.ts`. Add new types there — nowhere else.
- Storage keys must be domain-namespaced: `health:`, `train:`, `mind:`, `social:`. Never use bare keys.
- No backend. Fully local-first via AsyncStorage. Never add network calls or auth.

## Repo-specific conventions

- Design language "Sessiz Keskinlik": warm neutrals, no shadows, card borders only. Never add `shadowColor`, `elevation`, or box-shadow.
- Semantic stat color names (from `ThemeContext`): `vit` (health), `str` (training), `foc` (mind), `art` (artistry), `soc` (social), `dis` (discipline). Use these keys when coloring stat UI.
- Responsive nav: web ≥768px → sidebar, mobile → bottom tab bar. Both use the same `Tabs` component in `app/_layout.tsx`. Don't duplicate nav logic.

## Important locations

| Path | Role |
|------|------|
| `app/_layout.tsx` | Root layout + responsive nav logic |
| `lib/ThemeContext.tsx` | Theme colors + `makeGlobalStyles()` |
| `lib/storage.ts` | All data types + typed storage helpers |
| `lib/mockData.ts` | Seed/default data |
