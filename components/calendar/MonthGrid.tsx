import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { buildMonthGrid, formatMonthTitle } from '../../utils/appointmentHelpers';
import { useTheme } from '../../hooks/useTheme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface MonthGridProps {
  year: number;
  month: number;
  /** Date keys (YYYY-MM-DD) that have at least one appointment. */
  markedDateKeys: Set<string>;
  onSelectDay: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/**
 * Custom month calendar grid — deliberately built on plain Views
 * rather than a calendar library, since the only thing needed is a
 * 6-week grid with a dot on days that have an appointment.
 */
export function MonthGrid({
  year,
  month,
  markedDateKeys,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: MonthGridProps) {
  const theme = useTheme();
  const days = buildMonthGrid(year, month);
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: theme.spacing.sm,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        navButton: {
          width: 32,
          height: 32,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        monthTitle: {
          ...theme.typography.heading,
        },
        weekdayRow: {
          flexDirection: 'row',
        },
        weekdayLabel: {
          flex: 1,
          textAlign: 'center',
          ...theme.typography.caption,
          color: theme.colors.inkMuted,
        },
        weekRow: {
          flexDirection: 'row',
        },
        dayCell: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 4,
          gap: 2,
        },
        dayCircle: {
          width: 32,
          height: 32,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dayCircleToday: {
          backgroundColor: theme.colors.primary,
        },
        dayText: {
          ...theme.typography.body,
          fontSize: 14,
        },
        dayTextMuted: {
          color: theme.colors.inkMuted,
        },
        dayTextToday: {
          color: theme.colors.onPrimary,
          fontFamily: theme.fonts.semibold,
        },
        dot: {
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: theme.colors.accentPink,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={onPrevMonth}
          hitSlop={8}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.ink} />
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthTitle(year, month)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={onNextMonth}
          hitSlop={8}
          style={styles.navButton}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.colors.ink} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day) => {
            const hasAppointment = markedDateKeys.has(day.dateKey);
            return (
              <Pressable
                key={day.dateKey}
                accessibilityRole="button"
                accessibilityLabel={`${day.dateKey}${hasAppointment ? ', has appointment' : ''}`}
                onPress={() => onSelectDay(day.dateKey)}
                style={styles.dayCell}
              >
                <View style={[styles.dayCircle, day.isToday && styles.dayCircleToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      !day.inCurrentMonth && styles.dayTextMuted,
                      day.isToday && styles.dayTextToday,
                    ]}
                  >
                    {day.dayOfMonth}
                  </Text>
                </View>
                {hasAppointment ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
