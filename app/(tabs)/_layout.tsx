import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  focused: boolean;
  active: IoniconName;
  inactive: IoniconName;
}

/** Figma treatment: the active tab icon sits in an outlined soft pill. */
function TabIcon({ focused, active, inactive }: TabIconProps) {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        iconWrap: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: theme.radius.sm,
          borderWidth: 1.5,
          borderColor: 'transparent',
        },
        iconWrapFocused: {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.primary,
        },
      }),
    [theme],
  );

  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons
        name={focused ? active : inactive}
        size={22}
        color={focused ? theme.colors.primary : theme.colors.inkMuted}
      />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabBar: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabLabel: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: 2,
        },
      }),
    [theme],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.inkMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="home" inactive="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="clipboard" inactive="clipboard-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="calendar" inactive="calendar-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} active="person" inactive="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
