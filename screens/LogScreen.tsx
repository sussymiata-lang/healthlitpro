import React, { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BodyMap } from '../components/body/BodyMap';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Screen } from '../components/ui/Screen';
import { SelectCard } from '../components/ui/SelectCard';
import { useCustomSymptomStore } from '../store/customSymptomStore';
import { useLogStore } from '../store/logStore';
import { SymptomEntry } from '../types/models';
import { getRegionLabel } from '../utils/bodyRegions';
import { CUSTOM_SYMPTOM_ICONS, CUSTOM_SYMPTOM_TINTS } from '../utils/customSymptomPalette';
import { getStreakDays } from '../utils/entryStats';
import {
  DURATION_OPTIONS,
  LOCATION_SYMPTOMS,
  QUALITY_OPTIONS,
  QUALITY_SYMPTOMS,
  RELIEF_OPTIONS,
  SYMPTOM_OPTIONS,
  TRIGGER_OPTIONS,
  getSymptomOption,
  severityLabel,
} from '../utils/symptoms';
import { useTheme } from '../hooks/useTheme';

type StepKey = 'Symptom' | 'Severity' | 'Location' | 'Duration' | 'Factors' | 'Notes';
const SEVERITY_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Guided symptom check-in (Step 2 core feature). One question per
 * step, tap-to-continue, ~2 minutes end to end. The draft lives in the
 * Zustand store, so leaving the tab mid-flow never loses answers.
 */
export default function LogScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [savedEntry, setSavedEntry] = useState<SymptomEntry | null>(null);

  const draft = useLogStore((state) => state.draft);
  const saveDraft = useLogStore((state) => state.saveDraft);

  // The Location step only exists for symptoms where "where" makes
  // sense, so the flow is 5 or 6 steps depending on the selection.
  const steps: StepKey[] = React.useMemo(() => {
    const flow: StepKey[] = ['Symptom', 'Severity'];
    if (draft.symptomType !== null && LOCATION_SYMPTOMS.includes(draft.symptomType)) {
      flow.push('Location');
    }
    flow.push('Duration', 'Factors', 'Notes');
    return flow;
  }, [draft.symptomType]);

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];
  const isLastStep = stepIndex === steps.length - 1;

  // Symptom and severity are required; duration, factors, and notes
  // are optional so a user in pain can finish fast.
  const canContinue =
    currentStep === 'Symptom'
      ? draft.symptomType !== null
      : currentStep === 'Severity'
        ? draft.severity !== null
        : true;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stepCaption: {
          ...theme.typography.caption,
        },
        buttonRow: {
          flexDirection: 'row',
          gap: theme.spacing.md,
          marginTop: theme.spacing.sm,
        },
        backButton: {
          flex: 1,
        },
        continueButton: {
          flex: 2,
        },
      }),
    [theme],
  );

  const handleContinue = () => {
    if (!isLastStep) {
      setStepIndex((index) => index + 1);
      return;
    }
    Keyboard.dismiss();
    const entry = saveDraft();
    if (entry) {
      setSavedEntry(entry);
      setStepIndex(0);
    }
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(0, index - 1));
  };

  if (savedEntry) {
    return (
      <SuccessView
        entry={savedEntry}
        onDone={() => {
          setSavedEntry(null);
          router.push('/');
        }}
        onLogAnother={() => setSavedEntry(null)}
      />
    );
  }

  return (
    <Screen showHeader>
      <ProgressBar totalSteps={steps.length} currentStep={stepIndex} />
      <Text style={styles.stepCaption}>
        Step {stepIndex + 1} of {steps.length} — {currentStep}
      </Text>

      {currentStep === 'Symptom' && <SymptomStep />}
      {currentStep === 'Severity' && <SeverityStep />}
      {currentStep === 'Location' && <LocationStep />}
      {currentStep === 'Duration' && <DurationStep />}
      {currentStep === 'Factors' && <FactorsStep />}
      {currentStep === 'Notes' && <NotesStep />}

      <View style={styles.buttonRow}>
        {stepIndex > 0 && (
          <Button
            label="Back"
            variant="secondary"
            onPress={handleBack}
            style={styles.backButton}
            accessibilityHint="Returns to the previous question"
          />
        )}
        <Button
          label={isLastStep ? 'Save entry' : 'Continue'}
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.continueButton}
          accessibilityHint={
            isLastStep ? 'Saves this symptom entry' : 'Goes to the next question'
          }
        />
      </View>
    </Screen>
  );
}

/* ------------------------------- Steps ------------------------------- */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stepHeader: {
          gap: theme.spacing.xs,
        },
        stepTitle: {
          ...theme.typography.title,
        },
        stepSubtitle: {
          ...theme.typography.bodySecondary,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SymptomStep() {
  const theme = useTheme();
  const styles = useMemo(
    () => StyleSheet.create({ stepBody: { gap: theme.spacing.md } }),
    [theme],
  );
  const symptomType = useLogStore((state) => state.draft.symptomType);
  const setSymptomType = useLogStore((state) => state.setSymptomType);
  const customSymptoms = useCustomSymptomStore((state) => state.customSymptoms);
  const addCustomSymptom = useCustomSymptomStore((state) => state.addCustomSymptom);
  const [showAddCustom, setShowAddCustom] = useState(false);

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="What are you experiencing?"
        subtitle="Select the symptom you'd like to log today."
      />
      {SYMPTOM_OPTIONS.map((option) => (
        <SelectCard
          key={option.type}
          label={option.label}
          icon={option.icon}
          iconColor={option.tint}
          iconBackground={option.tintSoft}
          selected={symptomType === option.type}
          onPress={() => setSymptomType(option.type)}
        />
      ))}
      {customSymptoms.map((custom) => (
        <SelectCard
          key={custom.id}
          label={custom.label}
          icon={custom.icon as any}
          iconColor={custom.tint}
          iconBackground={custom.tintSoft}
          selected={symptomType === custom.id}
          onPress={() => setSymptomType(custom.id)}
        />
      ))}

      {showAddCustom ? (
        <AddCustomSymptomForm
          onCancel={() => setShowAddCustom(false)}
          onCreated={(id) => {
            setSymptomType(id);
            setShowAddCustom(false);
          }}
          addCustomSymptom={addCustomSymptom}
        />
      ) : (
        <Button
          label="Add custom symptom"
          variant="ghost"
          onPress={() => setShowAddCustom(true)}
          accessibilityHint="Create a symptom type not in this list"
        />
      )}
    </View>
  );
}

function AddCustomSymptomForm({
  onCancel,
  onCreated,
  addCustomSymptom,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
  addCustomSymptom: (label: string, icon: string, tint: string, tintSoft: string) => { id: string };
}) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        buttonRow: {
          flexDirection: 'row',
          gap: theme.spacing.md,
          marginTop: theme.spacing.sm,
        },
        backButton: {
          flex: 1,
        },
        continueButton: {
          flex: 2,
        },
        customSymptomCard: {
          gap: theme.spacing.sm,
        },
        customSymptomLabel: {
          ...theme.typography.caption,
          fontFamily: theme.fonts.semibold,
          marginTop: theme.spacing.xs,
        },
        customSymptomInput: {
          ...theme.typography.body,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
          minHeight: 44,
        },
        iconGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        },
        iconGridButton: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tintGrid: {
          flexDirection: 'row',
          gap: theme.spacing.sm,
        },
        tintSwatch: {
          width: 32,
          height: 32,
          borderRadius: theme.radius.pill,
          borderWidth: 2,
          borderColor: 'transparent',
          overflow: 'hidden' as const,
        },
        tintSwatchSelected: {
          borderColor: theme.colors.ink,
        },
      }),
    [theme],
  );
  const [label, setLabel] = useState('');
  const [iconIndex, setIconIndex] = useState(0);
  const [tintIndex, setTintIndex] = useState(0);

  const canCreate = label.trim() !== '';

  const handleCreate = () => {
    if (!canCreate) return;
    const icon = CUSTOM_SYMPTOM_ICONS[iconIndex];
    const { tint, tintSoft } = CUSTOM_SYMPTOM_TINTS[tintIndex];
    const created = addCustomSymptom(label.trim(), icon, tint, tintSoft);
    onCreated(created.id);
  };

  return (
    <Card style={styles.customSymptomCard}>
      <Text style={styles.customSymptomLabel}>Symptom name</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Brain fog, Joint stiffness"
        placeholderTextColor={theme.colors.inkMuted}
        style={styles.customSymptomInput}
        accessibilityLabel="Custom symptom name"
      />

      <Text style={styles.customSymptomLabel}>Icon</Text>
      <View style={styles.iconGrid}>
        {CUSTOM_SYMPTOM_ICONS.map((icon, index) => {
          const selected = index === iconIndex;
          return (
            <Pressable
              key={icon}
              onPress={() => setIconIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`Icon option ${index + 1}`}
              accessibilityState={{ selected }}
              style={[
                styles.iconGridButton,
                {
                  backgroundColor: selected
                    ? CUSTOM_SYMPTOM_TINTS[tintIndex].tintSoft
                    : theme.colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={18}
                color={selected ? CUSTOM_SYMPTOM_TINTS[tintIndex].tint : theme.colors.inkMuted}
              />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.customSymptomLabel}>Color</Text>
      <View style={styles.tintGrid}>
        {CUSTOM_SYMPTOM_TINTS.map((option, index) => (
          <Text
            key={option.tint}
            onPress={() => setTintIndex(index)}
            style={[
              styles.tintSwatch,
              { backgroundColor: option.tint },
              index === tintIndex && styles.tintSwatchSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Color option ${index + 1}`}
            accessibilityState={{ selected: index === tintIndex }}
          >
            {''}
          </Text>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.backButton} />
        <Button
          label="Create"
          onPress={handleCreate}
          disabled={!canCreate}
          style={styles.continueButton}
        />
      </View>
    </Card>
  );
}

function SeverityStep() {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stepBody: {
          gap: theme.spacing.md,
        },
        severityGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        },
        severityCellWrap: {
          borderRadius: theme.radius.pill,
        },
        severityCell: {
          width: 48,
          height: 48,
          lineHeight: 48,
          textAlign: 'center' as const,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          color: theme.colors.ink,
          fontSize: 16,
          fontWeight: '600' as const,
          overflow: 'hidden' as const,
        },
        severityCellSelected: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          color: theme.colors.onPrimary,
        },
        severityReadout: {
          ...theme.typography.heading,
          color: theme.colors.primary,
        },
      }),
    [theme],
  );
  const severity = useLogStore((state) => state.draft.severity);
  const setSeverity = useLogStore((state) => state.setSeverity);

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="How severe is it?"
        subtitle="0 means none at all, 10 is the worst imaginable."
      />
      <View style={styles.severityGrid}>
        {SEVERITY_VALUES.map((value) => {
          const selected = severity === value;
          return (
            <View key={value} style={styles.severityCellWrap}>
              <Text
                accessibilityRole="button"
                accessibilityLabel={`Severity ${value}, ${severityLabel(value)}`}
                accessibilityState={{ selected }}
                onPress={() => setSeverity(value)}
                style={[styles.severityCell, selected && styles.severityCellSelected]}
              >
                {value}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.severityReadout}>
        {severity === null
          ? 'Tap a number to select'
          : `${severity} / 10 — ${severityLabel(severity)}`}
      </Text>
    </View>
  );
}

function LocationStep() {
  const theme = useTheme();
  const styles = useMemo(
    () => StyleSheet.create({ stepBody: { gap: theme.spacing.md } }),
    [theme],
  );
  const bodyRegions = useLogStore((state) => state.draft.bodyRegions);
  const toggleBodyRegion = useLogStore((state) => state.toggleBodyRegion);

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="Where is it?"
        subtitle="Optional — tap the figure or the labels below."
      />
      <BodyMap selected={bodyRegions} onToggle={toggleBodyRegion} />
    </View>
  );
}

function DurationStep() {
  const theme = useTheme();
  const styles = useMemo(
    () => StyleSheet.create({ stepBody: { gap: theme.spacing.md } }),
    [theme],
  );
  const durationKey = useLogStore((state) => state.draft.durationKey);
  const setDurationKey = useLogStore((state) => state.setDurationKey);

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="How long has it lasted?"
        subtitle="Your best estimate is fine. Optional."
      />
      {DURATION_OPTIONS.map((option) => (
        <SelectCard
          key={option.key}
          label={option.label}
          selected={durationKey === option.key}
          onPress={() => setDurationKey(option.key)}
        />
      ))}
    </View>
  );
}

function FactorsStep() {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stepBody: {
          gap: theme.spacing.md,
        },
        factorHeading: {
          ...theme.typography.body,
          fontWeight: '600' as const,
          marginTop: theme.spacing.xs,
        },
        chipWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
        },
      }),
    [theme],
  );
  const symptomType = useLogStore((state) => state.draft.symptomType);
  const triggers = useLogStore((state) => state.draft.triggers);
  const reliefFactors = useLogStore((state) => state.draft.reliefFactors);
  const qualities = useLogStore((state) => state.draft.qualities);
  const toggleTrigger = useLogStore((state) => state.toggleTrigger);
  const toggleRelief = useLogStore((state) => state.toggleRelief);
  const toggleQuality = useLogStore((state) => state.toggleQuality);

  const showQualities =
    symptomType !== null && QUALITY_SYMPTOMS.includes(symptomType);

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="What affected it?"
        subtitle="Optional — tap any that apply."
      />
      {showQualities ? (
        <>
          <Text style={styles.factorHeading}>Feels like</Text>
          <View style={styles.chipWrap}>
            {QUALITY_OPTIONS.map((quality) => (
              <Chip
                key={quality}
                label={quality}
                selected={qualities.includes(quality)}
                onToggle={() => toggleQuality(quality)}
              />
            ))}
          </View>
        </>
      ) : null}
      <Text style={styles.factorHeading}>Made it worse</Text>
      <View style={styles.chipWrap}>
        {TRIGGER_OPTIONS.map((trigger) => (
          <Chip
            key={trigger}
            label={trigger}
            selected={triggers.includes(trigger)}
            onToggle={() => toggleTrigger(trigger)}
          />
        ))}
      </View>
      <Text style={styles.factorHeading}>Helped</Text>
      <View style={styles.chipWrap}>
        {RELIEF_OPTIONS.map((relief) => (
          <Chip
            key={relief}
            label={relief}
            selected={reliefFactors.includes(relief)}
            onToggle={() => toggleRelief(relief)}
          />
        ))}
      </View>
    </View>
  );
}

function NotesStep() {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stepBody: {
          gap: theme.spacing.md,
        },
        factorHeading: {
          ...theme.typography.body,
          fontWeight: '600' as const,
          marginTop: theme.spacing.xs,
        },
        input: {
          ...theme.typography.body,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          minHeight: 88,
          textAlignVertical: 'top' as const,
        },
        inputTall: {
          minHeight: 112,
        },
      }),
    [theme],
  );
  const impactNote = useLogStore((state) => state.draft.impactNote);
  const note = useLogStore((state) => state.draft.note);
  const setImpactNote = useLogStore((state) => state.setImpactNote);
  const setNote = useLogStore((state) => state.setNote);

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="Anything else to add?"
        subtitle="Optional — this helps your doctor understand impact."
      />
      <Text style={styles.factorHeading}>How did it affect your day?</Text>
      <TextInput
        value={impactNote}
        onChangeText={setImpactNote}
        placeholder="e.g. Hard to focus at work, skipped my walk"
        placeholderTextColor={theme.colors.inkMuted}
        multiline
        maxLength={280}
        style={styles.input}
        accessibilityLabel="How did it affect your day"
      />
      <Text style={styles.factorHeading}>Notes</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Sharp on the left side, started after lunch"
        placeholderTextColor={theme.colors.inkMuted}
        multiline
        maxLength={500}
        style={[styles.input, styles.inputTall]}
        accessibilityLabel="Additional notes"
      />
    </View>
  );
}

/* ----------------------------- Success ------------------------------ */

interface SuccessViewProps {
  entry: SymptomEntry;
  onDone: () => void;
  onLogAnother: () => void;
}

function SuccessView({ entry, onDone, onLogAnother }: SuccessViewProps) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        successHeader: {
          alignItems: 'center',
          gap: theme.spacing.md,
          marginTop: theme.spacing.lg,
        },
        successCircle: {
          width: 64,
          height: 64,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.successSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        successTitle: {
          ...theme.typography.title,
        },
        streakText: {
          ...theme.typography.bodySecondary,
          color: theme.colors.primary,
          fontWeight: '600' as const,
          textAlign: 'center' as const,
        },
        successNote: {
          ...theme.typography.caption,
          textAlign: 'center' as const,
        },
        summaryCard: {
          gap: theme.spacing.md,
        },
      }),
    [theme],
  );
  const totalEntries = useLogStore((state) => state.entries.length);
  const entries = useLogStore((state) => state.entries);
  const streak = getStreakDays(entries);
  const customSymptoms = useCustomSymptomStore((state) => state.customSymptoms);
  const symptom = getSymptomOption(entry.symptomType, customSymptoms);
  const duration = DURATION_OPTIONS.find(
    (option) => option.minutes === entry.durationMinutes,
  );
  const factorCount = entry.triggers.length + entry.reliefFactors.length;

  return (
    <Screen showHeader>
      <View style={styles.successHeader}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={32} color={theme.colors.success} />
        </View>
        <Text style={styles.successTitle}>Symptom logged</Text>
        {streak >= 3 ? (
          <Text style={styles.streakText}>
            {streak}-day streak — consistent logs make your reports far
            more useful.
          </Text>
        ) : null}
      </View>

      <Card style={styles.summaryCard}>
        <SummaryRow label="Symptom" value={symptom.label} />
        <SummaryRow
          label="Severity"
          value={`${entry.severity} / 10 · ${severityLabel(entry.severity)}`}
        />
        {entry.qualities && entry.qualities.length > 0 && (
          <SummaryRow label="Feels like" value={entry.qualities.join(', ')} />
        )}
        {entry.bodyRegions && entry.bodyRegions.length > 0 && (
          <SummaryRow
            label="Location"
            value={entry.bodyRegions.map(getRegionLabel).join(', ')}
          />
        )}
        <SummaryRow label="Duration" value={duration ? duration.label : 'Not set'} />
        <SummaryRow
          label="Factors"
          value={factorCount > 0 ? `${factorCount} selected` : 'None'}
        />
      </Card>

      <Text style={styles.successNote}>
        Saved on this device — {totalEntries}{' '}
        {totalEntries === 1 ? 'entry' : 'entries'} logged so far. Your
        dashboard arrives in Step 4.
      </Text>

      <Button label="Done" onPress={onDone} accessibilityHint="Returns to Home" />
      <Button
        label="Log another symptom"
        variant="secondary"
        onPress={onLogAnother}
        accessibilityHint="Starts a new symptom entry"
      />
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        },
        summaryLabel: {
          ...theme.typography.bodySecondary,
        },
        summaryValue: {
          ...theme.typography.body,
          fontWeight: '600' as const,
          flexShrink: 1,
          textAlign: 'right' as const,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

/* ------------------------------ Styles ------------------------------ */
