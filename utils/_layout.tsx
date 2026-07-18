import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useAppointmentStore } from '../store/appointmentStore';
import { useAuthStore } from '../store/authStore';
import { useCustomSymptomStore } from '../store/customSymptomStore';
import { useLogStore } from '../store/logStore';
import { useMedicationStore } from '../store/medicationStore';
import { useProfileStore } from '../store/profileStore';
import { useThemeModeStore } from '../store/themeModeStore';
import { pullAndMergeAllFromCloud } from '../services/syncOrchestrator';
import { useTheme } from '../hooks/useTheme';

/**
 * Root navigation layout.
 * - Loads the Inter font family (theme typography depends on it).
 * - Hydrates saved entries, profile, appointments, medications,
 *   custom symptoms, and the theme mode preference from device
 *   storage once at launch.
 * - Starts the (optional) Firebase auth session listener. If a
 *   previous sign-in is restored at launch, pulls and merges cloud
 *   data once. A fresh interactive sign-in from AuthScreen handles
 *   its own pull, so this never double-syncs.
 */
export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    void useLogStore.getState().hydrate();
    void useProfileStore.getState().hydrate();
    void useAppointmentStore.getState().hydrate();
    void useCustomSymptomStore.getState().hydrate();
    void useMedicationStore.getState().hydrate();
    void useThemeModeStore.getState().hydrate();

    let isFirstAuthCheck = true;
    const unsubscribeAuth = useAuthStore.getState().initAuthListener();
    const unsubscribeInitialCheck = useAuthStore.subscribe((state) => {
      if (isFirstAuthCheck && state.authChecked) {
        isFirstAuthCheck = false;
        if (state.user) {
          void pullAndMergeAllFromCloud();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeInitialCheck();
    };
  }, []);

  // A brief blank frame while fonts load beats a flash of the wrong font.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
