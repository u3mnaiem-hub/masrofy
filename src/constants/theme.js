export const COLORS = {
  // Brand colors
  primary: '#10B981',         // Emerald Green
  primaryDark: '#059669',
  primaryLight: '#D1FAE5',
  primaryUltraLight: '#ECFDF5',

  // Semantic
  expense: '#EF4444',        // Bright Red
  expenseLight: '#FEE2E2',
  expenseDark: '#B91C1C',

  income: '#10B981',         // Green
  incomeLight: '#D1FAE5',
  incomeDark: '#047857',

  warning: '#F59E0B',        // Amber
  warningLight: '#FEF3C7',

  info: '#3B82F6',           // Blue
  infoLight: '#DBEAFE',

  // Neutrals & Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',

  // Accents
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  teal: '#14B8A6',
  tealLight: '#CCFBF1',
  indigo: '#6366F1',
  indigoLight: '#E0E7FF',
};

export const LIGHT_COLORS = { ...COLORS };

export const DARK_COLORS = {
  // Brand colors
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#064E3B',
  primaryUltraLight: '#022C22',

  // Semantic
  expense: '#F87171',
  expenseLight: '#450A0A',
  expenseDark: '#DC2626',

  income: '#34D399',
  incomeLight: '#064E3B',
  incomeDark: '#059669',

  warning: '#FBBF24',
  warningLight: '#451A03',

  info: '#60A5FA',
  infoLight: '#1E3A8A',

  // Neutrals & Surfaces - PURE PITCH BLACK (OLED True Black)
  background: '#000000',
  surface: '#121212',
  surfaceSecondary: '#1E1E1E',
  border: '#27272A',
  borderLight: '#18181B',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textWhite: '#FFFFFF',

  // Accents
  purple: '#A78BFA',
  purpleLight: '#2E1065',
  pink: '#F472B6',
  pinkLight: '#500724',
  teal: '#2DD4BF',
  tealLight: '#134E4A',
  indigo: '#818CF8',
  indigoLight: '#1E1B4B',
};

export const getThemeColors = (isDarkMode) => (isDarkMode ? DARK_COLORS : COLORS);

export const SHADOWS = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
