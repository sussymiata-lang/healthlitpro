import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SymptomEntry } from '../../types/models';
import { useCustomSymptomStore } from '../../store/customSymptomStore';
import { useTheme } from '../../hooks/useTheme';
import { formatTime } from '../../utils/entryStats';
import { getSymptomOption, severityLabel } from '../../utils/symptoms';

interface EntryListItemProps {
  entry: SymptomEntry;
}

/**
 * One logged symptom in a list: tinted symptom icon, name, time, and a
 * severity pill. Shared by the Home dashboard and the History screen.
 * (Tappable entry detail is a post-MVP feature.)
 */
export function EntryListItem({ entry }: EntryListItemProps) {
  const theme = useTheme();
  const customSymptoms = useCustomSymptomStore((state) => state.customSymptoms);
  const symptom = getSymptomOption(entry.symptomType, customSymptoms);
  const qualities = entry.qualities ?? [];
  const qualitiesText = qualities.length > 0 ? ` · ${qualities.join(', ')}` : '';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          minHeight: 52,
        },
        iconCircle: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textColumn: {
          flex: 1,
          gap: 2,
        },
        title: {
          ...theme.typography.body,
          fontWeight: '600' as const,
        },
        qualities: {
          ...theme.typography.body,
          fontWeight: '400' as const,
          color: theme.colors.inkSecondary,
          fontSize: 14,
        },
        subtitle: {
          ...theme.typography.caption,
        },
        severityPill: {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
        severityText: {
          ...theme.typography.caption,
          color: theme.colors.ink,
          fontWeight: '600' as const,
        },
      }),
    [theme],
  );

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${symptom.label}${
        qualities.length > 0 ? `, feels ${qualities.join(', ')}` : ''
      }, severity ${entry.severity} out of 10, ${severityLabel(
        entry.severity,
      )}, at ${formatTime(entry.loggedAt)}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: symptom.tintSoft }]}>
        <Ionicons name={symptom.icon} size={18} color={symptom.tint} />
      </View>
      <View style={styles.textColumn}>
        <Text style={styles.title}>
          {symptom.label}
          {qualitiesText ? <Text style={styles.qualities}>{qualitiesText}</Text> : null}
        </Text>
        <Text style={styles.subtitle}>
          {formatTime(entry.loggedAt)} · {severityLabel(entry.severity)}
        </Text>
      </View>
      <View style={styles.severityPill}>
        <Text style={styles.severityText}>{entry.severity}/10</Text>
      </View>
    </View>
  );
}
