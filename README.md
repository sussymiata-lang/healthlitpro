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


how to use:Nothing changes for your friend beyond what I gave you before — the README update was just cosmetic (it makes the GitHub page look accurate), it doesn't affect how the app runs.
They still do exactly this on their MacBook Pro:
copy all 4 lines of code here: git clone https://github.com/sussymiata-lang/healthlitpro.git
cd healthlitpro
npm install --legacy-peer-deps
npx expo start
Then:

w → web browser
i → iOS Simulator
Scan the QR code with Expo Go on their phone

If the repo is private, they need to be added first: GitHub → your repo → Settings → Collaborators → Add people → their GitHub username.
One thing to double check: is sussymiata-lang your friend's GitHub account, or yours? Since you mentioned earlier your friend might already have a repo — if this repo is under their account, they don't even need to clone anything from GitHub at all; they can just open the project folder they already have and git pull to get your latest pushed changes instead.
Which is it — their account or yours?what do they need to have installed on their deviceHere's the full checklist for their MacBook Pro:
Required

Node.js (LTS version) — nodejs.org
Git — usually preinstalled on Mac; if not, running git --version in Terminal will prompt them to install Xcode Command Line Tools automatically
A code editor — VS Code or whatever they prefer (not strictly required to run the app, just to edit it)

For testing the app

Expo Go — free app from the Mac App Store (lets them scan the QR code and run the app on their own iPhone instantly, no build needed)

Optional, only if they want the iOS Simulator

Xcode — free from the Mac App Store, but it's a large download (several GB). This unlocks testing in an on-screen iPhone simulator instead of needing a physical phone — the one thing only a Mac can do (you can't run iOS Simulator on Windows).

That's it
No Android Studio needed unless they specifically want the Android emulator instead of testing on a real device.
Quick summary to send them:

Install Node.js from nodejs.org, make sure git works in Terminal (it'll prompt to install if not), and grab Expo Go from the Mac App Store. Optionally install Xcode if you want the iOS Simulator instead of testing on your own phone.
once they have my github link and the stuff installedOnce they've got Node, Git, and Expo Go installed, here's exactly what they do:
1. Clone the repo
bashgit clone https://github.com/sussymiata-lang/healthlitpro.git
cd healthlitpro
2. Install dependencies
 npm install --legacy-peer-deps
3. Run it
 npx expo start
4. View the app — pick one:

Press w → opens in their web browser
Press i → opens iOS Simulator (only works if they installed Xcode)
Scan the QR code shown in the terminal, using the Expo Go app on their own iPhone

That's the whole thing — four steps, and they'll have HealthLit running on their machine.
- High-contrast ink on light/dark surfaces; color is never the only signal.
- No decorative animation.

## Known limits / deliberately out of scope

- **Home screen widgets**: need a custom dev client build (EAS Build) plus Xcode — not buildable in Expo Go.
- **Apple Sign-In**: needs an Apple Developer Program membership and a custom build to test.
- **Apple Health / Google Fit sync**: both need native modules and platform review processes; not started.
