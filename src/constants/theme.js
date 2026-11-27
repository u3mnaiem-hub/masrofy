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

// Softened Dark Mode (50% reduced intensity / low-glare eye-friendly surfaces & muted accents)
export const DARK_COLORS = {
  // Muted, calm sage-emerald & warm-slate accents (50% softer than neon)
  primary: '#6FB894',           // Soft Muted Sage-Mint
  primaryDark: '#4F8F71',
  primaryLight: '#1E2A26',      // Calm muted tinted surface
  primaryUltraLight: '#18211E',

  // Semantic financial colors (50% softer contrast)
  expense: '#C48175',           // Soft Muted Terracotta-Coral
  expenseLight: '#281F1E',
  expenseDark: '#A06257',

  income: '#6FB894',            // Soft Muted Sage-Mint
  incomeLight: '#1E2A26',
  incomeDark: '#4F8F71',

  warning: '#C4A36C',           // Soft Muted Sand-Amber
  warningLight: '#27231B',

  info: '#74AEB4',              // Soft Muted Slate-Teal
  infoLight: '#1B2729',

  // Softened Dark Charcoal-Slate Surfaces (gentle contrast, zero harsh black/neon)
  background: '#151A19',        // Calm Soft Charcoal Canvas
  surface: '#1D2422',           // Soft Elevated Card Surface
  surfaceSecondary: '#242D2A',  // Soft Inner Pill / Input Surface
  border: '#313D3A',            // Subtle Soft Border
  borderLight: '#283330',

  // Gentle Eye-Friendly Typography
  textPrimary: '#CFD9D6',       // Soft Warm Off-White (50% less harsh glare)
  textSecondary: '#8F9E9A',     // Calm Muted Sage-Gray
  textMuted: '#687673',
  textWhite: '#E2E9E7',

  // Harmonized Soft Accents
  purple: '#74AEB4',
  purpleLight: '#1C2729',
  pink: '#C48175',
  pinkLight: '#281F1E',
  teal: '#74AEB4',
  tealLight: '#1B2729',
  indigo: '#74AEB4',
  indigoLight: '#1C2729',
};

// 1980s Olive Monochrome Computer Screen Palette (Optional Dark Mode Style in Settings)
export const DARK_COLORS_OLIVE_80S = {
  primary: '#97A965',           // Classic 80s Soft Olive Phosphor
  primaryDark: '#6D7D43',
  primaryLight: '#212918',
  primaryUltraLight: '#181F11',

  expense: '#839455',           // Medium Olive
  expenseLight: '#1D2415',
  expenseDark: '#62713B',

  income: '#ABB97A',            // Soft Bright Olive
  incomeLight: '#212918',
  incomeDark: '#7C8D4E',

  warning: '#A0B16D',           // Pale Olive
  warningLight: '#222A19',

  info: '#8FA05E',              // Crisp Soft Olive
  infoLight: '#1E2516',

  // 1980s Olive Monochrome CRT Surfaces (gentle low-glare olive tones)
  background: '#11150D',        // Deep Soft Olive-Black CRT
  surface: '#181E12',           // Dark Olive Panel
  surfaceSecondary: '#212918',  // Elevated Olive Panel
  border: '#3D4B2B',            // Retro Olive Border
  borderLight: '#2C371F',

  // Gentle Phosphor Olive Typography
  textPrimary: '#BDCB8F',       // Soft Olive Phosphor Text
  textSecondary: '#87965B',     // Secondary Olive Text
  textMuted: '#606D3F',         // Dimmed Olive Text
  textWhite: '#D2DEA8',

  purple: '#92A460',
  purpleLight: '#1E2616',
  pink: '#839455',
  pinkLight: '#1D2415',
  teal: '#97A965',
  tealLight: '#202817',
  indigo: '#8FA05E',
  indigoLight: '#1E2616',
};

// Top Action Bar Color Presets (Default: Dark Navy Blue with Beige text)
export const TOOLBAR_COLOR_PRESETS = {
  navy: {
    id: 'navy',
    nameAr: 'أزرق غامق (افتراضي)',
    nameEn: 'Dark Navy Blue (Default)',
    bg: '#1E3A5F',
    border: '#2C4E7E',
    text: '#F5E6C8',
  },
  crimson: {
    id: 'crimson',
    nameAr: 'قرمزي غامق',
    nameEn: 'Deep Crimson',
    bg: '#7F1D1D',
    border: '#991B1B',
    text: '#F5E6C8',
  },
  teal: {
    id: 'teal',
    nameAr: 'أخضر بنكي',
    nameEn: 'Banking Teal',
    bg: '#115E59',
    border: '#0F766E',
    text: '#F5E6C8',
  },
  charcoal: {
    id: 'charcoal',
    nameAr: 'رمادي فحمي',
    nameEn: 'Charcoal Slate',
    bg: '#334155',
    border: '#475569',
    text: '#F5E6C8',
  },
  brown: {
    id: 'brown',
    nameAr: 'بني كلاسيكي',
    nameEn: 'Classic Brown',
    bg: '#5C3A21',
    border: '#7C4D2B',
    text: '#F5E6C8',
  },
  purple: {
    id: 'purple',
    nameAr: 'بنفسجي ملكي',
    nameEn: 'Royal Purple',
    bg: '#4C1D95',
    border: '#6D28D9',
    text: '#F5E6C8',
  },
  mutedSlate: {
    id: 'mutedSlate',
    nameAr: 'رمادي أزرق هادئ',
    nameEn: 'Muted Slate',
    bg: '#3B4F63',
    border: '#52687E',
    text: '#E8EDF2',
  },
  softOlive: {
    id: 'softOlive',
    nameAr: 'زيتوني هادئ',
    nameEn: 'Soft Olive',
    bg: '#4B5734',
    border: '#637246',
    text: '#EDF2DF',
  },
  calmSage: {
    id: 'calmSage',
    nameAr: 'أخضر ميرمية هادئ',
    nameEn: 'Calm Sage',
    bg: '#3B5C4E',
    border: '#507867',
    text: '#E6F0EB',
  },
  warmTaupe: {
    id: 'warmTaupe',
    nameAr: 'رملي دافئ هادئ',
    nameEn: 'Warm Taupe',
    bg: '#5E5044',
    border: '#786758',
    text: '#F2ECE6',
  },
};

export const NEON_GLOW = {
  subtle: {
    shadowColor: '#6FB894',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  soft: {
    shadowColor: '#6FB894',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 3,
  },
  cyan: {
    shadowColor: '#74AEB4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  coral: {
    shadowColor: '#C48175',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
};

export const COLOR_PALETTES = {
  emerald: {
    id: 'emerald',
    nameAr: 'بنكي زمردي فاخر',
    nameEn: 'Executive Banking Teal',
    primary: '#0F766E',
    primaryDark: '#115E59',
    primaryLight: '#E6F4F1',
    primaryUltraLight: '#F0FAF8',
    darkPrimary: '#6FB894',
    darkPrimaryDark: '#4F8F71',
    darkPrimaryLight: '#1E2A26',
  },
  sageMist: {
    id: 'sageMist',
    nameAr: 'أخضر ميرمية هادئ 🌿',
    nameEn: 'Calm Sage Mist 🌿',
    primary: '#4E7A66',
    primaryDark: '#3B5F4F',
    primaryLight: '#EBF2EE',
    primaryUltraLight: '#F5F8F6',
    darkPrimary: '#7BA893',
    darkPrimaryDark: '#5A8470',
    darkPrimaryLight: '#1E2924',
  },
  softOlive: {
    id: 'softOlive',
    nameAr: 'زيتوني دافئ هادئ 🫒',
    nameEn: 'Soft Warm Olive 🫒',
    primary: '#667346',
    primaryDark: '#4F5A35',
    primaryLight: '#EFF2E8',
    primaryUltraLight: '#F7F9F3',
    darkPrimary: '#97A965',
    darkPrimaryDark: '#6D7D43',
    darkPrimaryLight: '#212918',
  },
  slateBlue: {
    id: 'slateBlue',
    nameAr: 'أزرق رمادي هادئ 🌫️',
    nameEn: 'Muted Slate Blue 🌫️',
    primary: '#4A6580',
    primaryDark: '#384E64',
    primaryLight: '#EBF0F5',
    primaryUltraLight: '#F4F7FA',
    darkPrimary: '#7FA0BE',
    darkPrimaryDark: '#5C7B96',
    darkPrimaryLight: '#1D262F',
  },
  warmTaupe: {
    id: 'warmTaupe',
    nameAr: 'رملي كشمير هادئ 🏜️',
    nameEn: 'Warm Sand Taupe 🏜️',
    primary: '#7C6A58',
    primaryDark: '#5F5041',
    primaryLight: '#F3EFEA',
    primaryUltraLight: '#F9F7F4',
    darkPrimary: '#AD9B89',
    darkPrimaryDark: '#877666',
    darkPrimaryLight: '#28231E',
  },
  dustyRose: {
    id: 'dustyRose',
    nameAr: 'وردي ترابي ناعم 🌸',
    nameEn: 'Soft Dusty Mauve 🌸',
    primary: '#8A5A6A',
    primaryDark: '#6D4553',
    primaryLight: '#F5ECEF',
    primaryUltraLight: '#FAF5F7',
    darkPrimary: '#B88B99',
    darkPrimaryDark: '#8F6573',
    darkPrimaryLight: '#2A2024',
  },
  softGraphite: {
    id: 'softGraphite',
    nameAr: 'جرافيت رمادي هادئ 🪨',
    nameEn: 'Calm Graphite 🪨',
    primary: '#4B5563',
    primaryDark: '#374151',
    primaryLight: '#EEF0F2',
    primaryUltraLight: '#F6F7F8',
    darkPrimary: '#8E99A8',
    darkPrimaryDark: '#687382',
    darkPrimaryLight: '#21252B',
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

export const getThemeColors = (isDarkMode, paletteId = 'emerald', darkModeStyle = 'soft') => {
  if (isDarkMode) {
    return darkModeStyle === 'olive80s'
      ? { ...DARK_COLORS_OLIVE_80S }
      : { ...DARK_COLORS };
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
