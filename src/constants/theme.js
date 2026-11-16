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

export const COLOR_PALETTES = {
  emerald: {
    id: 'emerald',
    nameAr: 'الأخضر الزمردي',
    nameEn: 'Emerald',
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#D1FAE5',
    primaryUltraLight: '#ECFDF5',
    darkPrimary: '#34D399',
    darkPrimaryDark: '#10B981',
    darkPrimaryLight: '#1E3A32',
  },
  royalBlue: {
    id: 'royalBlue',
    nameAr: 'الأزرق الملكي',
    nameEn: 'Royal Blue',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#DBEAFE',
    primaryUltraLight: '#EFF6FF',
    darkPrimary: '#60A5FA',
    darkPrimaryDark: '#3B82F6',
    darkPrimaryLight: '#1E293B',
  },
  gold: {
    id: 'gold',
    nameAr: 'الذهبي الفاخر',
    nameEn: 'Royal Gold',
    primary: '#D97706',
    primaryDark: '#B45309',
    primaryLight: '#FEF3C7',
    primaryUltraLight: '#FFFBEB',
    darkPrimary: '#FBBF24',
    darkPrimaryDark: '#D97706',
    darkPrimaryLight: '#3A301F',
  },
  purple: {
    id: 'purple',
    nameAr: 'البنفسجي الملكي',
    nameEn: 'Royal Purple',
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#EDE9FE',
    primaryUltraLight: '#F5F3FF',
    darkPrimary: '#A78BFA',
    darkPrimaryDark: '#8B5CF6',
    darkPrimaryLight: '#2E2842',
  },
};

export const getThemeColors = (isDarkMode, paletteId = 'emerald') => {
  const pal = COLOR_PALETTES[paletteId] || COLOR_PALETTES.emerald;
  if (isDarkMode) {
    return {
      ...DARK_COLORS,
      primary: pal.darkPrimary,
      primaryDark: pal.darkPrimaryDark,
      primaryLight: pal.darkPrimaryLight,
    };
  }
  return {
    ...COLORS,
    primary: pal.primary,
    primaryDark: pal.primaryDark,
    primaryLight: pal.primaryLight,
    primaryUltraLight: pal.primaryUltraLight,
  };
};

export const SHADOWS = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
};
