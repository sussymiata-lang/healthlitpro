/**
 * HealthLit core domain models.
 *
 * These types mirror the planned Firestore collections so local and
 * remote persistence share one schema.
 *
 * DATA SENSITIVITY: every field here is health data. Never write these
 * objects to console logs, analytics events, or crash reports. All
 * persistence goes through the services layer.
 *
 * COMPATIBILITY: `qualities` and `bodyRegions` were added in Tier 1 as
 * OPTIONAL fields — entries saved before then simply lack them, so no
 * migration is needed and schemaVersion stays at 1.
 */

/** Symptom categories available in the guided logging flow. */
export const SYMPTOM_TYPES = [
  'pain',
  'fatigue',
  'headache',
  'nerve_sensitivity',
  'inflammation',
] as const;

export type SymptomType = (typeof SYMPTOM_TYPES)[number];

/** A single logged symptom occurrence. Collection: `symptom_entries`. */
export interface SymptomEntry {
  id: string;
  /**
   * A built-in SymptomType, or a CustomSymptom id (Tier 2). Kept as
   * `string` rather than the SymptomType union so custom types can be
   * stored without a schema migration; schemaVersion stays at 1.
   */
  symptomType: string;
  /** Severity on a 0–10 scale. */
  severity: number;
  /** How long the symptom lasted; null if ongoing or not provided. */
  durationMinutes: number | null;
  /** Factors the user believes worsened the symptom. */
  triggers: string[];
  /** Factors the user believes helped. */
  reliefFactors: string[];
  /** How the symptom affected the user's day, in their own words. */
  impactNote: string | null;
  /** Free-form notes. */
  note: string | null;
  /** Pain-quality descriptors, e.g. "Sharp", "Throbbing". Tier 1. */
  qualities?: string[];
  /** Body region ids (see utils/bodyRegions). Tier 1. */
  bodyRegions?: string[];
  /** When the symptom occurred (ISO 8601). */
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
  /** Bump when the shape changes incompatibly. */
  schemaVersion: 1;
}

/** A medication the user tracks. Collection: `medications`. */
export interface Medication {
  id: string;
  name: string;
  /** e.g. "60mg". Empty string if not provided. */
  dose: string;
  /** e.g. "Once daily · Morning". Null if not provided. */
  scheduleNote: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

/** One calendar day's roll-up. Collection: `daily_logs`. */
export interface DailyLog {
  id: string;
  /** Calendar date in YYYY-MM-DD (device-local). */
  date: string;
  /** Mood on a 0–10 scale; null if not logged. */
  mood: number | null;
  /** SymptomEntry ids logged on this date. */
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

/**
 * A user-defined symptom type beyond the 5 built-ins (Tier 2).
 * Collection: `custom_symptoms`.
 */
export interface CustomSymptom {
  id: string;
  label: string;
  /** Ionicon name, stored as a plain string (JSON-safe). */
  icon: string;
  /** Hex color for the icon tint. */
  tint: string;
  /** Hex color for the icon's soft background circle. */
  tintSoft: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

/** The account holder's profile. Collection: `users`. */
export interface UserProfile {
  id: string;
  displayName: string;
  condition: string | null;
  dateOfBirth: string | null;
  primaryDoctor: string | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

/**
 * A doctor's appointment, with optional prep fields (chief complaint,
 * what's changed, questions to ask) so a visit doesn't rely on memory
 * mid-conversation. Collection: `appointments`.
 */
export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string | null;
  /** Appointment date + time (ISO 8601). */
  dateTime: string;
  location: string | null;
  /** Free-form: what to bring up first. */
  chiefComplaint: string | null;
  /** Free-form: what's different since the last visit. */
  changesSinceLastVisit: string | null;
  /** Questions to remember to ask. */
  questionsToAsk: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}
