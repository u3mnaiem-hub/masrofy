// تعديل الوان 999 — Executive Banking Light Mode Palette (Light Mode ONLY)
export const COLORS = {
  // Brand colors — Refined Private Banking Teal-Emerald
  primary: '#0F766E',         // Deep Banking Teal
  primaryDark: '#115E59',     // Executive Deep Pine-Teal
  primaryLight: '#E6F4F1',    // Soft Whisper Teal
  primaryUltraLight: '#F0FAF8',

  // Semantic financial colors
  expense: '#C81E1E',         // Refined Banking Crimson
  expenseLight: '#FDF2F2',
  expenseDark: '#9B1C1C',

  income: '#047857',          // Classic Banking Forest Green
  incomeLight: '#E6F4F1',
  incomeDark: '#065F46',

  warning: '#B45309',         // Muted Banking Amber
  warningLight: '#FEF9EC',

  info: '#1E3A5F',            // Executive Banking Navy
  infoLight: '#EEF2F6',

  // Neutrals & Surfaces — Calm Banking Mist + Crisp White Cards
  background: '#F2F6F4',
  surface: '#FFFFFF',
  surfaceSecondary: '#EDF2F0',
  border: '#DCE5E1',
  borderLight: '#EBF0EE',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#8392A5',
  textWhite: '#FFFFFF',

  // Accents
  purple: '#5B4B8A',
  purpleLight: '#F3F1FA',
  pink: '#BE185D',
  pinkLight: '#FDF2F8',
  teal: '#0F766E',
  tealLight: '#E6F4F1',
  indigo: '#1E3A5F',
  indigoLight: '#EEF2F6',
};

export const LIGHT_COLORS = { ...COLORS };

export const DARK_COLORS = {
  // Brand colors — Inspired by the attached Sary Dashboard (Obsidian-Emerald Glass + Mint Green + Cyan-Teal + Coral)
  primary: '#3CE88E',           // Luminous Mint-Emerald Green (Net Profit / Available)
  primaryDark: '#22C574',
  primaryLight: '#10241C',      // Subtle emerald-tinted dark glass
  primaryUltraLight: '#0C1B15',

  // Semantic financial colors matching the 3 KPI cards in the reference image
  expense: '#F27158',           // Warm Coral-Red (Expenses / Card Debts)
  expenseLight: '#241412',      // Subtle coral-tinted dark glass
  expenseDark: '#D9533D',

  income: '#3CE88E',            // Luminous Mint-Emerald Green
  incomeLight: '#10241C',
  incomeDark: '#22C574',

  warning: '#F2A950',           // Soft warm amber
  warningLight: '#231C12',

  info: '#4FD1D9',              // Luminous Cyan-Teal (Revenue / Starting Base / Bank)
  infoLight: '#0E2124',         // Subtle cyan-teal dark glass

  // Deep Obsidian-Emerald Surfaces (from the reference image)
  background: '#0B1211',        // Deep obsidian canvas with subtle emerald depth
  surface: '#131D1B',           // Dark glass card surface
  surfaceSecondary: '#192623',  // Elevated inner pill / input / secondary surface
  border: '#243632',            // Thin dark emerald-charcoal border
  borderLight: '#1B2A27',

  // High-contrast Typography
  textPrimary: '#F3F7F6',       // Crisp soft white
  textSecondary: '#9BB0AC',     // Cool soft gray-mint
  textMuted: '#647A76',
  textWhite: '#FFFFFF',

  // Harmonized accents matching the reference charts (Emerald + Cyan-Teal)
  purple: '#4FD1D9',
  purpleLight: '#112326',
  pink: '#F27158',
  pinkLight: '#241412',
  teal: '#4FD1D9',
  tealLight: '#0E2124',
  indigo: '#4FD1D9',
  indigoLight: '#112326',
};

export const NEON_GLOW = {
  subtle: {
    shadowColor: '#3CE88E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: '#3CE88E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 7,
    elevation: 4,
  },
  cyan: {
    shadowColor: '#4FD1D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  coral: {
    shadowColor: '#F27158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const COLOR_PALETTES = {
  emerald: {
    id: 'emerald',
    nameAr: 'بنكي زمردي فاخر (999)',
    nameEn: 'Executive Banking Teal (999)',
    primary: '#0F766E',
    primaryDark: '#115E59',
    primaryLight: '#E6F4F1',
    primaryUltraLight: '#F0FAF8',
    darkPrimary: '#3CE88E',
    darkPrimaryDark: '#22C574',
    darkPrimaryLight: '#10241C',
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
  if (isDarkMode) {
    // Dark Mode ALWAYS uses the unified Pure Black & Neon Green futuristic identity
    return { ...DARK_COLORS };
  }
  const pal = COLOR_PALETTES[paletteId] || COLOR_PALETTES.emerald;
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
