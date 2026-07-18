/**
 * Pure date/appointment helpers for the Calendar screen. No React, no
 * storage — data in, values out.
 */

import { Appointment } from '../types/models';
import { dateKeyFromDate } from './entryStats';

export interface CalendarDay {
  dateKey: string;
  dayOfMonth: number;
  /** False for the leading/trailing days that pad the grid to full weeks. */
  inCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Builds a full 6-week grid (42 days) for the given month, so the
 * calendar's row count never shifts between months.
 */
export function buildMonthGrid(year: number, month: number, now: Date = new Date()): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startWeekday);
  const todayKey = dateKeyFromDate(now);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push({
      dateKey: dateKeyFromDate(day),
      dayOfMonth: day.getDate(),
      inCurrentMonth: day.getMonth() === month,
      isToday: dateKeyFromDate(day) === todayKey,
    });
  }
  return days;
}

/** "July 2026" */
export function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

/** Set of YYYY-MM-DD keys that have at least one appointment. */
export function getAppointmentDateKeys(appointments: Appointment[]): Set<string> {
  return new Set(appointments.map((appt) => dateKeyFromDate(new Date(appt.dateTime))));
}

/** Appointments today or later, soonest first. */
export function getUpcomingAppointments(
  appointments: Appointment[],
  now: Date = new Date(),
): Appointment[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return appointments
    .filter((appt) => new Date(appt.dateTime) >= startOfToday)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

/** Appointments before today, most recent first. */
export function getPastAppointments(
  appointments: Appointment[],
  now: Date = new Date(),
): Appointment[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return appointments
    .filter((appt) => new Date(appt.dateTime) < startOfToday)
    .sort((a, b) => b.dateTime.localeCompare(a.dateTime));
}

/** "Mon, Jul 13 · 2:30 PM" */
export function formatAppointmentDateTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
}
