import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Screen } from '../components/ui/Screen';
import { useCustomSymptomStore } from '../store/customSymptomStore';
import { useLogStore } from '../store/logStore';
import { useTheme } from '../hooks/useTheme';
import { buildStory, hasEnoughDataForStory, StoryInsight } from '../utils/storyEngine';

const RANGE_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
] as const;

/** Joins insight narratives into one flowing paragraph. */
function composeNarrative(insights: StoryInsight[]): string {
  return insights.map((insight) => insight.narrative).join(' ');
}

/**
 * Symptoms-to-Story screen — HealthLit's signature feature. Converts
 * logged data into a plain-English narrative summary, the kind of
 * opening paragraph that helps a doctor get oriented in seconds
 * instead of scanning a table of numbers.
 */
export default function StoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const entries = useLogStore((state) => state.entries);
  const customSymptoms = useCustomSymptomStore((state) => state.customSymptoms);
  const [rangeDays, setRangeDays] = useState(7);

  const hasEnoughData = useMemo(
    () => hasEnoughDataForStory(entries, rangeDays),
    [entries, rangeDays],
  );

  const insights = useMemo(
    () => buildStory(entries, rangeDays, customSymptoms),
    [entries, rangeDays, customSymptoms],
  );

  const narrative = useMemo(() => composeNarrative(insights), [insights]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.card,
        },
        headerTitle: {
          ...theme.typography.title,
        },
        rangeRow: {
          flexDirection: 'row',
          gap: theme.spacing.sm,
        },
        scrollContent: {
          gap: theme.spacing.md,
        },
        emptyCard: {
          gap: theme.spacing.md,
        },
        emptyTitle: {
          ...theme.typography.heading,
        },
        emptyText: {
          ...theme.typography.bodySecondary,
        },
        storyCard: {
          gap: theme.spacing.sm,
        },
        storyBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.xs,
        },
        storyBadgeText: {
          ...theme.typography.caption,
          color: theme.colors.primary,
          fontFamily: theme.fonts.semibold,
        },
        storyParagraph: {
          ...theme.typography.body,
          lineHeight: 26,
        },
        insightsTitle: {
          ...theme.typography.heading,
        },
        insightCard: {
          flexDirection: 'row',
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        insightIcon: {
          width: 36,
          height: 36,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        insightBody: {
          flex: 1,
          gap: 2,
        },
        insightLabel: {
          ...theme.typography.caption,
          fontFamily: theme.fonts.semibold,
          color: theme.colors.primary,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        },
        insightNarrative: {
          ...theme.typography.bodySecondary,
        },
        disclaimer: {
          ...theme.typography.caption,
          textAlign: 'center' as const,
        },
      }),
    [theme],
  );

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Story</Text>
      </View>

      <View style={styles.rangeRow}>
        {RANGE_OPTIONS.map((option) => (
          <Chip
            key={option.days}
            label={option.label}
            selected={rangeDays === option.days}
            onToggle={() => setRangeDays(option.days)}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!hasEnoughData ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Still gathering your story</Text>
            <Text style={styles.emptyText}>
              Log a few more symptoms over the next few days and HealthLit
              will start turning your entries into a plain-English summary
              — the kind you can read yourself, or hand to your doctor.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.storyCard}>
              <View style={styles.storyBadge}>
                <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.storyBadgeText}>Your summary</Text>
              </View>
              <Text style={styles.storyParagraph}>{narrative}</Text>
            </Card>

            <Text style={styles.insightsTitle}>What this is based on</Text>
            {insights.map((insight, index) => (
              <Card key={index} style={styles.insightCard}>
                <View style={styles.insightIcon}>
                  <Ionicons name={insight.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.insightBody}>
                  <Text style={styles.insightLabel}>{insight.label}</Text>
                  <Text style={styles.insightNarrative}>{insight.narrative}</Text>
                </View>
              </Card>
            ))}

            <Text style={styles.disclaimer}>
              This summary reflects patterns in your self-reported entries
              and isn't a clinical diagnosis. Share it with your doctor as
              a starting point for conversation, not a conclusion.
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
