/**
 * Appointment store (Zustand).
 *
 * Holds upcoming and past appointments, persisted on-device.
 *
 * DATA SENSITIVITY: never log appointment contents to the console.
 */

import { create } from 'zustand';

import { loadAppointments, saveAppointments } from '../services/appointmentStorage';
import { syncAppointmentsToCloud } from '../services/syncService';
import { Appointment } from '../types/models';
import { generateId } from '../utils/id';
import { mergeById } from '../utils/syncMerge';

export interface AppointmentFields {
  doctorName: string;
  specialty: string | null;
  dateTime: string;
  location: string | null;
  chiefComplaint: string | null;
  changesSinceLastVisit: string | null;
  questionsToAsk: string[];
  notes: string | null;
}

interface AppointmentStoreState {
  appointments: Appointment[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addAppointment: (fields: AppointmentFields) => Appointment;
  updateAppointment: (id: string, fields: AppointmentFields) => void;
  removeAppointment: (id: string) => void;
  /** Merges cloud appointments into local (last-write-wins). Called once after sign-in. */
  mergeRemoteAppointments: (remote: Appointment[]) => void;
}

function sortByDateTime(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

export const useAppointmentStore = create<AppointmentStoreState>((set, get) => ({
  appointments: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await loadAppointments();
    set({ appointments: sortByDateTime(stored), hydrated: true });
  },

  addAppointment: (fields) => {
    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: generateId('appt'),
      ...fields,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };

    set((state) => ({
      appointments: sortByDateTime([...state.appointments, appointment]),
    }));
    void saveAppointments(get().appointments);
    void syncAppointmentsToCloud(get().appointments);

    return appointment;
  },

  updateAppointment: (id, fields) => {
    set((state) => ({
      appointments: sortByDateTime(
        state.appointments.map((appt) =>
          appt.id === id
            ? { ...appt, ...fields, updatedAt: new Date().toISOString() }
            : appt,
        ),
      ),
    }));
    void saveAppointments(get().appointments);
    void syncAppointmentsToCloud(get().appointments);
  },

  removeAppointment: (id) => {
    set((state) => ({
      appointments: state.appointments.filter((appt) => appt.id !== id),
    }));
    void saveAppointments(get().appointments);
    void syncAppointmentsToCloud(get().appointments);
  },

  mergeRemoteAppointments: (remote) => {
    set((state) => ({ appointments: sortByDateTime(mergeById(state.appointments, remote)) }));
    void saveAppointments(get().appointments);
  },
}));
