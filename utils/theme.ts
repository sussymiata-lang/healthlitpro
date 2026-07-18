/**
 * HealthLit design tokens.
 *
 * Single source of truth for color, spacing, radius, typography, and
 * elevation. Supports light and dark palettes — every screen and
 * component gets its theme via the useTheme() hook (hooks/useTheme.ts),
 * never by importing a static object, so switching modes actually
 * updates the UI. See hooks/useTheme.ts for why.
 *
 * Palette is derived from the HealthLit Figma designs: a calm, soft
 * lavender base with pink accents. High contrast is reserved for text
 * and interactive elements so the interface stays readable under pain
 * and fatigue conditions — in both light and dark mode.
 */

export type ColorScheme = 'light' | 'dark';

export interface Colors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  accentPink: string;
  accentPinkSoft: string;
  ink: string;
  inkSecondary: string;
  inkMuted: string;
  onPrimary: string;
  info: string;
  infoSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
}

const lightColors: Colors = {
  // Base surfaces
  background: '#F7F4FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F0FB',
  border: '#ECE6F6',

  // Brand
  primary: '#7C6BD6',
  primaryPressed: '#6A59C4',
  primarySoft: '#EDE8FB',
  accentPink: '#F09CBB',
  accentPinkSoft: '#FCE9F1',

  // Text
  ink: '#241F3A',
  inkSecondary: '#6E6887',
  inkMuted: '#9C96B4',
  onPrimary: '#FFFFFF',

  // Semantic
  info: '#5B9BD8',
  infoSoft: '#E7F1FB',
  success: '#3FAF8C',
  successSoft: '#E2F5EE',
  warning: '#DE9A36',
  warningSoft: '#FBF0DC',
  danger: '#D65C77',
  dangerSoft: '#FAE6EC',
};

const darkColors: Colors = {
  // Base surfaces
  background: '#18141F',
  surface: '#231D2E',
  surfaceMuted: '#2B2438',
  border: '#3A3348',

  // Brand — brightened slightly so it still pops against a dark surface
  primary: '#9683E8',
  primaryPressed: '#A996EE',
  primarySoft: '#332C4A',
  accentPink: '#F4AFC7',
  accentPinkSoft: '#452C39',

  // Text
  ink: '#F1EEF9',
  inkSecondary: '#B7B0CF',
  inkMuted: '#8A82A6',
  onPrimary: '#1A1626',

  // Semantic — dark-tinted "soft" backgrounds instead of light pastels
  info: '#7FB0E0',
  infoSoft: '#20303F',
  success: '#5FC9A0',
  successSoft: '#1E362E',
  warning: '#E8B25F',
  warningSoft: '#3A2E1C',
  danger: '#E38A9E',
  dangerSoft: '#3A242C',
};

/**
 * Fixed, mode-independent brand/semantic accent colors used to color-
 * code symptom types (Pain, Fatigue, etc. — see utils/symptoms.ts).
 * Deliberately NOT swapped for dark mode: these act like small colored
 * tags/badges, and keeping "Pain is always this shade of red" constant
 * across modes aids fast visual recognition — the same reasoning
 * behind this app's "usable in under 3 seconds" principle. This is a
 * common, intentional dark-mode pattern (see e.g. GitHub's labels,
 * which stay colorful rather than darkening in dark mode).
 */
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Inter — loaded in app/_layout.tsx via @expo-google-fonts/inter.
 * Each weight is its own font family name in React Native.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Typography embeds color, so it must be rebuilt per color scheme. */
function buildTypography(colors: Colors) {
  return {
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    heading: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: fonts.bold,
      color: colors.ink,
    },
    body: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fonts.regular,
      color: colors.ink,
    },
    bodySecondary: {
      fontSize: 15,
      lineHeight: 21,
      fontFamily: fonts.regular,
      color: colors.inkSecondary,
    },
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fonts.medium,
      color: colors.inkMuted,
    },
    button: {
      fontSize: 16,
      lineHeight: 20,
      fontFamily: fonts.semibold,
    },
  } as const;
}

/**
 * Accessibility: minimum interactive element height.
 * Users in pain or with reduced motor precision need generous targets.
 */
export const touchTarget = {
  minHeight: 52,
} as const;

/** Shadows read the same in both modes — dark surfaces still lift on shadow. */
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export interface Theme {
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  typography: ReturnType<typeof buildTypography>;
  touchTarget: typeof touchTarget;
  shadows: typeof shadows;
  scheme: ColorScheme;
}

/** Builds a complete theme object for the given color scheme. */
export function getTheme(scheme: ColorScheme): Theme {
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return {
    colors,
    spacing,
    radius,
    fonts,
    typography: buildTypography(colors),
    touchTarget,
    shadows,
    scheme,
  };
}

/**
 * Static light theme — kept only as a safe fallback for any code path
 * that runs outside a component (where hooks aren't available). Every
 * screen and component should use useTheme() instead of this.
 */
export const theme: Theme = getTheme('light');
