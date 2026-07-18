import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Screen } from '../components/ui/Screen';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { ThemeModePreference, useThemeModeStore } from '../store/themeModeStore';
import { UserProfile } from '../types/models';
import { useTheme } from '../hooks/useTheme';

/**
 * Profile screen. Holds the health-profile info that appears on the
 * doctor PDF report header (name, condition, doctor, emergency
 * contact). Shows a setup form until a profile exists, then a summary
 * card with an edit toggle. Also surfaces the optional "Back up &
 * Sync" feature — never a requirement to use the rest of the app.
 *
 * DATA SENSITIVITY: never log field values while editing.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useProfileStore((state) => state.profile);
  const [isEditing, setIsEditing] = useState(false);

  const showForm = profile === null || isEditing;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        title: {
          ...theme.typography.title,
        },
      }),
    [theme],
  );

  return (
    <Screen showHeader>
      <Text style={styles.title}>Profile</Text>

      {showForm ? (
        <ProfileForm
          initial={profile}
          onSaved={() => setIsEditing(false)}
          onCancel={profile ? () => setIsEditing(false) : undefined}
        />
      ) : (
        <ProfileSummary profile={profile} onEdit={() => setIsEditing(true)} />
      )}

      <AppearanceCard />
      <BackupSyncCard />
    </Screen>
  );
}

/* -------------------------------- Appearance ---------------------------- */

function AppearanceCard() {
  const theme = useTheme();
  const preference = useThemeModeStore((state) => state.preference);
  const setPreference = useThemeModeStore((state) => state.setPreference);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: theme.spacing.md,
        },
        title: {
          ...theme.typography.body,
          fontFamily: theme.fonts.semibold,
        },
        optionRow: {
          flexDirection: 'row',
          gap: theme.spacing.sm,
        },
      }),
    [theme],
  );

  const options: { key: ThemeModePreference; label: string }[] = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' },
  ];

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Appearance</Text>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            selected={preference === option.key}
            onToggle={() => setPreference(option.key)}
          />
        ))}
      </View>
    </Card>
  );
}

/* --------------------------- Back up & Sync ---------------------------- */

function BackupSyncCard() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOutUser = useAuthStore((state) => state.signOutUser);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: theme.spacing.md,
        },
        syncHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        },
        syncIcon: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        syncHeaderText: {
          flex: 1,
          gap: 2,
        },
        syncTitle: {
          ...theme.typography.body,
          fontFamily: theme.fonts.semibold,
        },
        syncSubtitle: {
          ...theme.typography.caption,
        },
      }),
    [theme],
  );

  if (user === null) {
    return (
      <Card style={styles.card}>
        <View style={styles.syncHeader}>
          <View style={styles.syncIcon}>
            <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.syncHeaderText}>
            <Text style={styles.syncTitle}>Back up & Sync</Text>
            <Text style={styles.syncSubtitle}>
              Optional — your data already stays on this device.
            </Text>
          </View>
        </View>
        <Button
          label="Sign in to back up"
          variant="secondary"
          onPress={() => router.push('/auth')}
          accessibilityHint="Opens sign-in to back up and sync your data"
        />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.syncHeader}>
        <View style={[styles.syncIcon, { backgroundColor: theme.colors.successSoft }]}>
          <Ionicons name="cloud-done-outline" size={20} color={theme.colors.success} />
        </View>
        <View style={styles.syncHeaderText}>
          <Text style={styles.syncTitle}>Backed up</Text>
          <Text style={styles.syncSubtitle}>{user.email ?? user.displayName ?? 'Signed in'}</Text>
        </View>
      </View>
      <Button label="Sign out" variant="secondary" onPress={() => void signOutUser()} />
    </Card>
  );
}

/* ------------------------------- Summary ------------------------------ */

function ProfileSummary({
  profile,
  onEdit,
}: {
  profile: UserProfile;
  onEdit: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: theme.spacing.md,
        },
        summaryHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        },
        avatarCircle: {
          width: 48,
          height: 48,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        summaryHeaderText: {
          flex: 1,
          gap: 2,
        },
        name: {
          ...theme.typography.heading,
        },
        condition: {
          ...theme.typography.bodySecondary,
          color: theme.colors.primary,
        },
        divider: {
          height: 1,
          backgroundColor: theme.colors.border,
        },
        pdfNote: {
          ...theme.typography.caption,
        },
      }),
    [theme],
  );

  return (
    <Card style={styles.card}>
      <View style={styles.summaryHeader}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.summaryHeaderText}>
          <Text style={styles.name}>{profile.displayName}</Text>
          {profile.condition ? (
            <Text style={styles.condition}>{profile.condition}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <SummaryRow label="Date of birth" value={profile.dateOfBirth} />
      <SummaryRow label="Primary doctor" value={profile.primaryDoctor} />
      <SummaryRow label="Emergency contact" value={profile.emergencyContact} />

      <Text style={styles.pdfNote}>
        This information appears on the header of your exported doctor
        reports.
      </Text>

      <Button label="Edit profile" variant="secondary" onPress={onEdit} />
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
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
          fontFamily: theme.fonts.semibold,
          flexShrink: 1,
          textAlign: 'right' as const,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value ?? 'Not set'}</Text>
    </View>
  );
}

/* -------------------------------- Form --------------------------------- */

interface ProfileFormProps {
  initial: UserProfile | null;
  onSaved: () => void;
  onCancel?: () => void;
}

function ProfileForm({ initial, onSaved, onCancel }: ProfileFormProps) {
  const theme = useTheme();
  const updateProfile = useProfileStore((state) => state.updateProfile);

  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [condition, setCondition] = useState(initial?.condition ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? '');
  const [primaryDoctor, setPrimaryDoctor] = useState(initial?.primaryDoctor ?? '');
  const [emergencyContact, setEmergencyContact] = useState(
    initial?.emergencyContact ?? '',
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        formScroll: {
          gap: theme.spacing.md,
        },
        card: {
          gap: theme.spacing.md,
        },
        formIntro: {
          ...theme.typography.bodySecondary,
        },
        formButtons: {
          flexDirection: 'row',
          gap: theme.spacing.md,
          marginTop: theme.spacing.sm,
        },
        formButton: {
          flex: 1,
        },
      }),
    [theme],
  );

  const canSave = displayName.trim() !== '';

  const handleSave = async () => {
    if (!canSave) return;
    await updateProfile({
      displayName: displayName.trim(),
      condition: condition.trim() || null,
      dateOfBirth: dateOfBirth.trim() || null,
      primaryDoctor: primaryDoctor.trim() || null,
      emergencyContact: emergencyContact.trim() || null,
    });
    onSaved();
  };

  return (
    <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        {initial === null ? (
          <Text style={styles.formIntro}>
            This helps your doctor reports feel personal — and takes about
            30 seconds.
          </Text>
        ) : null}

        <FormField
          label="Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          required
        />
        <FormField
          label="Condition"
          value={condition}
          onChangeText={setCondition}
          placeholder="e.g. Fibromyalgia, Migraine, Rheumatoid arthritis"
        />
        <FormField
          label="Date of birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="e.g. 03/14/1990"
        />
        <FormField
          label="Primary doctor"
          value={primaryDoctor}
          onChangeText={setPrimaryDoctor}
          placeholder="e.g. Dr. Aisha Khan"
        />
        <FormField
          label="Emergency contact"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          placeholder="e.g. Sam Rivera · (555) 555-1234"
        />

        <View style={styles.formButtons}>
          {onCancel ? (
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              style={styles.formButton}
            />
          ) : null}
          <Button
            label="Save"
            onPress={handleSave}
            disabled={!canSave}
            style={styles.formButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  required?: boolean;
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
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}
