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
  // Brand colors (softened for comfortable dark-gray mode)
  primary: '#34D399',
  primaryDark: '#10B981',
  primaryLight: '#1E3A32',
  primaryUltraLight: '#1B2E29',

  // Semantic
  expense: '#F87171',
  expenseLight: '#3B2326',
  expenseDark: '#EF4444',

  income: '#4ADE80',
  incomeLight: '#1E3A32',
  incomeDark: '#22C55E',

  warning: '#FBBF24',
  warningLight: '#3A301F',

  info: '#60A5FA',
  infoLight: '#233044',

  // Neutrals & Surfaces - Soft Neutral Gray (not harsh black)
  background: '#222428',
  surface: '#2C2F35',
  surfaceSecondary: '#363A42',
  border: '#454A54',
  borderLight: '#33373F',

  // Typography
  textPrimary: '#E5E7EB',
  textSecondary: '#B4BAC4',
  textMuted: '#8B929E',
  textWhite: '#F3F4F6',

  // Accents (muted so boxes aren't glaring)
  purple: '#A78BFA',
  purpleLight: '#2E2842',
  pink: '#F472B6',
  pinkLight: '#3D2535',
  teal: '#2DD4BF',
  tealLight: '#1F3738',
  indigo: '#818CF8',
  indigoLight: '#272B42',
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
