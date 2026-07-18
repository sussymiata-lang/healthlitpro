import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MonthGrid } from '../components/calendar/MonthGrid';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Screen } from '../components/ui/Screen';
import { useAppointmentStore } from '../store/appointmentStore';
import { Appointment } from '../types/models';
import { dateKeyFromDate } from '../utils/entryStats';
import {
  formatAppointmentDateTime,
  getAppointmentDateKeys,
  getUpcomingAppointments,
} from '../utils/appointmentHelpers';
import { useTheme } from '../hooks/useTheme';

const QUICK_TIMES = [
  { label: 'Morning', hour: 9, minute: 0 },
  { label: 'Midday', hour: 12, minute: 0 },
  { label: 'Afternoon', hour: 14, minute: 0 },
  { label: 'Evening', hour: 17, minute: 0 },
] as const;

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = [0, 15, 30, 45];

function todayKey(): string {
  return dateKeyFromDate(new Date());
}

/** "Jul 13, 2026" from a YYYY-MM-DD key. */
function formatSelectedDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calendar tab: month grid with appointment dots, the selected day's
 * appointments, an add/edit form with appointment-prep fields (chief
 * complaint, what's changed, questions to ask), and an upcoming list.
 */
export default function CalendarScreen() {
  const theme = useTheme();
  const appointments = useAppointmentStore((state) => state.appointments);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey());
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);

  const markedDateKeys = useMemo(() => getAppointmentDateKeys(appointments), [appointments]);

  const appointmentsOnSelectedDay = useMemo(
    () =>
      appointments.filter(
        (appt) => dateKeyFromDate(new Date(appt.dateTime)) === selectedDateKey,
      ),
    [appointments, selectedDateKey],
  );

  const upcoming = useMemo(() => getUpcomingAppointments(appointments), [appointments]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setShowForm(false);
    setEditingAppointment(null);
  };

  const handleStartAdd = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleStartEdit = (appt: Appointment) => {
    setEditingAppointment(appt);
    setSelectedDateKey(dateKeyFromDate(new Date(appt.dateTime)));
    setShowForm(true);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        title: {
          ...theme.typography.title,
        },
        gridCard: {
          gap: theme.spacing.sm,
        },
        sectionCard: {
          gap: theme.spacing.md,
        },
        sectionTitle: {
          ...theme.typography.heading,
        },
        emptyText: {
          ...theme.typography.bodySecondary,
        },
      }),
    [theme],
  );

  if (showForm) {
    return (
      <AppointmentForm
        dateKey={selectedDateKey}
        initial={editingAppointment}
        onDone={() => {
          setShowForm(false);
          setEditingAppointment(null);
        }}
      />
    );
  }

  return (
    <Screen showHeader>
      <Text style={styles.title}>Calendar</Text>

      <Card style={styles.gridCard}>
        <MonthGrid
          year={viewYear}
          month={viewMonth}
          markedDateKeys={markedDateKeys}
          onSelectDay={handleSelectDay}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{formatSelectedDateLabel(selectedDateKey)}</Text>
        {appointmentsOnSelectedDay.length === 0 ? (
          <Text style={styles.emptyText}>No appointments on this day.</Text>
        ) : (
          appointmentsOnSelectedDay.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} onEdit={() => handleStartEdit(appt)} />
          ))
        )}
        <Button
          label="Add appointment"
          variant="secondary"
          onPress={handleStartAdd}
          accessibilityHint="Opens the appointment form for this day"
        />
      </Card>

      {upcoming.length > 0 && (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcoming.slice(0, 5).map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} onEdit={() => handleStartEdit(appt)} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

/* ---------------------------- Appointment card --------------------------- */

function AppointmentCard({
  appointment,
  onEdit,
}: {
  appointment: Appointment;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const removeAppointment = useAppointmentStore((state) => state.removeAppointment);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        apptCard: {
          gap: 4,
          paddingBottom: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        apptHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        apptHeaderText: {
          flex: 1,
        },
        apptDoctor: {
          ...theme.typography.body,
          fontFamily: theme.fonts.semibold,
        },
        apptSpecialty: {
          ...theme.typography.caption,
        },
        apptDateTime: {
          ...theme.typography.bodySecondary,
          color: theme.colors.primary,
        },
        apptLocation: {
          ...theme.typography.caption,
        },
        prepBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: 2,
        },
        prepBadgeText: {
          ...theme.typography.caption,
          color: theme.colors.primary,
        },
      }),
    [theme],
  );
  const hasPrep =
    appointment.chiefComplaint || appointment.changesSinceLastVisit || appointment.questionsToAsk.length > 0;

  return (
    <Pressable onPress={onEdit} style={styles.apptCard} accessibilityRole="button">
      <View style={styles.apptHeader}>
        <View style={styles.apptHeaderText}>
          <Text style={styles.apptDoctor}>{appointment.doctorName}</Text>
          {appointment.specialty ? (
            <Text style={styles.apptSpecialty}>{appointment.specialty}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete appointment with ${appointment.doctorName}`}
          onPress={() => removeAppointment(appointment.id)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </Pressable>
      </View>
      <Text style={styles.apptDateTime}>{formatAppointmentDateTime(appointment.dateTime)}</Text>
      {appointment.location ? (
        <Text style={styles.apptLocation}>{appointment.location}</Text>
      ) : null}
      {hasPrep ? (
        <View style={styles.prepBadge}>
          <Ionicons name="document-text-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.prepBadgeText}>Prep notes added</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------- Add/Edit form ---------------------------- */

function AppointmentForm({
  dateKey,
  initial,
  onDone,
}: {
  dateKey: string;
  initial: Appointment | null;
  onDone: () => void;
}) {
  const theme = useTheme();
  const addAppointment = useAppointmentStore((state) => state.addAppointment);
  const updateAppointment = useAppointmentStore((state) => state.updateAppointment);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        formHeaderRow: {
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
        formHeaderTitle: {
          ...theme.typography.title,
        },
        formScroll: {
          gap: theme.spacing.md,
        },
        card: {
          gap: theme.spacing.md,
        },
        dateLabel: {
          ...theme.typography.bodySecondary,
          fontFamily: theme.fonts.semibold,
        },
        chipWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        },
        customTime: {
          gap: theme.spacing.sm,
          marginTop: theme.spacing.sm,
        },
        divider: {
          height: 1,
          backgroundColor: theme.colors.border,
          marginVertical: theme.spacing.xs,
        },
        prepIntro: {
          ...theme.typography.caption,
        },
        field: {
          gap: theme.spacing.xs,
        },
        fieldLabel: {
          ...theme.typography.caption,
          fontFamily: theme.fonts.semibold,
        },
      }),
    [theme],
  );

  const initialDate = initial ? new Date(initial.dateTime) : null;

  const [doctorName, setDoctorName] = useState(initial?.doctorName ?? '');
  const [specialty, setSpecialty] = useState(initial?.specialty ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [chiefComplaint, setChiefComplaint] = useState(initial?.chiefComplaint ?? '');
  const [changesSinceLastVisit, setChangesSinceLastVisit] = useState(
    initial?.changesSinceLastVisit ?? '',
  );
  const [questionsText, setQuestionsText] = useState(
    initial?.questionsToAsk.join('\n') ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [hour, setHour] = useState(initialDate ? ((initialDate.getHours() % 12) || 12) : 9);
  const [minute, setMinute] = useState(initialDate ? initialDate.getMinutes() : 0);
  const [isPM, setIsPM] = useState(initialDate ? initialDate.getHours() >= 12 : false);
  const [showCustomTime, setShowCustomTime] = useState(!!initial);

  const canSave = doctorName.trim() !== '';

  const buildDateTime = (h: number, m: number, pm: boolean): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const hour24 = h === 12 ? (pm ? 12 : 0) : pm ? h + 12 : h;
    const date = new Date(year, month - 1, day, hour24, m);
    return date.toISOString();
  };

  const handleQuickTime = (preset: (typeof QUICK_TIMES)[number]) => {
    const pm = preset.hour >= 12;
    const displayHour = preset.hour > 12 ? preset.hour - 12 : preset.hour;
    setHour(displayHour);
    setMinute(preset.minute);
    setIsPM(pm);
    setShowCustomTime(false);
  };

  const handleSave = () => {
    if (!canSave) return;

    const fields = {
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || null,
      dateTime: buildDateTime(hour, minute, isPM),
      location: location.trim() || null,
      chiefComplaint: chiefComplaint.trim() || null,
      changesSinceLastVisit: changesSinceLastVisit.trim() || null,
      questionsToAsk: questionsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== ''),
      notes: notes.trim() || null,
    };

    if (initial) {
      updateAppointment(initial.id, fields);
    } else {
      addAppointment(fields);
    }
    onDone();
  };

  const activePreset = QUICK_TIMES.find((preset) => {
    const presetPM = preset.hour >= 12;
    const presetDisplayHour =
      preset.hour > 12 ? preset.hour - 12 : preset.hour;
    return presetDisplayHour === hour && preset.minute === minute && presetPM === isPM;
  });

  return (
    <Screen>
      <View style={styles.formHeaderRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onDone}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.ink} />
        </Pressable>
        <Text style={styles.formHeaderTitle}>
          {initial ? 'Edit appointment' : 'New appointment'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.dateLabel}>{formatSelectedDateLabel(dateKey)}</Text>

          <FormField label="Doctor name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Aisha Khan" required />
          <FormField label="Specialty" value={specialty} onChangeText={setSpecialty} placeholder="e.g. Rheumatology" />
          <FormField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Riverside Clinic, Room 4" />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Time</Text>
            <View style={styles.chipWrap}>
              {QUICK_TIMES.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  selected={!showCustomTime && activePreset?.label === preset.label}
                  onToggle={() => handleQuickTime(preset)}
                />
              ))}
              <Chip
                label="Custom"
                selected={showCustomTime}
                onToggle={() => setShowCustomTime(true)}
              />
            </View>

            {showCustomTime && (
              <View style={styles.customTime}>
                <View style={styles.chipWrap}>
                  {HOUR_OPTIONS.map((h) => (
                    <Chip key={h} label={String(h)} selected={hour === h} onToggle={() => setHour(h)} />
                  ))}
                </View>
                <View style={styles.chipWrap}>
                  {MINUTE_OPTIONS.map((m) => (
                    <Chip
                      key={m}
                      label={m === 0 ? ':00' : `:${m}`}
                      selected={minute === m}
                      onToggle={() => setMinute(m)}
                    />
                  ))}
                </View>
                <View style={styles.chipWrap}>
                  <Chip label="AM" selected={!isPM} onToggle={() => setIsPM(false)} />
                  <Chip label="PM" selected={isPM} onToggle={() => setIsPM(true)} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.divider} />
          <Text style={styles.prepIntro}>
            Appointment prep — helps you remember what to bring up (all optional).
          </Text>

          <FormField
            label="Chief complaint"
            value={chiefComplaint}
            onChangeText={setChiefComplaint}
            placeholder="What's the main thing to discuss first?"
            multiline
          />
          <FormField
            label="What's changed since last visit"
            value={changesSinceLastVisit}
            onChangeText={setChangesSinceLastVisit}
            placeholder="New symptoms, medication changes, etc."
            multiline
          />
          <FormField
            label="Questions to ask"
            value={questionsText}
            onChangeText={setQuestionsText}
            placeholder={'One per line, e.g.\nCan we adjust my dosage?\nIs this normal?'}
            multiline
          />
          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything else"
            multiline
          />

          <Button label={initial ? 'Save changes' : 'Add appointment'} onPress={handleSave} disabled={!canSave} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          gap: theme.spacing.xs,
        },
        fieldLabel: {
          ...theme.typography.caption,
          fontFamily: theme.fonts.semibold,
        },
        input: {
          ...theme.typography.body,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          minHeight: 48,
        },
        inputMultiline: {
          minHeight: 80,
          textAlignVertical: 'top' as const,
        },
      }),
    [theme],
  );
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inkMuted}
        style={[styles.input, multiline && styles.inputMultiline]}
        accessibilityLabel={label}
        multiline={multiline}
      />
    </View>
  );
}

/* ---------------------------------- Styles --------------------------------- */
