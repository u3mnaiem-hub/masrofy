export const EXPENSE_CATEGORIES = [
  {
    id: 'food',
    name: 'Food & Groceries',
    nameAr: 'طعام وبقالة',
    icon: 'silverware-fork-knife',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    type: 'expense',
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    nameAr: 'فواتير ومرافق',
    icon: 'home-lightning-bolt-outline',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    type: 'expense',
  },
  {
    id: 'trns',
    name: 'Transport',
    nameAr: 'مواصلات وانتقالات',
    icon: 'car-side',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    type: 'expense',
  },
  {
    id: 'mdsn',
    name: 'Medical & Pharmacy',
    nameAr: 'أدوية وعلاج',
    icon: 'medical-bag',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    type: 'expense',
  },
  {
    id: 'boz',
    name: 'Personal Expenses',
    nameAr: 'مصاريف شخصية',
    icon: 'coffee',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    type: 'expense',
  },
  {
    id: 'nvn',
    name: 'NVN',
    nameAr: 'NVN',
    icon: 'tag-outline',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    type: 'expense',
  },
  {
    id: 'mntnns',
    name: 'Maintenance & Repairs',
    nameAr: 'صيانة وإصلاحات',
    icon: 'wrench-outline',
    color: '#06B6D4',
    bgColor: '#CFFAFE',
    type: 'expense',
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    nameAr: 'متفرقات ونثريات',
    icon: 'dots-horizontal-circle-outline',
    color: '#64748B',
    bgColor: '#F1F5F9',
    type: 'expense',
  },
  {
    id: 'switch',
    name: 'Internal Transfer (Switch)',
    nameAr: 'تحويل داخلي (سحب كاش من الفيزا)',
    icon: 'swap-horizontal',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    type: 'expense',
  },
  {
    id: 'cc_pyd',
    name: 'Credit Card Payment',
    nameAr: 'سداد بطاقة ائتمان',
    icon: 'credit-card-check-outline',
    color: '#10B981',
    bgColor: '#D1FAE5',
    type: 'expense',
  },
];

export const INCOME_CATEGORIES = [
  {
    id: 'incomings',
    name: 'Incoming Funds',
    nameAr: 'إيداعات وواردات',
    icon: 'cash-multiple',
    color: '#10B981',
    bgColor: '#D1FAE5',
    type: 'income',
  },
  {
    id: 'salary',
    name: 'Monthly Salary',
    nameAr: 'الراتب الشهري',
    icon: 'wallet-outline',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    type: 'income',
  },
  {
    id: 'freelance',
    name: 'Freelance & Extra',
    nameAr: 'عمل حر وإضافي',
    icon: 'laptop',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    type: 'income',
  },
  {
    id: 'bonus',
    name: 'Bonus & Gifts',
    nameAr: 'مكافآت وهدايا',
    icon: 'gift-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    type: 'income',
  },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryById = (id, lang = 'en') => {
  const found = ALL_CATEGORIES.find((cat) => cat.id === id) || {
    id: 'unknown',
    name: 'Other',
    nameAr: 'أخرى',
    icon: 'circle-outline',
    color: '#94A3B8',
    bgColor: '#F1F5F9',
    type: 'expense',
  };
  return {
    ...found,
    displayName: lang === 'ar' ? (found.nameAr || found.name) : found.name,
  };
};

export const PAYMENT_METHODS = [
  {
    id: 'csh',
    name: 'Available Cash 💵',
    nameAr: 'كاش متاح (Available Cash) 💵',
    icon: 'cash',
    shortName: 'Cash',
    shortNameAr: 'كاش متاح',
  },
  {
    id: 'dc',
    name: 'DC / Bank Account 💳',
    nameAr: 'DC / حساب بنكي 💳',
    icon: 'credit-card',
    shortName: 'DC',
    shortNameAr: 'حساب بنكي',
  },
  {
    id: 'cc_ca',
    name: 'Crédit Agricole (CC CA) 🏦',
    nameAr: 'كريدي أجريكول (CC CA) 🏦',
    icon: 'credit-card-outline',
    shortName: 'CC CA',
    shortNameAr: 'كريدي أجريكول',
  },
  {
    id: 'cc_ar',
    name: 'Arab Bank (CC AR) 🏛️',
    nameAr: 'البنك العربي (CC AR) 🏛️',
    icon: 'credit-card-clock',
    shortName: 'CC AR',
    shortNameAr: 'البنك العربي',
  },
];

export const getPaymentMethodById = (id, lang = 'en') => {
  const pm = PAYMENT_METHODS.find((p) => p.id === id) || PAYMENT_METHODS[0];
  return {
    ...pm,
    displayName: lang === 'ar' ? pm.nameAr : pm.name,
    displayShort: lang === 'ar' ? pm.shortNameAr : pm.shortName,
  };
};
