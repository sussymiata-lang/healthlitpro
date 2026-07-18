/**
 * Symptom logging store (Zustand).
 *
 * Holds the in-progress wizard draft and the list of saved entries.
 * Entries are persisted on-device through services/entryStorage and
 * hydrated once at app launch (see app/_layout.tsx).
 *
 * DATA SENSITIVITY: never log draft or entry contents to the console.
 */

import { create } from 'zustand';

import { loadEntries, saveEntries } from '../services/entryStorage';
import { syncEntriesToCloud } from '../services/syncService';
import { SymptomEntry } from '../types/models';
import { generateId } from '../utils/id';
import { mergeById } from '../utils/syncMerge';
import { DURATION_OPTIONS } from '../utils/symptoms';

export interface LogDraft {
  symptomType: string | null;
  severity: number | null;
  /** Key into DURATION_OPTIONS; null until chosen. */
  durationKey: string | null;
  triggers: string[];
  reliefFactors: string[];
  /** "Feels like" descriptors (pain-type symptoms only). */
  qualities: string[];
  /** Body region ids (location-eligible symptoms only). */
  bodyRegions: string[];
  impactNote: string;
  note: string;
}

function createEmptyDraft(): LogDraft {
  return {
    symptomType: null,
    severity: null,
    durationKey: null,
    triggers: [],
    reliefFactors: [],
    qualities: [],
    bodyRegions: [],
    impactNote: '',
    note: '',
  };
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/** Newest first, by when the symptom occurred. */
function sortNewestFirst(entries: SymptomEntry[]): SymptomEntry[] {
  return [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

interface LogStoreState {
  draft: LogDraft;
  /** Newest first. Hydrated from device storage at launch. */
  entries: SymptomEntry[];
  /** True once saved entries have been loaded from device storage. */
  hydrated: boolean;
  /** Loads saved entries from storage. Safe to call more than once. */
  hydrate: () => Promise<void>;
  setSymptomType: (symptomType: string) => void;
  setSeverity: (severity: number) => void;
  setDurationKey: (durationKey: string) => void;
  toggleTrigger: (trigger: string) => void;
  toggleRelief: (relief: string) => void;
  toggleQuality: (quality: string) => void;
  toggleBodyRegion: (regionId: string) => void;
  setImpactNote: (impactNote: string) => void;
  setNote: (note: string) => void;
  resetDraft: () => void;
  /**
   * Validates and converts the draft into a SymptomEntry, stores it,
   * persists to device, and resets the draft. Returns the entry, or
   * null if required fields (symptom type, severity) are missing.
   */
  saveDraft: () => SymptomEntry | null;
  /**
   * Merges cloud entries into the local list (last-write-wins by
   * updatedAt) and persists the result. Called once after sign-in.
   */
  mergeRemoteEntries: (remote: SymptomEntry[]) => void;
}

export const useLogStore = create<LogStoreState>((set, get) => ({
  draft: createEmptyDraft(),
  entries: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;

    const stored = await loadEntries();

    // Merge instead of replace: if an entry was saved before hydration
    // finished (unlikely but possible), nothing is lost.
    set((state) => {
      const existingIds = new Set(state.entries.map((entry) => entry.id));
      const merged = [
        ...state.entries,
        ...stored.filter((entry) => !existingIds.has(entry.id)),
      ];
      return { entries: sortNewestFirst(merged), hydrated: true };
    });

    // Re-persist the merged list so storage self-heals.
    void saveEntries(get().entries);
  },

  setSymptomType: (symptomType) =>
    set((state) => ({ draft: { ...state.draft, symptomType } })),

  setSeverity: (severity) =>
    set((state) => ({ draft: { ...state.draft, severity } })),

  setDurationKey: (durationKey) =>
    set((state) => ({ draft: { ...state.draft, durationKey } })),

  toggleTrigger: (trigger) =>
    set((state) => ({
      draft: { ...state.draft, triggers: toggleValue(state.draft.triggers, trigger) },
    })),

  toggleRelief: (relief) =>
    set((state) => ({
      draft: {
        ...state.draft,
        reliefFactors: toggleValue(state.draft.reliefFactors, relief),
      },
    })),

  toggleQuality: (quality) =>
    set((state) => ({
      draft: {
        ...state.draft,
        qualities: toggleValue(state.draft.qualities, quality),
      },
    })),

  toggleBodyRegion: (regionId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        bodyRegions: toggleValue(state.draft.bodyRegions, regionId),
      },
    })),

  setImpactNote: (impactNote) =>
    set((state) => ({ draft: { ...state.draft, impactNote } })),

  setNote: (note) => set((state) => ({ draft: { ...state.draft, note } })),

  resetDraft: () => set({ draft: createEmptyDraft() }),

  saveDraft: () => {
    const { draft } = get();
    if (draft.symptomType === null || draft.severity === null) {
      return null;
    }

    const now = new Date().toISOString();
    const duration = DURATION_OPTIONS.find(
      (option) => option.key === draft.durationKey,
    );

    const entry: SymptomEntry = {
      id: generateId('entry'),
      symptomType: draft.symptomType,
      severity: draft.severity,
      durationMinutes: duration ? duration.minutes : null,
      triggers: draft.triggers,
      reliefFactors: draft.reliefFactors,
      qualities: draft.qualities,
      bodyRegions: draft.bodyRegions,
      impactNote: draft.impactNote.trim() !== '' ? draft.impactNote.trim() : null,
      note: draft.note.trim() !== '' ? draft.note.trim() : null,
      loggedAt: now,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };

    set((state) => ({
      entries: [entry, ...state.entries],
      draft: createEmptyDraft(),
    }));

    // Persist in the background; the service warns (generically) on failure.
    void saveEntries(get().entries);
    // Best-effort cloud backup — a silent no-op if not signed in.
    void syncEntriesToCloud(get().entries);

    return entry;
  },

  mergeRemoteEntries: (remote) => {
    set((state) => ({ entries: sortNewestFirst(mergeById(state.entries, remote)) }));
    void saveEntries(get().entries);
  },
}));
