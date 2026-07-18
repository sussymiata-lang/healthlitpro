# HealthLit

A calm, accessible mobile app for chronic condition and pain tracking. Users log daily symptoms, review trends, export doctor-ready reports, and get a plain-language "story" summarizing patterns over time.

**Design principle:** a user in pain should be able to use the app in under 3 seconds.

## Status

All core MVP steps, Tier 1, Tier 2, and post-MVP features are complete.

| Feature | Status |
|---|---|
| App navigation + base layout | ✅ Done |
| Symptom logging screen (guided check-in) | ✅ Done |
| Save + retrieve symptom data | ✅ Done |
| Dashboard (daily overview) | ✅ Done |
| History + analytics graphs | ✅ Done |
| Export doctor report (PDF + share sheet) | ✅ Done |
| Body map, symptom qualities, medications, insights/correlations (Tier 1) | ✅ Done |
| Custom symptom types, week-over-week comparison, streak milestones (Tier 2) | ✅ Done |
| Firebase Auth (email/password + Google) + Firestore sync | ✅ Done |
| Dark mode | ✅ Done |
| Symptoms-to-Story narrative engine | ✅ Done |
| Calendar / appointments, profile & settings | ✅ Done |

## Getting started

Requires Node 20+ and the Expo Go app (or a simulator).

```bash
npm install --legacy-peer-deps
npx expo start --clear
```

Then press `i` (iOS simulator), `a` (Android emulator), `w` (web), or scan the QR code with Expo Go.

> `--legacy-peer-deps` is required on every `npm install` due to a peer dependency conflict in the Expo SDK 57 tree.

## Firebase setup (required for sign-in/sync to work)

The app runs fully offline with zero setup — Firebase only powers the optional "Back up & Sync" feature in Profile. To make that work:

1. Create a project at console.firebase.google.com
2. Enable **Firestore Database**
3. **Authentication → Sign-in method** → enable **Email/Password** and **Google**
4. Add a **Web app** to the project, copy its config object into `services/firebaseConfig.ts`
5. For Google sign-in on web, add your local dev URL (e.g. `http://localhost:8081`) to **Authorized redirect URIs** on the OAuth client in Google Cloud Console → APIs & Services → Credentials

None of the Firebase config values are secret — it's normal for Firebase web config to live in a client app's source code.

## Architecture decisions

- **Theming**: every screen/component calls `useTheme()` (`hooks/useTheme.ts`) and computes its `StyleSheet` inside the component via `useMemo`, rather than importing a static theme object — this is what makes dark mode actually work.
- **Repository pattern**: every entity (`entries`, `profile`, `medications`, `appointments`, `customSymptoms`) has a `services/xStorage.ts` file exposing `loadX()`/`saveX()`. Stores never touch AsyncStorage directly — this is what let Firebase slot in later with zero UI changes.
- **Firebase is additive, not required**: the app never gates any screen behind sign-in. Signing in only enables background sync (`services/syncService.ts` pushes/pulls; `services/syncOrchestrator.ts` merges on sign-in, last-write-wins by `updatedAt`).
- **Relative imports only** (`../utils/theme`, not `@/utils/theme`) — the `@/` path alias has caused Metro bundler runtime errors in this project.
- **Charts**: `react-native-svg`, hand-built — no charting library, since most are DOM-based and don't run in React Native.
- **State**: Zustand, one store per data domain.

## Project structure

```
app/            Expo Router routes (thin — just re-export from /screens)
screens/        Actual screen implementations
components/     Reusable UI, grouped by domain (ui/, entries/, charts/, body/, calendar/)
store/          Zustand stores, one per data domain
services/       Persistence (AsyncStorage) and Firestore sync — repository pattern
utils/          Pure functions: stats, analytics, theme, correlation/story engines
hooks/          useTheme() — the only way any component should read theme values
types/models.ts Core data model shared across local storage and Firestore
```

## Data sensitivity rules

- All user data in this app is health data.
- Never log raw health data to the console, analytics, or crash reports.
- All persistence goes through the `/services` layer.
- Domain objects carry a `schemaVersion` so stored data can be migrated safely as the schema evolves.
- `.env*` files are git-ignored; no secrets in source control.

## Accessibility baseline

- Minimum 52pt touch targets.
- Every interactive element has an `accessibilityRole` and label.
- High-contrast ink on light/dark surfaces; color is never the only signal.
- No decorative animation.

## Known limits / deliberately out of scope

- **Home screen widgets**: need a custom dev client build (EAS Build) plus Xcode — not buildable in Expo Go.
- **Apple Sign-In**: needs an Apple Developer Program membership and a custom build to test.
- **Apple Health / Google Fit sync**: both need native modules and platform review processes; not started.