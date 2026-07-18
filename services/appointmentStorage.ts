/**
 * Appointment persistence service (repository pattern).
 *
 * Mirrors services/entryStorage.ts: the store only calls
 * `loadAppointments` / `saveAppointments`.
 *
 * DATA SENSITIVITY: appointment prep fields (chief complaint) are
 * health-adjacent. Never log them. Failures emit a generic warning only.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Appointment } from '../types/models';

const STORAGE_KEY = 'healthlit.appointments.v1';

function isAppointment(value: unknown): value is Appointment {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.doctorName === 'string' &&
    typeof candidate.dateTime === 'string'
  );
}

export async function loadAppointments(): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isAppointment);
  } catch {
    console.warn('[appointmentStorage] Could not read saved appointments.');
    return [];
  }
}

export async function saveAppointments(appointments: Appointment[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    return true;
  } catch {
    console.warn('[appointmentStorage] Could not save appointments.');
    return false;
  }
}
