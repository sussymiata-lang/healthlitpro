# HealthLit

A calm, accessible mobile app for chronic condition and pain tracking. Users log daily symptoms, review trends, and export doctor-ready reports.

**Design principle:** a user in pain should be able to use the app in under 3 seconds.

## Status

**Step 1 of 6 complete** — navigation, base layout, design system, and core data schema.

| Step | Feature | Status |
| --- | --- | --- |
| 1 | App navigation + base layout | ✅ Done |
| 2 | Symptom logging screen (guided check-in) | ⬜ Next |
| 3 | Save + retrieve symptom data | ⬜ |
| 4 | Dashboard (daily overview) | ⬜ |
| 5 | History + analytics graphs | ⬜ |
| 6 | Export doctor report (PDF + share sheet) | ⬜ |
| — | Calendar / appointments, profile & settings | Post-MVP (tabs scaffolded) |

## Getting started

Requires Node 20+ and the Expo Go app (or a simulator).

```bash
npm install
npx expo install --fix   # aligns native package versions with the installed Expo SDK
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with Expo Go.

## Architecture decisions

- **Palette follows the Figma designs** (soft lavender/purple with pink accents), which supersede the earlier "blue/teal" note in the written spec. All tokens live in `utils/theme.ts` — swapping the palette is a one-file change.
- **Charts: Victory Native** (added in Step 5). Recharts is DOM-based and does not run in React Native.
- **Backend: Firebase (Firestore)**, per the design document. Persistence is introduced in Step 3 behind a repository interface in `/services` with a local, offline-first adapter first; Firestore sync plugs into the same interface later without touching UI code. Reliability while offline matters for a pain-tracking app.
- **State: Zustand**, added in Step 3 when there is state to manage.
- **Routes are thin.** Files in `/app` only map URLs to screens; implementations live in `/screens`, shared UI in `/components`, and all styling derives from `utils/theme.ts`.

## Project structure

```
app/                  # Expo Router routes (thin re-exports only)
  _layout.tsx         # Root stack + status bar
  (tabs)/             # Tab group: Home, Log, Calendar, Profile
components/
  ui/                 # Reusable primitives: Screen, Card, Button, AppHeader, SectionPlaceholder
screens/              # Screen implementations
store/                # Zustand stores (Step 3)
services/             # Persistence + Firebase (Step 3), PDF export (Step 6)
utils/
  theme.ts            # Design tokens — single source of truth for styling
types/
  models.ts           # Core domain schema: SymptomEntry, DailyLog, UserProfile
```

## Data sensitivity rules

All user data in this app is health data.

- Never log raw health data to the console, analytics, or crash reports.
- All persistence goes through the `/services` layer, which is responsible for secure storage and future encryption.
- Domain objects carry a `schemaVersion` so stored data can be migrated safely as the schema evolves.
- `.env*` files are git-ignored; no secrets in source control.

## Accessibility baseline

- Minimum 52pt touch targets (`theme.touchTarget`).
- Every interactive element has an `accessibilityRole` and label.
- High-contrast ink on light surfaces; color is never the only signal.
- No decorative animation.
