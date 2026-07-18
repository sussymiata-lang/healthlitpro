/**
 * Correlation analyzer (Tier 1).
 *
 * Analyzes symptom entries to find patterns:
 * "When you log X, your severity drops Y% in the next Z hours."
 *
 * Pure data transforms, no React dependencies.
 */

import { SymptomEntry } from '../types/models';

export interface FactorCorrelation {
  factor: string;
  type: 'trigger' | 'relief';
  occurrences: number;
  /** Average severity change when this factor is logged (negative = improvement). */
  avgSeverityChange: number;
  /** % of times this factor was followed by lower severity. */
  improvementRate: number;
  /** Timespan analyzed (hours). */
  timeWindow: number;
}

/**
 * Analyzes entries over the trailing `days` window.
 * Returns correlations, sorted by strength (relief first, triggers last).
 */
export function analyzeCorrelations(
  entries: SymptomEntry[],
  days: number,
  now: Date = new Date(),
): FactorCorrelation[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (days - 1));

  const inRange = entries.filter((e) => new Date(e.loggedAt) >= cutoff);
  if (inRange.length < 2) {
    return [];
  }

  // Sort by time (oldest first) for sequential analysis
  const sorted = [...inRange].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

  const reliefStats = new Map<string, { count: number; improvements: number; deltas: number[] }>();
  const triggerStats = new Map<string, { count: number; improvements: number; deltas: number[] }>();

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentTime = new Date(current.loggedAt).getTime();
    const nextTime = new Date(next.loggedAt).getTime();
    const hoursLater = (nextTime - currentTime) / (1000 * 60 * 60);

    // Only look at entries within 24 hours
    if (hoursLater > 24) continue;

    const delta = next.severity - current.severity;
    const improved = delta < 0;

    for (const relief of current.reliefFactors) {
      if (!reliefStats.has(relief)) {
        reliefStats.set(relief, { count: 0, improvements: 0, deltas: [] });
      }
      const stat = reliefStats.get(relief)!;
      stat.count += 1;
      if (improved) stat.improvements += 1;
      stat.deltas.push(delta);
    }

    for (const trigger of current.triggers) {
      if (!triggerStats.has(trigger)) {
        triggerStats.set(trigger, { count: 0, improvements: 0, deltas: [] });
      }
      const stat = triggerStats.get(trigger)!;
      stat.count += 1;
      if (improved) stat.improvements += 1; // Negative correlation for triggers
      stat.deltas.push(delta);
    }
  }

  const correlations: FactorCorrelation[] = [];

  reliefStats.forEach((stat, factor) => {
    if (stat.count >= 2) {
      const avgDelta = stat.deltas.reduce((sum, d) => sum + d, 0) / stat.deltas.length;
      correlations.push({
        factor,
        type: 'relief',
        occurrences: stat.count,
        avgSeverityChange: avgDelta,
        improvementRate: (stat.improvements / stat.count) * 100,
        timeWindow: 24,
      });
    }
  });

  triggerStats.forEach((stat, factor) => {
    if (stat.count >= 2) {
      const avgDelta = stat.deltas.reduce((sum, d) => sum + d, 0) / stat.deltas.length;
      correlations.push({
        factor,
        type: 'trigger',
        occurrences: stat.count,
        avgSeverityChange: avgDelta,
        improvementRate: (stat.improvements / stat.count) * 100,
        timeWindow: 24,
      });
    }
  });

  // Sort: relief factors with strongest improvement first, triggers with worst impact first
  return correlations.sort((a, b) => {
    if (a.type === 'relief' && b.type === 'relief') {
      return b.avgSeverityChange - a.avgSeverityChange; // More negative is better
    }
    if (a.type === 'trigger' && b.type === 'trigger') {
      return a.avgSeverityChange - b.avgSeverityChange; // More positive is worse
    }
    return a.type === 'relief' ? -1 : 1; // Relief factors first
  });
}

/**
 * Human-readable summary of a correlation.
 * E.g., "When you log ice, severity drops 40% in the next 24 hours."
 */
export function describeCorrelation(corr: FactorCorrelation): string {
  const change = Math.abs(corr.avgSeverityChange).toFixed(1);
  const direction = corr.avgSeverityChange < 0 ? 'drops' : 'rises';

  return `When you log ${corr.factor}, severity ${direction} ${change} points (${corr.occurrences} times).`;
}
