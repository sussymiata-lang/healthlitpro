/**
 * Symptoms-to-Story engine.
 *
 * Turns logged entries into a short, plain-English narrative — the
 * kind of summary a person would want to read themselves, and the
 * kind of opening paragraph that helps a doctor get oriented in
 * seconds instead of scanning a table.
 *
 * HONESTY RULE: every insight here is built strictly from data the
 * app actually collects (severity, triggers, reliefs, qualities, body
 * regions, timestamps). Nothing is inferred about sleep, weather, or
 * anything else HealthLit doesn't track. Each insight also requires a
 * minimum number of supporting entries before it's surfaced at all —
 * a "pattern" built from one or two data points is worse than no
 * pattern, especially in a medical context, so those are left out
 * rather than overclaimed.
 */

import { CustomSymptom, SymptomEntry } from '../types/models';
import { getRegionLabel } from './bodyRegions';
import { analyzeCorrelations } from './correlationAnalyzer';
import { getSymptomOption } from './symptoms';

export interface StoryInsight {
  /** Ionicon name for the insight's leading icon. */
  icon: string;
  /** Short label, e.g. "Trend". */
  label: string;
  /** The actual sentence(s) shown to the person. */
  narrative: string;
}

const MIN_ENTRIES_FOR_TREND = 4;
const MIN_ENTRIES_FOR_PATTERN = 4;
const MIN_OCCURRENCES_FOR_CORRELATION = 2;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function filterToRange(entries: SymptomEntry[], days: number, now: Date): SymptomEntry[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);
  return entries.filter((entry) => new Date(entry.loggedAt) >= cutoff);
}

/** Trend insight: average severity, first half of the period vs second half. */
function buildTrendInsight(
  entries: SymptomEntry[],
  customSymptoms: CustomSymptom[],
): StoryInsight | null {
  if (entries.length < MIN_ENTRIES_FOR_TREND) return null;

  const sorted = [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const avg = (list: SymptomEntry[]) =>
    list.reduce((sum, e) => sum + e.severity, 0) / list.length;

  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);
  const delta = secondAvg - firstAvg;

  // Find the most-logged symptom to name in the sentence.
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.symptomType, (counts.get(entry.symptomType) ?? 0) + 1);
  }
  const topType = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topLabel = topType
    ? getSymptomOption(topType, customSymptoms).label.toLowerCase()
    : 'symptom';

  let narrative: string;
  if (Math.abs(delta) < 0.5) {
    narrative = `Your ${topLabel} severity has stayed fairly steady, averaging ${firstAvg.toFixed(1)}/10 across this period.`;
  } else if (delta < 0) {
    narrative = `Your ${topLabel} severity has trended down — from an average of ${firstAvg.toFixed(1)}/10 earlier in this period to ${secondAvg.toFixed(1)}/10 more recently.`;
  } else {
    narrative = `Your ${topLabel} severity has trended up — from an average of ${firstAvg.toFixed(1)}/10 earlier in this period to ${secondAvg.toFixed(1)}/10 more recently.`;
  }

  return { icon: 'trending-up-outline', label: 'Trend', narrative };
}

/** Strongest measured trigger and relief, reusing the correlation analyzer. */
function buildCorrelationInsights(
  entries: SymptomEntry[],
  rangeDays: number,
): StoryInsight[] {
  const correlations = analyzeCorrelations(entries, rangeDays);
  const insights: StoryInsight[] = [];

  const topRelief = correlations
    .filter((c) => c.type === 'relief' && c.occurrences >= MIN_OCCURRENCES_FOR_CORRELATION)
    .sort((a, b) => a.avgSeverityChange - b.avgSeverityChange)[0];

  if (topRelief) {
    const change = Math.abs(topRelief.avgSeverityChange).toFixed(1);
    insights.push({
      icon: 'leaf-outline',
      label: 'What helps',
      narrative: `"${topRelief.factor}" is your most consistently helpful relief factor — severity dropped by about ${change} points afterward, across ${topRelief.occurrences} occasions.`,
    });
  }

  const topTrigger = correlations
    .filter((c) => c.type === 'trigger' && c.occurrences >= MIN_OCCURRENCES_FOR_CORRELATION)
    .sort((a, b) => b.avgSeverityChange - a.avgSeverityChange)[0];

  if (topTrigger) {
    const change = Math.abs(topTrigger.avgSeverityChange).toFixed(1);
    insights.push({
      icon: 'alert-circle-outline',
      label: 'Common trigger',
      narrative: `"${topTrigger.factor}" shows up as your most consistent trigger — severity rose by about ${change} points afterward, across ${topTrigger.occurrences} occasions.`,
    });
  }

  return insights;
}

/** Day-of-week pattern: is one day of the week notably worse than the others. */
function buildDayOfWeekInsight(entries: SymptomEntry[]): StoryInsight | null {
  if (entries.length < MIN_ENTRIES_FOR_PATTERN) return null;

  const byDay: number[][] = [[], [], [], [], [], [], []];
  for (const entry of entries) {
    const day = new Date(entry.loggedAt).getDay();
    byDay[day].push(entry.severity);
  }

  const dayAverages = byDay.map((severities) =>
    severities.length > 0
      ? severities.reduce((sum, s) => sum + s, 0) / severities.length
      : null,
  );

  const daysWithData = dayAverages.filter((avg): avg is number => avg !== null);
  if (daysWithData.length < 3) return null;

  const overallAvg = daysWithData.reduce((sum, avg) => sum + avg, 0) / daysWithData.length;

  let worstDayIndex = -1;
  let worstDelta = 0;
  dayAverages.forEach((avg, index) => {
    if (avg === null || byDay[index].length < 2) return;
    const delta = avg - overallAvg;
    if (delta > worstDelta) {
      worstDelta = delta;
      worstDayIndex = index;
    }
  });

  // Require a meaningfully worse day, not just noise.
  if (worstDayIndex === -1 || worstDelta < 1.0) return null;

  return {
    icon: 'calendar-outline',
    label: 'Day pattern',
    narrative: `Symptoms have tended to run higher on ${DAY_NAMES[worstDayIndex]}s — worth mentioning if anything regularly falls on that day.`,
  };
}

/** Time-of-day pattern: do entries cluster in one part of the day. */
function buildTimeOfDayInsight(entries: SymptomEntry[]): StoryInsight | null {
  if (entries.length < MIN_ENTRIES_FOR_PATTERN) return null;

  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const entry of entries) {
    const hour = new Date(entry.loggedAt).getHours();
    if (hour >= 5 && hour < 12) buckets.morning += 1;
    else if (hour >= 12 && hour < 17) buckets.afternoon += 1;
    else if (hour >= 17 && hour < 22) buckets.evening += 1;
    else buckets.night += 1;
  }

  const total = entries.length;
  const [topBucket, topCount] = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  const proportion = topCount / total;

  // Require a clear majority, not a near-even split.
  if (proportion < 0.5) return null;

  return {
    icon: 'time-outline',
    label: 'Time of day',
    narrative: `Most entries were logged in the ${topBucket} (${Math.round(proportion * 100)}% of the time) — that may be when symptoms are most noticeable, or simply when logging fits your day.`,
  };
}

/** Most frequently marked body region, for symptoms that collect location. */
function buildBodyRegionInsight(entries: SymptomEntry[]): StoryInsight | null {
  const withRegions = entries.filter((e) => e.bodyRegions && e.bodyRegions.length > 0);
  if (withRegions.length < MIN_OCCURRENCES_FOR_CORRELATION) return null;

  const counts = new Map<string, number>();
  for (const entry of withRegions) {
    for (const region of entry.bodyRegions ?? []) {
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
  }

  const [topRegionId, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (count < MIN_OCCURRENCES_FOR_CORRELATION) return null;

  return {
    icon: 'body-outline',
    label: 'Location',
    narrative: `The most frequently marked location was your ${getRegionLabel(topRegionId).toLowerCase()}, noted ${count} times.`,
  };
}

/** Most common "feels like" quality descriptor. */
function buildQualityInsight(entries: SymptomEntry[]): StoryInsight | null {
  const withQualities = entries.filter((e) => e.qualities && e.qualities.length > 0);
  if (withQualities.length < MIN_OCCURRENCES_FOR_CORRELATION) return null;

  const counts = new Map<string, number>();
  for (const entry of withQualities) {
    for (const quality of entry.qualities ?? []) {
      counts.set(quality, (counts.get(quality) ?? 0) + 1);
    }
  }

  const [topQuality, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (count < MIN_OCCURRENCES_FOR_CORRELATION) return null;

  return {
    icon: 'chatbox-ellipses-outline',
    label: 'How it feels',
    narrative: `You've most often described the sensation as "${topQuality.toLowerCase()}" (${count} entries).`,
  };
}

/**
 * Builds the full story: a set of insights, each independently gated
 * on having enough supporting data. Returns an empty array if there
 * simply isn't enough logged yet — the caller should show a
 * "keep logging" empty state in that case, not force a thin story.
 */
export function buildStory(
  entries: SymptomEntry[],
  rangeDays: number,
  customSymptoms: CustomSymptom[] = [],
  now: Date = new Date(),
): StoryInsight[] {
  const inRange = filterToRange(entries, rangeDays, now);

  const insights: StoryInsight[] = [];

  const trend = buildTrendInsight(inRange, customSymptoms);
  if (trend) insights.push(trend);

  insights.push(...buildCorrelationInsights(inRange, rangeDays));

  const dayPattern = buildDayOfWeekInsight(inRange);
  if (dayPattern) insights.push(dayPattern);

  const timePattern = buildTimeOfDayInsight(inRange);
  if (timePattern) insights.push(timePattern);

  const bodyPattern = buildBodyRegionInsight(inRange);
  if (bodyPattern) insights.push(bodyPattern);

  const qualityPattern = buildQualityInsight(inRange);
  if (qualityPattern) insights.push(qualityPattern);

  return insights;
}

/** True if there's enough data to generate any story at all. */
export function hasEnoughDataForStory(entries: SymptomEntry[], rangeDays: number, now: Date = new Date()): boolean {
  return filterToRange(entries, rangeDays, now).length >= MIN_ENTRIES_FOR_TREND;
}
