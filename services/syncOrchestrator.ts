/**
 * Sync orchestrator.
 *
 * The only file in the app allowed to import both Zustand stores and
 * services/syncService — everything else keeps a one-way dependency
 * (store → syncService) to avoid circular imports. This file's job:
 * after a successful sign-in, pull everything from the cloud and
 * merge it into each store's existing local data.
 *
 * Never throws — a failed pull just means the local data (which was
 * already there before sign-in) is untouched.
 */

import { useAppointmentStore } from '../store/appointmentStore';
import { useCustomSymptomStore } from '../store/customSymptomStore';
import { useLogStore } from '../store/logStore';
import { useMedicationStore } from '../store/medicationStore';
import { useProfileStore } from '../store/profileStore';
import {
  pullAppointmentsFromCloud,
  pullCustomSymptomsFromCloud,
  pullEntriesFromCloud,
  pullMedicationsFromCloud,
  pullProfileFromCloud,
} from './syncService';

/**
 * Pulls every collection from the cloud and merges each into its
 * local store. Call once, right after sign-in succeeds.
 */
export async function pullAndMergeAllFromCloud(): Promise<void> {
  try {
    const [remoteEntries, remoteMedications, remoteAppointments, remoteCustomSymptoms, remoteProfile] =
      await Promise.all([
        pullEntriesFromCloud(),
        pullMedicationsFromCloud(),
        pullAppointmentsFromCloud(),
        pullCustomSymptomsFromCloud(),
        pullProfileFromCloud(),
      ]);

    useLogStore.getState().mergeRemoteEntries(remoteEntries);
    useMedicationStore.getState().mergeRemoteMedications(remoteMedications);
    useAppointmentStore.getState().mergeRemoteAppointments(remoteAppointments);
    useCustomSymptomStore.getState().mergeRemoteCustomSymptoms(remoteCustomSymptoms);
    useProfileStore.getState().mergeRemoteProfile(remoteProfile);
  } catch {
    console.warn('[syncOrchestrator] Could not complete cloud sync.');
  }
}
