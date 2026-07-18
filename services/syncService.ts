/**
 * Firestore sync service.
 *
 * Deliberately has zero knowledge of any Zustand store — it only
 * pushes/pulls plain data. This keeps the dependency direction
 * one-way (stores → this file), avoiding a circular import between
 * stores and sync. The only file allowed to know about both stores
 * and this service is services/syncOrchestrator.ts.
 *
 * Every function is a silent no-op when signed out, and fails soft
 * (a console warning, never a thrown error) so a sync hiccup never
 * breaks the local-first experience.
 *
 * DATA SENSITIVITY: never log document contents, only collection
 * names in warnings.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { auth, db } from './firebaseConfig';
import {
  Appointment,
  CustomSymptom,
  Medication,
  SymptomEntry,
  UserProfile,
} from '../types/models';

function currentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

async function pushCollection<T extends { id: string }>(
  collectionName: string,
  items: T[],
): Promise<void> {
  const uid = currentUid();
  if (!uid || items.length === 0) return;

  try {
    const batch = writeBatch(db);
    const colRef = collection(db, 'users', uid, collectionName);
    for (const item of items) {
      batch.set(doc(colRef, item.id), item);
    }
    await batch.commit();
  } catch {
    console.warn(`[syncService] Could not push ${collectionName} to cloud.`);
  }
}

async function pullCollection<T>(collectionName: string): Promise<T[]> {
  const uid = currentUid();
  if (!uid) return [];

  try {
    const snapshot = await getDocs(collection(db, 'users', uid, collectionName));
    return snapshot.docs.map((docSnap) => docSnap.data() as T);
  } catch {
    console.warn(`[syncService] Could not pull ${collectionName} from cloud.`);
    return [];
  }
}

export const syncEntriesToCloud = (entries: SymptomEntry[]) =>
  pushCollection('symptom_entries', entries);
export const pullEntriesFromCloud = () => pullCollection<SymptomEntry>('symptom_entries');

export const syncMedicationsToCloud = (medications: Medication[]) =>
  pushCollection('medications', medications);
export const pullMedicationsFromCloud = () => pullCollection<Medication>('medications');

export const syncAppointmentsToCloud = (appointments: Appointment[]) =>
  pushCollection('appointments', appointments);
export const pullAppointmentsFromCloud = () => pullCollection<Appointment>('appointments');

export const syncCustomSymptomsToCloud = (customSymptoms: CustomSymptom[]) =>
  pushCollection('custom_symptoms', customSymptoms);
export const pullCustomSymptomsFromCloud = () =>
  pullCollection<CustomSymptom>('custom_symptoms');

/** Profile is a single document rather than a collection of records. */
export async function syncProfileToCloud(profile: UserProfile): Promise<void> {
  const uid = currentUid();
  if (!uid) return;

  try {
    await writeBatch(db).set(doc(db, 'users', uid, 'profile', 'main'), profile).commit();
  } catch {
    console.warn('[syncService] Could not push profile to cloud.');
  }
}

export async function pullProfileFromCloud(): Promise<UserProfile | null> {
  const uid = currentUid();
  if (!uid) return null;

  try {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch {
    console.warn('[syncService] Could not pull profile from cloud.');
    return null;
  }
}
