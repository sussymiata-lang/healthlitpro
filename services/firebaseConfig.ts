/**
 * Firebase initialization.
 *
 * ⚠️ SETUP REQUIRED: replace FIREBASE_CONFIG below with your real
 * project's config object (Firebase Console → Project settings →
 * your Web app), and GOOGLE_WEB_CLIENT_ID with the Web client ID that
 * appears once Google sign-in is enabled under Authentication →
 * Sign-in method → Google. Nothing here is secret — this config is
 * normal to ship inside a client app.
 *
 * PLATFORM NOTE: Firebase Auth's React-Native session persistence
 * (`getReactNativePersistence`) only exists in the RN build of
 * `firebase/auth`, not the web build. It's loaded with a runtime
 * `require()` inside a Platform.OS check — not a static `import` —
 * specifically so Metro's web bundle never has to resolve it. A
 * top-level `import` here would run on every platform regardless of
 * any later Platform check, since ES imports are hoisted; only a
 * runtime `require()` genuinely skips on web.
 */

import { Platform } from 'react-native';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC0owVmPSvyoPD-NmhQwVnFxhaPhTfTkAo',
  authDomain: 'healthlit-f5e54.firebaseapp.com',
  projectId: 'healthlit-f5e54',
  storageBucket: 'healthlit-f5e54.firebasestorage.app',
  messagingSenderId: '12545023833',
  appId: '1:12545023833:web:e96754d62ff836b1d8f648',
};

export const GOOGLE_WEB_CLIENT_ID = '12545023833-e45era1u91d271fhbnr560jeq1ds9h8m.apps.googleusercontent.com';

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require('firebase/auth');
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh can re-run this module and call initializeAuth twice,
    // which throws on the second call — fall back to the existing instance.
    return getAuth(firebaseApp);
  }
}

export const auth: Auth = createAuth();
export const db: Firestore = getFirestore(firebaseApp);
