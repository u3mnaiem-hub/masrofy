import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CURRENCY } from '../constants/currencies';
import { getCategoryById, PAYMENT_METHODS, EXPENSE_CATEGORIES } from '../constants/categories';
import { getThemeColors } from '../constants/theme';
import {
  syncMonthlyCreditCardNotifications,
  sendTestCreditCardNotification,
  sendBudgetExceededNotification,
} from '../utils/notificationHelper';

const ExpenseContext = createContext();

// Updated storage key to force phone to drop any stale cache
const STORAGE_KEYS = {
  TRANSACTIONS: '@u3mxpns_v10_transactions',
  START_BALANCES: '@u3mxpns_v10_start_balances',
  CYCLE_START: '@u3mxpns_v10_cycle_start',
  CYCLE_END: '@u3mxpns_v10_cycle_end',
  CARRY_OVERS: '@u3mxpns_v10_carry_overs',
  ALERT_PREFS: '@u3mxpns_v10_alert_prefs',
  LANGUAGE: '@u3mxpns_v10_language',
  CUSTOM_ACCOUNTS: '@u3mxpns_v10_custom_accounts',
  ARCHIVED_MONTHS: '@u3mxpns_v10_archived_months',
  CATEGORY_BUDGETS: '@u3mxpns_v10_category_budgets',
  CUSTOM_CATEGORIES: '@u3mxpns_v10_custom_categories',
  DELETED_CATEGORIES: '@u3mxpns_v10_deleted_categories',
  DARK_MODE: '@u3mxpns_v10_dark_mode',
};

// Initial starting funds matching Excel Sheet1 row 4 exactly
export const INITIAL_START_BALANCES = {
  dc: 16930,  // Started with in DC / Bank Account (16,930)
  csh: 14500, // Started with in Cash (14,500)
};

export const INITIAL_CYCLE_START = '2026-10-22'; // 22 October 2026
export const INITIAL_CYCLE_END = '2026-11-22';   // 22 November 2026

// From Excel row 9: carryover unpaid balance from previous month for Arab Bank = 2209 (due 25/11)
export const INITIAL_CARRY_OVERS = {
  cc_ar: 2209,
  cc_ca: 0,
};

export const INITIAL_ALERT_PREFS = {
  startupAlertEnabled: true,
  phoneNotificationsEnabled: true,
  budgetAlertsEnabled: true,
};

// Rule: Any Credit Card purchase (CC AR, CC CA, or any custom credit card) is due on the 25th of the FOLLOWING calendar month.
export const getCreditCardDueDate = (txDateStr) => {
  try {
    const parts = (txDateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
    let year = parts[0] || 2026;
    let month = (parts[1] || 1) + 1; // Following calendar month (1..12)
    if (month > 12) {
      month = 1;
      year += 1;
    }
    return `${year}-${String(month).padStart(2, '0')}-25`;
  } catch {
    return '2026-12-25';
  }
};

export const getGracePeriodStats = (txDateStr, dueDateStr) => {
  try {
    const dueStr = dueDateStr || getCreditCardDueDate(txDateStr);
    const [tY, tM, tD] = (txDateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const [dY, dM, dD] = dueStr.split('-').map(Number);
    const txDate = new Date(tY, (tM || 1) - 1, tD || 1);
    const dueDate = new Date(dY, (dM || 1) - 1, dD || 25);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalGraceDays = Math.max(0, Math.round((dueDate - txDate) / (1000 * 60 * 60 * 24)));
    const remainingGraceDays = Math.max(0, Math.round((dueDate - today) / (1000 * 60 * 60 * 24)));

    return {
      dueDate: dueStr,
      totalGraceDays,
      remainingGraceDays,
    };
  } catch {
    return { dueDate: dueDateStr || '', totalGraceDays: 0, remainingGraceDays: 0 };
  }
};

// Transactions loaded directly from initial dataset
export const EXCEL_TRANSACTIONS = [
  { id: 'tx_init_1', type: 'expense', amount: 210, categoryId: 'trns', note: 'Transport', date: '2026-10-22', paymentMethod: 'csh' },
  { id: 'tx_init_2', type: 'expense', amount: 264, categoryId: 'mdsn', note: 'Medical & Pharmacy', date: '2026-10-22', paymentMethod: 'cc_ar', dueDate: '2026-11-25' },
  { id: 'tx_init_3', type: 'expense', amount: 401, categoryId: 'food', note: 'Food & Groceries', date: '2026-10-22', paymentMethod: 'cc_ar', dueDate: '2026-11-25' },
  { id: 'tx_init_4', type: 'expense', amount: 630, categoryId: 'boz', note: 'Personal Expenses', date: '2026-10-22', paymentMethod: 'csh' },
  { id: 'tx_init_5', type: 'expense', amount: 40, categoryId: 'mntnns', note: 'Maintenance', date: '2026-10-22', paymentMethod: 'csh' },
  { id: 'tx_init_6', type: 'expense', amount: 50, categoryId: 'bills', note: 'Water Bill', date: '2026-10-23', paymentMethod: 'csh' },
  { id: 'tx_init_7', type: 'switch', amount: 2000, categoryId: 'switch', note: 'Cash Withdrawal from DC / Bank Account', date: '2026-10-24', paymentMethod: 'dc', toAccount: 'csh' },
  { id: 'tx_init_8', type: 'expense', amount: 250, categoryId: 'trns', note: 'Transport', date: '2026-10-25', paymentMethod: 'csh' },
  { id: 'tx_init_9', type: 'expense', amount: 520, categoryId: 'boz', note: 'Personal Expenses', date: '2026-10-25', paymentMethod: 'csh' },
  { id: 'tx_init_10', type: 'income', amount: 150, categoryId: 'incomings', note: 'Incoming Deposit', date: '2026-10-27', paymentMethod: 'dc' },
  { id: 'tx_init_11', type: 'expense', amount: 108, categoryId: 'bills', note: 'Vodafone Bill', date: '2026-10-28', paymentMethod: 'dc' },
  { id: 'tx_init_12', type: 'cc_pyd', amount: 1173, categoryId: 'cc_pyd', note: 'Arab Bank CC Payment from DC', date: '2026-10-29', paymentMethod: 'dc', targetCard: 'cc_ar' },
  { id: 'tx_init_13', type: 'expense', amount: 550, categoryId: 'mdsn', note: 'Medical & Pharmacy', date: '2026-10-30', paymentMethod: 'dc' },
  { id: 'tx_init_14', type: 'expense', amount: 52, categoryId: 'misc', note: 'CapCut Subscription', date: '2026-10-31', paymentMethod: 'cc_ar', dueDate: '2026-11-25' },
  { id: 'tx_init_15', type: 'expense', amount: 210, categoryId: 'trns', note: 'Transport', date: '2026-11-01', paymentMethod: 'csh' },
  { id: 'tx_init_16', type: 'expense', amount: 480, categoryId: 'boz', note: 'Personal Expenses', date: '2026-11-01', paymentMethod: 'csh' },
  { id: 'tx_init_17', type: 'expense', amount: 200, categoryId: 'trns', note: 'Transport', date: '2026-11-02', paymentMethod: 'csh' },
  { id: 'tx_init_18', type: 'expense', amount: 175, categoryId: 'food', note: 'Food', date: '2026-11-02', paymentMethod: 'csh' },
  { id: 'tx_init_19', type: 'expense', amount: 35, categoryId: 'bills', note: 'Water Bill', date: '2026-11-03', paymentMethod: 'dc' },
  { id: 'tx_init_20', type: 'expense', amount: 80, categoryId: 'trns', note: 'Transport', date: '2026-11-03', paymentMethod: 'csh' },
  { id: 'tx_init_21', type: 'expense', amount: 450, categoryId: 'misc', note: 'Miscellaneous', date: '2026-11-03', paymentMethod: 'csh' },
  { id: 'tx_init_22', type: 'expense', amount: 520, categoryId: 'boz', note: 'Personal Expenses', date: '2026-11-03', paymentMethod: 'cc_ca', dueDate: '2026-12-25' },
  { id: 'tx_init_23', type: 'expense', amount: 455, categoryId: 'food', note: 'Food & Groceries', date: '2026-11-03', paymentMethod: 'cc_ca', dueDate: '2026-12-25' },
  { id: 'tx_init_24', type: 'expense', amount: 108, categoryId: 'bills', note: 'Vodafone Bill', date: '2026-11-04', paymentMethod: 'dc' },
  { id: 'tx_init_25', type: 'expense', amount: 160, categoryId: 'trns', note: 'Transport', date: '2026-11-05', paymentMethod: 'csh' },
  { id: 'tx_init_26', type: 'expense', amount: 75, categoryId: 'mntnns', note: 'Maintenance', date: '2026-11-05', paymentMethod: 'dc' },
  { id: 'tx_init_27', type: 'expense', amount: 480, categoryId: 'boz', note: 'Personal Expenses', date: '2026-11-05', paymentMethod: 'csh' },
  { id: 'tx_init_28', type: 'expense', amount: 402, categoryId: 'bills', note: 'Home Internet Bill', date: '2026-11-05', paymentMethod: 'dc' },
  { id: 'tx_init_29', type: 'expense', amount: 145, categoryId: 'bills', note: 'Landline Bill', date: '2026-11-05', paymentMethod: 'dc' },
];

// Helper to sort transactions strictly from newest to oldest (top to bottom)
export const sortTransactionsNewestFirst = (list) => {
  return [...(list || [])].sort((a, b) => {
    const dateCmp = (b.date || '').localeCompare(a.date || '');
    if (dateCmp !== 0) return dateCmp;

    const aCreated = a.createdAt || 0;
    const bCreated = b.createdAt || 0;
    if (bCreated !== aCreated) return bCreated - aCreated;

    const getInitIdx = (id) => {
      if (typeof id === 'string' && id.startsWith('tx_init_')) {
        return parseInt(id.replace('tx_init_', ''), 10) || 0;
      }
      return 0;
    };
    return getInitIdx(b.id) - getInitIdx(a.id);
  });
};

export const ExpenseProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [startBalances, setStartBalances] = useState(INITIAL_START_BALANCES);
  const [cycleStartDate, setCycleStartDate] = useState(INITIAL_CYCLE_START);
  const [cycleEndDate, setCycleEndDate] = useState(INITIAL_CYCLE_END);
  const [carryOvers, setCarryOvers] = useState(INITIAL_CARRY_OVERS);
  const [alertPrefs, setAlertPrefs] = useState(INITIAL_ALERT_PREFS);
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [language, setLanguageState] = useState('en');
  const [customAccounts, setCustomAccounts] = useState([]);
  const [archivedMonths, setArchivedMonths] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState({}); // { [categoryId]: monthlyLimit }
  const [customCategories, setCustomCategories] = useState([]);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load state on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedTx = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedBalances = await AsyncStorage.getItem(STORAGE_KEYS.START_BALANCES);
        const storedCycle = await AsyncStorage.getItem(STORAGE_KEYS.CYCLE_START);
        const storedCycleEnd = await AsyncStorage.getItem(STORAGE_KEYS.CYCLE_END);
        const storedCarryOvers = await AsyncStorage.getItem(STORAGE_KEYS.CARRY_OVERS);
        const storedAlertPrefs = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_PREFS);
        const storedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
        const storedCustomAcc = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_ACCOUNTS);
        const storedArchives = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVED_MONTHS);
        const storedBudgets = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
        const storedCustomCats = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
        const storedDeletedCats = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_CATEGORIES);
        const storedDarkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);

        if (storedDarkMode !== null) {
          setIsDarkMode(JSON.parse(storedDarkMode));
        }

        if (storedCustomCats !== null) {
          setCustomCategories(JSON.parse(storedCustomCats) || []);
        }

        if (storedDeletedCats !== null) {
          setDeletedCategoryIds(JSON.parse(storedDeletedCats) || []);
        }

        if (storedBudgets !== null) {
          setCategoryBudgets(JSON.parse(storedBudgets) || {});
        }

        if (storedLang === 'ar' || storedLang === 'en') {
          setLanguageState(storedLang);
        }

        if (storedCustomAcc !== null) {
          setCustomAccounts(JSON.parse(storedCustomAcc));
        }

        if (storedArchives !== null) {
          setArchivedMonths(JSON.parse(storedArchives));
        }

        if (storedCarryOvers !== null) {
          setCarryOvers(JSON.parse(storedCarryOvers));
        } else {
          await AsyncStorage.setItem(STORAGE_KEYS.CARRY_OVERS, JSON.stringify(INITIAL_CARRY_OVERS));
        }

        if (storedAlertPrefs !== null) {
          setAlertPrefs({ ...INITIAL_ALERT_PREFS, ...JSON.parse(storedAlertPrefs) });
        } else {
          await AsyncStorage.setItem(STORAGE_KEYS.ALERT_PREFS, JSON.stringify(INITIAL_ALERT_PREFS));
        }

        if (storedTx !== null) {
          const parsed = JSON.parse(storedTx);
          setTransactions(sortTransactionsNewestFirst(Array.isArray(parsed) ? parsed : []));
        } else {
          const sortedInit = sortTransactionsNewestFirst(EXCEL_TRANSACTIONS);
          setTransactions(sortedInit);
          await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sortedInit));
        }

        if (storedBalances !== null) {
          setStartBalances(JSON.parse(storedBalances));
        } else {
          await AsyncStorage.setItem(STORAGE_KEYS.START_BALANCES, JSON.stringify(INITIAL_START_BALANCES));
        }

        if (storedCycle !== null) {
          setCycleStartDate(storedCycle);
        }

        if (storedCycleEnd !== null) {
          setCycleEndDate(storedCycleEnd);
        } else {
          await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_END, INITIAL_CYCLE_END);
        }
      } catch (e) {
        console.error('Error loading stored data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  // Always expose transactions sorted newest to oldest (newest at the very top)
  // Ensure consistency: if a transaction was marked isPaid, but its payment transaction no longer exists, revert isPaid to false!
  const sortedTransactions = useMemo(() => {
    const paymentIds = new Set();
    const settledTargetIds = new Set();
    transactions.forEach((t) => {
      if (t.type === 'cc_pyd' || t.categoryId === 'cc_pyd') {
        paymentIds.add(t.id);
        if (t.settledTxId) settledTargetIds.add(t.settledTxId);
      }
    });

    const consistentList = transactions.map((t) => {
      if (t.isPaid) {
        const hasValidPayment =
          (t.settledWithTxId && paymentIds.has(t.settledWithTxId)) ||
          settledTargetIds.has(t.id);
        if (!hasValidPayment) {
          return {
            ...t,
            isPaid: false,
            paidAt: null,
            paidFromAccount: null,
            settledWithTxId: null,
          };
        }
      }
      return t;
    });

    return sortTransactionsNewestFirst(consistentList);
  }, [transactions]);

  // Combined Expense Categories (built-in minus deleted + user custom categories)
  const allExpenseCategories = useMemo(() => {
    const deletedSet = new Set(deletedCategoryIds);
    const builtIn = EXPENSE_CATEGORIES.filter((c) => !deletedSet.has(c.id));
    return [...builtIn, ...customCategories];
  }, [customCategories, deletedCategoryIds]);

  // Today and Yesterday Expense Summary
  const todayAndYesterdayTotals = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;

    let todayTotal = 0;
    let todayCount = 0;
    let yesterdayTotal = 0;
    let yesterdayCount = 0;

    sortedTransactions.forEach((t) => {
      if (t.type === 'expense' && t.categoryId !== 'switch' && t.categoryId !== 'cc_pyd') {
        const amt = parseFloat(t.amount) || 0;
        if (t.date === todayStr) {
          todayTotal += amt;
          todayCount++;
        } else if (t.date === yesterdayStr) {
          yesterdayTotal += amt;
          yesterdayCount++;
        }
      }
    });

    return {
      todayStr,
      yesterdayStr,
      todayTotal,
      todayCount,
      yesterdayTotal,
      yesterdayCount,
    };
  }, [sortedTransactions]);

  const addCustomCategory = async ({ name, nameAr, icon = 'tag-outline', color = '#6366F1', bgColor = '#EEF2FF' }) => {
    const cleanName = (name || nameAr || 'Custom').trim();
    const cleanAr = (nameAr || name || 'بند مخصص').trim();
    const newCat = {
      id: 'cat_custom_' + Date.now(),
      name: cleanName,
      nameAr: cleanAr,
      icon: icon || 'tag-outline',
      color: color || '#6366F1',
      bgColor: bgColor || '#EEF2FF',
      type: 'expense',
      isCustom: true,
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving custom category:', e);
    }
    return newCat;
  };

  const deleteCategory = async (catId) => {
    const isCustom = customCategories.some((c) => c.id === catId);
    if (isCustom) {
      const updated = customCategories.filter((c) => c.id !== catId);
      setCustomCategories(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(updated));
      } catch (e) {
        console.error('Error deleting custom category:', e);
      }
    } else {
      const updatedDeleted = [...new Set([...deletedCategoryIds, catId])];
      setDeletedCategoryIds(updatedDeleted);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.DELETED_CATEGORIES, JSON.stringify(updatedDeleted));
      } catch (e) {
        console.error('Error deleting built-in category:', e);
      }
    }
    return true;
  };

  const restoreAllCategories = async () => {
    setDeletedCategoryIds([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DELETED_CATEGORIES);
    } catch {}
    return true;
  };

  // Combined payment methods (built-in + custom debit/credit cards)
  const allPaymentMethods = useMemo(() => {
    const customMapped = customAccounts.map((acc) => {
      const isCredit = acc.accountType === 'credit';
      return {
        id: acc.id,
        accountType: acc.accountType, // 'debit' | 'credit'
        bankName: acc.bankName,
        name: isCredit ? `${acc.bankName} (CC) 💳` : `${acc.bankName} (DC) 🏦`,
        nameAr: isCredit ? `${acc.bankName} (ائتمان) 💳` : `${acc.bankName} (حساب بنكي) 🏦`,
        icon: isCredit ? 'credit-card-clock-outline' : 'credit-card-outline',
        shortName: acc.bankName,
        shortNameAr: acc.bankName,
        startingBalance: parseFloat(acc.startingBalance) || 0,
        carryOverDueThisMonth: parseFloat(acc.carryOverDueThisMonth) || 0,
        isCustom: true,
      };
    });

    const builtInWithType = PAYMENT_METHODS.map((pm) => ({
      ...pm,
      accountType: pm.id === 'csh' ? 'cash' : pm.id === 'dc' ? 'debit' : 'credit',
      isCustom: false,
    }));

    return [...builtInWithType, ...customMapped];
  }, [customAccounts]);

  const getCategory = (id) => {
    const customFound = (allExpenseCategories || []).find((c) => c.id === id);
    if (customFound) {
      return {
        ...customFound,
        displayName: language === 'ar' ? (customFound.nameAr || customFound.name) : customFound.name,
      };
    }
    return getCategoryById(id, language);
  };

  const getAccountById = (id) => {
    const found = allPaymentMethods.find((p) => p.id === id) || allPaymentMethods[0];
    return {
      ...found,
      displayName: language === 'ar' ? (found.nameAr || found.name) : found.name,
      displayShort: language === 'ar' ? (found.shortNameAr || found.shortName) : (found.shortName || found.name),
    };
  };

  const addCustomAccount = async ({ bankName, accountType = 'credit', startingBalance = 0, carryOverDueThisMonth = 0 }) => {
    const cleanName = (bankName || '').trim();
    if (!cleanName) return null;
    const prefix = accountType === 'credit' ? 'cc_custom_' : 'dc_custom_';
    const newAcc = {
      id: prefix + Date.now(),
      bankName: cleanName,
      accountType: accountType === 'debit' ? 'debit' : 'credit',
      startingBalance: parseFloat(startingBalance) || 0,
      carryOverDueThisMonth: parseFloat(carryOverDueThisMonth) || 0,
      createdAt: Date.now(),
    };
    const updated = [...customAccounts, newAcc];
    setCustomAccounts(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ACCOUNTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving custom account:', e);
    }
    return newAcc;
  };

  const deleteCustomAccount = async (id) => {
    const updated = customAccounts.filter((a) => a.id !== id);
    setCustomAccounts(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ACCOUNTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting custom account:', e);
    }
  };

  const sanitizeTransactionsPaidState = (list) => {
    if (!Array.isArray(list)) return [];
    const paymentIds = new Set();
    const settledTargetIds = new Set();
    list.forEach((t) => {
      if (t.type === 'cc_pyd' || t.categoryId === 'cc_pyd') {
        paymentIds.add(t.id);
        if (t.settledTxId) settledTargetIds.add(t.settledTxId);
      }
    });

    return list.map((t) => {
      if (t.isPaid) {
        const hasValidPayment =
          (t.settledWithTxId && paymentIds.has(t.settledWithTxId)) ||
          settledTargetIds.has(t.id);
        if (!hasValidPayment) {
          return {
            ...t,
            isPaid: false,
            paidAt: null,
            paidFromAccount: null,
            settledWithTxId: null,
          };
        }
      }
      return t;
    });
  };

  const saveTransactions = async (newTx) => {
    const sanitized = sanitizeTransactionsPaidState(newTx);
    const sorted = sortTransactionsNewestFirst(sanitized);
    setTransactions(sorted);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sorted));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  };

  const isCreditCardMethod = (pmId) => {
    if (!pmId) return false;
    if (pmId === 'cc_ar' || pmId === 'cc_ca' || pmId.startsWith('cc_')) return true;
    const acc = customAccounts.find((a) => a.id === pmId);
    return acc?.accountType === 'credit';
  };

  const isDebitCardMethod = (pmId) => {
    if (!pmId) return false;
    if (pmId === 'dc' || pmId.startsWith('dc_')) return true;
    const acc = customAccounts.find((a) => a.id === pmId);
    return acc?.accountType === 'debit';
  };

  const addTransaction = async (data) => {
    const txDate = data.date || new Date().toISOString().split('T')[0];
    const pm = data.paymentMethod || 'csh';
    const isCcPurchase = (data.type || 'expense') === 'expense' && isCreditCardMethod(pm);
    const dueDate = isCcPurchase ? (data.dueDate || getCreditCardDueDate(txDate)) : null;

    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: data.type || 'expense',
      amount: parseFloat(data.amount) || 0,
      categoryId: data.categoryId || 'misc',
      note: (data.note || '').trim(),
      date: txDate,
      paymentMethod: pm,
      dueDate,
      toAccount: data.toAccount || null,
      targetCard: data.targetCard || null,
      createdAt: Date.now(),
    };

    const updated = [newTx, ...transactions];
    await saveTransactions(updated);

    // Category budget check: alert if this expense pushes the category over (or keeps it over) its monthly limit
    let budgetAlert = null;
    const isConsumerExpense =
      newTx.type === 'expense' && newTx.categoryId !== 'switch' && newTx.categoryId !== 'cc_pyd';
    const limit = parseFloat(categoryBudgets?.[newTx.categoryId]) || 0;
    if (isConsumerExpense && limit > 0) {
      const spentAfter = updated
        .filter(
          (t) =>
            t.categoryId === newTx.categoryId &&
            t.type !== 'income' &&
            t.type !== 'switch' &&
            t.type !== 'cc_pyd'
        )
        .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const spentBefore = spentAfter - newTx.amount;
      const cat = getCategoryById(newTx.categoryId, language);
      if (spentAfter > limit) {
        budgetAlert = {
          level: 'exceeded',
          categoryId: newTx.categoryId,
          categoryName: cat.displayName,
          limit,
          spent: spentAfter,
          over: spentAfter - limit,
          firstTime: spentBefore <= limit,
        };
      } else if (spentAfter >= limit * 0.8 && spentBefore < limit * 0.8) {
        budgetAlert = {
          level: 'warning',
          categoryId: newTx.categoryId,
          categoryName: cat.displayName,
          limit,
          spent: spentAfter,
          remaining: limit - spentAfter,
          firstTime: true,
        };
      }
      if (budgetAlert && alertPrefs?.budgetAlertsEnabled !== false) {
        try {
          await sendBudgetExceededNotification(budgetAlert, currency, formatAmount, language === 'ar');
        } catch {}
      }
    }

    return { ...newTx, budgetAlert };
  };

  const addTransactionsBatch = async (batchList) => {
    if (!Array.isArray(batchList) || batchList.length === 0) return [];
    const validItems = batchList.filter((item) => parseFloat(item.amount) > 0);
    if (validItems.length === 0) return [];

    const newItems = validItems.map((data, idx) => {
      const txDate = data.date || new Date().toISOString().split('T')[0];
      const pm = data.paymentMethod || 'csh';
      const isCcPurchase = (data.type || 'expense') === 'expense' && isCreditCardMethod(pm);
      const dueDate = isCcPurchase ? (data.dueDate || getCreditCardDueDate(txDate)) : null;
      return {
        id: 'tx_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
        type: data.type || 'expense',
        amount: parseFloat(data.amount) || 0,
        categoryId: data.categoryId || 'misc',
        note: (data.note || '').trim() || (language === 'ar' ? 'مصروف إكسيل' : 'Excel Entry'),
        date: txDate,
        paymentMethod: pm,
        dueDate,
        toAccount: data.toAccount || null,
        targetCard: data.targetCard || null,
        createdAt: Date.now() + idx,
      };
    });

    const updated = [...newItems, ...transactions];
    await saveTransactions(updated);
    return newItems;
  };

  const deleteTransaction = async (id) => {
    const targetToDelete = transactions.find((t) => t.id === id);
    const updated = transactions
      .filter((t) => t.id !== id)
      .map((t) => {
        // If the deleted transaction was a payment (cc_pyd) that settled this item, revert isPaid
        if (
          targetToDelete &&
          (targetToDelete.type === 'cc_pyd' || targetToDelete.categoryId === 'cc_pyd')
        ) {
          if (
            (targetToDelete.settledTxId && t.id === targetToDelete.settledTxId) ||
            t.settledWithTxId === targetToDelete.id
          ) {
            return {
              ...t,
              isPaid: false,
              paidAt: null,
              paidFromAccount: null,
              settledWithTxId: null,
            };
          }
        }
        return t;
      })
      .filter((t) => {
        // If deleting a purchase that had an associated payment, delete that orphan payment too
        if (
          targetToDelete &&
          targetToDelete.type !== 'cc_pyd' &&
          targetToDelete.settledWithTxId &&
          t.id === targetToDelete.settledWithTxId
        ) {
          return false;
        }
        return true;
      });

    await saveTransactions(updated);
  };

  const updateTransaction = async (id, updatedFields) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updatedFields } : t
    );
    await saveTransactions(updated);
  };

  // Directly settle a specific credit card transaction by creating a cc_pyd transaction and marking tx as paid
  const settleCreditCardTransaction = async (targetTx, sourceAccount = 'dc') => {
    if (!targetTx) return false;
    const amt = parseFloat(targetTx.amount) || 0;
    if (amt <= 0) return false;

    const targetCard = targetTx.paymentMethod || 'cc_ar';
    const cardAcc = getAccountById ? getAccountById(targetCard) : null;
    const cardTitle = cardAcc?.displayName || targetCard;

    const payTx = {
      id: 'tx_pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'cc_pyd',
      categoryId: 'cc_pyd',
      amount: amt,
      paymentMethod: sourceAccount,
      targetCard: targetCard,
      note: language === 'ar'
        ? `سداد معاملة: ${targetTx.note || targetTx.categoryId} (${cardTitle})`
        : `Settled tx: ${targetTx.note || targetTx.categoryId} (${cardTitle})`,
      date: new Date().toISOString().split('T')[0],
      settledTxId: targetTx.id,
      createdAt: Date.now(),
    };

    const updated = transactions.map((t) =>
      t.id === targetTx.id
        ? {
            ...t,
            isPaid: true,
            paidAt: new Date().toISOString(),
            paidFromAccount: sourceAccount,
            settledWithTxId: payTx.id,
          }
        : t
    );

    const finalTransactions = [payTx, ...updated];
    await saveTransactions(finalTransactions);
    return true;
  };

  // Unsettle/Reopen a settled credit card transaction
  const unsettleCreditCardTransaction = async (targetTx) => {
    if (!targetTx) return false;
    const finalTransactions = transactions
      .filter((t) => {
        if (t.type === 'cc_pyd' || t.categoryId === 'cc_pyd') {
          if (t.settledTxId && t.settledTxId === targetTx.id) return false;
          if (targetTx.settledWithTxId && t.id === targetTx.settledWithTxId) return false;
        }
        return true;
      })
      .map((t) =>
        t.id === targetTx.id
          ? { ...t, isPaid: false, paidAt: null, paidFromAccount: null, settledWithTxId: null }
          : t
      );
    await saveTransactions(finalTransactions);
    return true;
  };

  const updateStartBalances = async (newBalances) => {
    setStartBalances(newBalances);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.START_BALANCES, JSON.stringify(newBalances));
    } catch (e) {
      console.error('Error saving start balances:', e);
    }
  };

  const updateCycleStartDate = async (newDate) => {
    setCycleStartDate(newDate);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_START, newDate);
    } catch (e) {
      console.error('Error saving cycle start date:', e);
    }
  };

  const updateCycleEndDate = async (newDate) => {
    setCycleEndDate(newDate);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_END, newDate);
    } catch (e) {
      console.error('Error saving cycle end date:', e);
    }
  };

  const updateCarryOvers = async (newCarryOvers) => {
    setCarryOvers(newCarryOvers);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CARRY_OVERS, JSON.stringify(newCarryOvers));
    } catch (e) {
      console.error('Error saving carry overs:', e);
    }
  };

  const zeroOutCreditCardDues = async (target = 'all') => {
    const today = new Date().toISOString().split('T')[0];
    const newTxList = [];
    const newCarryOvers = { ...carryOvers };

    if (target === 'all' || target === 'cc_ar') {
      newCarryOvers.cc_ar = 0;
      if (balances.ccArDebt > 0) {
        newTxList.push({
          id: 'tx_zero_ar_' + Date.now(),
          type: 'cc_pyd',
          categoryId: 'cc_pyd',
          amount: Math.round(balances.ccArDebt),
          note: language === 'ar' ? 'تصفير مديونية البنك العربي (تسوية)' : 'Zero-out Arab Bank CC debt',
          date: today,
          paymentMethod: 'settle',
          targetCard: 'cc_ar',
          createdAt: Date.now(),
        });
      }
    }

    if (target === 'all' || target === 'cc_ca') {
      newCarryOvers.cc_ca = 0;
      if (balances.ccCaDebt > 0) {
        newTxList.push({
          id: 'tx_zero_ca_' + (Date.now() + 1),
          type: 'cc_pyd',
          categoryId: 'cc_pyd',
          amount: Math.round(balances.ccCaDebt),
          note: language === 'ar' ? 'تصفير مديونية كريدي أجريكول (تسوية)' : 'Zero-out Crédit Agricole CC debt',
          date: today,
          paymentMethod: 'settle',
          targetCard: 'cc_ca',
          createdAt: Date.now() + 1,
        });
      }
    }

    let updatedCustom = [...customAccounts];
    if (target === 'all' || target.startsWith('cc_custom_')) {
      updatedCustom = customAccounts.map((acc) => {
        if (acc.accountType === 'credit') {
          if (target === 'all' || target === acc.id) {
            const foundC = (balances.customCreditCardsSummary || []).find((c) => c.id === acc.id);
            const debt = foundC?.totalDebt || 0;
            if (debt > 0) {
              newTxList.push({
                id: 'tx_zero_' + acc.id + '_' + Date.now(),
                type: 'cc_pyd',
                categoryId: 'cc_pyd',
                amount: Math.round(debt),
                note: language === 'ar' ? `تصفير مديونية ${acc.bankName} (تسوية)` : `Zero-out ${acc.bankName} CC debt`,
                date: today,
                paymentMethod: 'settle',
                targetCard: acc.id,
                createdAt: Date.now() + 2,
              });
            }
            return { ...acc, carryOverDueThisMonth: 0 };
          }
        }
        return acc;
      });
      setCustomAccounts(updatedCustom);
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ACCOUNTS, JSON.stringify(updatedCustom));
    }

    setCarryOvers(newCarryOvers);
    await AsyncStorage.setItem(STORAGE_KEYS.CARRY_OVERS, JSON.stringify(newCarryOvers));

    if (newTxList.length > 0) {
      const updated = [...newTxList, ...transactions];
      await saveTransactions(updated);
    }

    return true;
  };

  const updateAlertPrefs = async (newPrefs) => {
    const merged = { ...alertPrefs, ...newPrefs };
    setAlertPrefs(merged);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ALERT_PREFS, JSON.stringify(merged));
    } catch (e) {
      console.error('Error saving alert prefs:', e);
    }
  };

  const setCategoryBudget = async (categoryId, amount) => {
    const val = parseFloat(amount) || 0;
    const next = { ...categoryBudgets };
    if (val > 0) next[categoryId] = val;
    else delete next[categoryId];
    setCategoryBudgets(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(next));
    } catch (e) {
      console.error('Error saving category budgets:', e);
    }
  };

  const deleteArchivedMonth = async (archiveId) => {
    const updated = archivedMonths.filter((m) => m.id !== archiveId);
    setArchivedMonths(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVED_MONTHS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting archived month:', e);
    }
  };

  const setCurrency = async (newCurr) => {
    setCurrencyState(newCurr);
  };

  const setLanguage = async (newLang) => {
    const valid = newLang === 'ar' ? 'ar' : 'en';
    setLanguageState(valid);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, valid);
    } catch (e) {
      console.error('Error saving language:', e);
    }
  };

  const toggleLanguage = async () => {
    const next = language === 'en' ? 'ar' : 'en';
    await setLanguage(next);
  };

  const setMonthlyBudget = async () => {};

  // Hard reload from initial snapshot (only when explicitly requested from Settings)
  const forceSyncFromExcel = async () => {
    const sortedInit = sortTransactionsNewestFirst(EXCEL_TRANSACTIONS);
    setTransactions(sortedInit);
    setStartBalances(INITIAL_START_BALANCES);
    setCycleStartDate(INITIAL_CYCLE_START);
    setCycleEndDate(INITIAL_CYCLE_END);
    setCarryOvers(INITIAL_CARRY_OVERS);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sortedInit));
    await AsyncStorage.setItem(STORAGE_KEYS.START_BALANCES, JSON.stringify(INITIAL_START_BALANCES));
    await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_START, INITIAL_CYCLE_START);
    await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_END, INITIAL_CYCLE_END);
    await AsyncStorage.setItem(STORAGE_KEYS.CARRY_OVERS, JSON.stringify(INITIAL_CARRY_OVERS));
  };

  const clearAllData = async () => {
    await saveTransactions([]);
  };

  // ==========================================
  // EXACT EXCEL & MULTI-BANK BILLING ENGINE
  // ==========================================
  const balances = useMemo(() => {
    let dcOut = 0;
    let dcIn = 0;
    let cshOut = 0;
    let cshIn = 0;
    let ccCaPurchases = 0;
    let ccCaPaid = 0;
    let ccArPurchases = 0;
    let ccArPaid = 0;
    let realTotalSpent = 0;

    // Track custom debit & credit cards
    const customDebitMap = {};
    const customCreditMap = {};

    customAccounts.forEach((acc) => {
      if (acc.accountType === 'debit') {
        customDebitMap[acc.id] = {
          ...acc,
          startBal: parseFloat(acc.startingBalance) || 0,
          out: 0,
          in: 0,
          avail: parseFloat(acc.startingBalance) || 0,
        };
      } else {
        customCreditMap[acc.id] = {
          ...acc,
          carryOver: parseFloat(acc.carryOverDueThisMonth) || 0,
          purchasesDueThisMonth: 0,
          purchasesDueNextMonth: 0,
          paid: 0,
          dueThisMonth: 0,
          dueNextMonth: 0,
          totalDebt: 0,
        };
      }
    });

    // Current month's 25th vs Following month's 25th
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1..12
    const nextMonth = curMonth === 12 ? 1 : curMonth + 1;
    const nextYear = curMonth === 12 ? curYear + 1 : curYear;

    const currentMonthDueDate = `${curYear}-${String(curMonth).padStart(2, '0')}-25`;
    const nextMonthDueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-25`;

    let ccArPurchasesDueThisMonth = 0;
    let ccArPurchasesDueNextMonth = 0;
    let ccCaPurchasesDueThisMonth = 0;
    let ccCaPurchasesDueNextMonth = 0;

    const initialArCarryOver = parseFloat(carryOvers?.cc_ar) || 0;
    const initialCaCarryOver = parseFloat(carryOvers?.cc_ca) || 0;

    sortedTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount) || 0;

      // Handle Switch (Internal Transfer) — NEVER added to realTotalSpent or totalOutflow
      if (tx.type === 'switch' || tx.categoryId === 'switch') {
        if (tx.paymentMethod === 'dc') dcOut += amt;
        else if (tx.paymentMethod === 'csh') cshOut += amt;
        else if (customDebitMap[tx.paymentMethod]) customDebitMap[tx.paymentMethod].out += amt;

        if (tx.toAccount === 'csh') cshIn += amt;
        else if (tx.toAccount === 'dc') dcIn += amt;
        else if (customDebitMap[tx.toAccount]) customDebitMap[tx.toAccount].in += amt;
        return;
      }

      // Handle Credit Card Payment
      if (tx.type === 'cc_pyd' || tx.categoryId === 'cc_pyd') {
        if (tx.paymentMethod === 'dc') dcOut += amt;
        else if (tx.paymentMethod === 'csh') cshOut += amt;
        else if (customDebitMap[tx.paymentMethod]) customDebitMap[tx.paymentMethod].out += amt;

        if (tx.targetCard && customCreditMap[tx.targetCard]) {
          customCreditMap[tx.targetCard].paid += amt;
        } else {
          const isCa =
            tx.targetCard === 'cc_ca' ||
            tx.paymentMethod === 'cc_ca' ||
            (tx.note && (tx.note.toLowerCase().includes('agricole') || tx.note.toLowerCase().includes('أجريكول') || tx.note.toLowerCase().includes('cc ca')));
          if (isCa) {
            ccCaPaid += amt;
          } else {
            ccArPaid += amt;
          }
        }
        return;
      }

      // Handle Incomings
      if (tx.type === 'income' || tx.categoryId === 'incomings') {
        if (tx.paymentMethod === 'dc') dcIn += amt;
        else if (tx.paymentMethod === 'csh') cshIn += amt;
        else if (customDebitMap[tx.paymentMethod]) customDebitMap[tx.paymentMethod].in += amt;
        return;
      }

      // Consumer Expense
      realTotalSpent += amt;

      if (tx.paymentMethod === 'csh') {
        cshOut += amt;
      } else if (tx.paymentMethod === 'dc') {
        dcOut += amt;
      } else if (customDebitMap[tx.paymentMethod]) {
        customDebitMap[tx.paymentMethod].out += amt;
      } else if (tx.paymentMethod === 'cc_ca') {
        ccCaPurchases += amt;
        const effectiveDue = tx.dueDate || getCreditCardDueDate(tx.date);
        if (effectiveDue <= currentMonthDueDate) {
          ccCaPurchasesDueThisMonth += amt;
        } else {
          ccCaPurchasesDueNextMonth += amt;
        }
      } else if (tx.paymentMethod === 'cc_ar') {
        ccArPurchases += amt;
        const effectiveDue = tx.dueDate || getCreditCardDueDate(tx.date);
        if (effectiveDue <= currentMonthDueDate) {
          ccArPurchasesDueThisMonth += amt;
        } else {
          ccArPurchasesDueNextMonth += amt;
        }
      } else if (customCreditMap[tx.paymentMethod]) {
        const effectiveDue = tx.dueDate || getCreditCardDueDate(tx.date);
        if (effectiveDue <= currentMonthDueDate) {
          customCreditMap[tx.paymentMethod].purchasesDueThisMonth += amt;
        } else {
          customCreditMap[tx.paymentMethod].purchasesDueNextMonth += amt;
        }
      }
    });

    // Include the 1 EGP Excel baseline row 10 adjustment when using the default Oct 22 cycle
    const baselineCshAdj = cycleStartDate === INITIAL_CYCLE_START && sortedTransactions.some((t) => t.id === 'tx_init_1') ? 1 : 0;

    const availDc = startBalances.dc - dcOut + dcIn;
    const availCsh = startBalances.csh - (cshOut + baselineCshAdj) + cshIn;

    // Finalize Custom Debit Cards
    let customDebitTotalAvail = 0;
    let customDebitTotalStart = 0;
    const customDebitCardsSummary = Object.values(customDebitMap).map((d) => {
      const avail = d.startBal - d.out + d.in;
      customDebitTotalAvail += avail;
      customDebitTotalStart += d.startBal;
      return { ...d, avail };
    });

    // Finalize Arab Bank & Credit Agricole
    const ccArGrossDueThisMonth = initialArCarryOver + ccArPurchasesDueThisMonth;
    const ccArDueThisMonth = Math.max(0, ccArGrossDueThisMonth - ccArPaid);
    const arOverpaidAfterThisMonth = Math.max(0, ccArPaid - ccArGrossDueThisMonth);
    const ccArDueNextMonth = Math.max(0, ccArPurchasesDueNextMonth - arOverpaidAfterThisMonth);

    const ccCaGrossDueThisMonth = initialCaCarryOver + ccCaPurchasesDueThisMonth;
    const ccCaDueThisMonth = Math.max(0, ccCaGrossDueThisMonth - ccCaPaid);
    const caOverpaidAfterThisMonth = Math.max(0, ccCaPaid - ccCaGrossDueThisMonth);
    const ccCaDueNextMonth = Math.max(0, ccCaPurchasesDueNextMonth - caOverpaidAfterThisMonth);

    // Finalize Custom Credit Cards
    let customCcDueThisMonthTotal = 0;
    let customCcDueNextMonthTotal = 0;
    let customCcPaidTotal = 0;
    const customCreditCardsSummary = Object.values(customCreditMap).map((c) => {
      const grossThis = c.carryOver + c.purchasesDueThisMonth;
      const dueThis = Math.max(0, grossThis - c.paid);
      const overpaid = Math.max(0, c.paid - grossThis);
      const dueNext = Math.max(0, c.purchasesDueNextMonth - overpaid);
      const totalDebt = dueThis + dueNext;
      customCcDueThisMonthTotal += dueThis;
      customCcDueNextMonthTotal += dueNext;
      customCcPaidTotal += c.paid;
      return {
        ...c,
        dueThisMonth: dueThis,
        dueNextMonth: dueNext,
        totalDebt,
      };
    });

    // Total card debts
    const ccCaCarryOverLeft = Math.max(0, initialCaCarryOver - ccCaPaid);
    const ccCaDebt = ccCaDueThisMonth + ccCaDueNextMonth;
    const ccArCarryOverLeft = Math.max(0, initialArCarryOver - ccArPaid);
    const ccArDebt = ccArDueThisMonth + ccArDueNextMonth;
    const totalCcDueThisMonth = ccArDueThisMonth + ccCaDueThisMonth + customCcDueThisMonthTotal;
    const totalCcDueNextMonth = ccArDueNextMonth + ccCaDueNextMonth + customCcDueNextMonthTotal;
    const totalCcDebt = totalCcDueThisMonth + totalCcDueNextMonth;
    const totalCcPaid = ccCaPaid + ccArPaid + customCcPaidTotal;

    // Net Cash + Bank Outflow (excluding internal 'switch' transfers that cancel out +2000/-2000, and subtracting incoming deposits)
    // Matches Excel B5 + C5 = (4446 + 1936) = 6382 EGP
    const netCashAndDcOutflow = (dcOut - dcIn) + (cshOut + baselineCshAdj - cshIn);

    // Total Outflow / Total Obligations matching Excel cell C2 (B5 + C5 + G6 = 4446 + 1936 + 2728 = 9110 EGP)
    // Purely excludes internal 'switch' transfers (0 net impact) while counting all cash/bank outflows + remaining CC debt
    const totalOutflow = netCashAndDcOutflow + totalCcDebt;

    // Net available money left after clearing cards (matches Excel D2: 31430 - 9110 = 22320 EGP)
    const totalStartedWith = startBalances.dc + startBalances.csh + customDebitTotalStart;
    const netAvailableAfterCards = availDc + availCsh + customDebitTotalAvail - totalCcDebt;

    // Cycle Days calculation (using cycleStartDate and cycleEndDate)
    const start = new Date(cycleStartDate);
    const end = cycleEndDate ? new Date(cycleEndDate) : null;
    const diffTime = Math.abs(now - start);
    const daysElapsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let totalCycleDays = 31;
    if (end && !isNaN(end.getTime()) && !isNaN(start.getTime()) && end > start) {
      totalCycleDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }
    const daysLeft = Math.max(0, totalCycleDays - daysElapsed);

    const avgPerDay = realTotalSpent / daysElapsed;
    const avgOutflowPerDay = totalOutflow / daysElapsed;
    const daysMoneyLasts = avgPerDay > 0 ? (netAvailableAfterCards / avgPerDay) : 999;
    const safeDailySpend = daysLeft > 0 ? (netAvailableAfterCards / daysLeft) : 0;

    // Days until current month due date (25th) and next month due date (25th)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [curDueY, curDueM, curDueD] = currentMonthDueDate.split('-').map(Number);
    const [nextDueY, nextDueM, nextDueD] = nextMonthDueDate.split('-').map(Number);
    const curDueObj = new Date(curDueY, (curDueM || 1) - 1, curDueD || 25);
    const nextDueObj = new Date(nextDueY, (nextDueM || 1) - 1, nextDueD || 25);
    const daysUntilCurrentDue = Math.max(0, Math.round((curDueObj - todayMidnight) / (1000 * 60 * 60 * 24)));
    const daysUntilNextDue = Math.max(0, Math.round((nextDueObj - todayMidnight) / (1000 * 60 * 60 * 24)));

    return {
      totalStartedWith,
      startDc: startBalances.dc,
      startCsh: startBalances.csh,
      cycleStartDate,
      cycleEndDate,
      totalCycleDays,
      dcConsumed: dcOut - dcIn,
      cshConsumed: cshOut + baselineCshAdj - cshIn,
      availDc,
      availCsh,
      customDebitCardsSummary,
      customCreditCardsSummary,
      customDebitTotalAvail,
      ccCaCarryOverLeft,
      ccCaPurchases,
      ccCaPaid,
      ccCaDebt,
      ccCaDueThisMonth,
      ccCaDueNextMonth,
      ccArCarryOverLeft,
      ccArPurchases,
      ccArPurchasesDueThisMonth,
      ccArPurchasesDueNextMonth,
      ccArPaid,
      ccArDebt,
      ccArDueThisMonth,
      ccArDueNextMonth,
      totalCcDueThisMonth,
      totalCcDueNextMonth,
      currentMonthDueDate,
      nextMonthDueDate,
      daysUntilCurrentDue,
      daysUntilNextDue,
      totalCcDebt,
      totalCcPaid,
      netAvailableAfterCards,
      totalOutflow,
      realTotalSpent,
      daysElapsed,
      daysLeft,
      avgPerDay,
      avgOutflowPerDay,
      daysMoneyLasts: Math.round(daysMoneyLasts),
      safeDailySpend: Math.round(safeDailySpend),
    };
  }, [sortedTransactions, startBalances, cycleStartDate, cycleEndDate, carryOvers, customAccounts]);

  // "ترحيل وفتح شهر جديد" (Rollover & Open New Month):
  // 1. Saves all current month's transactions and summary balances into `archivedMonths` (History File viewable anytime on screen).
  // 2. Resets current transactions list to empty [].
  // 3. Sets new month's starting Cash (availCsh) & DC / Bank Account (availDc + optional extra deposit).
  // 4. Sets unpaid Credit Card balances (ccArDebt, ccCaDebt, custom CC debts) as due carry-overs for the new month.
  // 5. Uses the user-chosen `newCycleStartDate` (from the Cycle Start Date input) and computes `newCycleEndDate`.
  const startNewMonthCycle = async ({
    newCycleStartDate,
    newCycleEndDate,
    extraDcDeposit = 0,
    extraCashDeposit = 0,
  } = {}) => {
    const startStr = (newCycleStartDate || cycleStartDate || new Date().toISOString().split('T')[0]).trim();
    let endStr = (newCycleEndDate || '').trim();
    if (!endStr || endStr <= startStr) {
      try {
        const [y, m, d] = startStr.split('-').map(Number);
        let nextM = (m || 1) + 1;
        let nextY = y || 2026;
        if (nextM > 12) {
          nextM = 1;
          nextY += 1;
        }
        endStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d || 22).padStart(2, '0')}`;
      } catch {
        endStr = '2026-12-22';
      }
    }

    // 1. Create a complete Archive Snapshot (History File) of the month being closed
    const archiveEntry = {
      id: 'archive_' + Date.now(),
      archivedAt: new Date().toISOString(),
      cycleStartDate: balances.cycleStartDate,
      cycleEndDate: balances.cycleEndDate,
      startCsh: balances.startCsh,
      startDc: balances.startDc,
      totalStartedWith: balances.totalStartedWith,
      availCsh: balances.availCsh,
      availDc: balances.availDc,
      totalOutflow: balances.totalOutflow,
      realTotalSpent: balances.realTotalSpent,
      netAvailableAfterCards: balances.netAvailableAfterCards,
      ccArDebt: balances.ccArDebt,
      ccCaDebt: balances.ccCaDebt,
      totalCcDebt: balances.totalCcDebt,
      totalCcPaid: balances.totalCcPaid,
      transactionsCount: sortedTransactions.length,
      transactions: [...sortedTransactions],
    };

    const updatedArchives = [archiveEntry, ...archivedMonths];

    // 2. Compute new starting balances and unpaid CC carry-overs
    const nextCshStart = Math.max(0, Math.round(balances.availCsh + (parseFloat(extraCashDeposit) || 0)));
    const nextDcStart = Math.max(0, Math.round(balances.availDc + (parseFloat(extraDcDeposit) || 0)));

    const nextCarryOvers = {
      cc_ar: Math.max(0, Math.round(balances.ccArDebt)),
      cc_ca: Math.max(0, Math.round(balances.ccCaDebt)),
    };

    // Also roll over custom accounts (remaining debit avail -> startingBalance, totalDebt -> carryOverDueThisMonth)
    const updatedCustom = customAccounts.map((acc) => {
      if (acc.accountType === 'debit') {
        const foundD = (balances.customDebitCardsSummary || []).find((d) => d.id === acc.id);
        return {
          ...acc,
          startingBalance: foundD ? Math.max(0, Math.round(foundD.avail)) : acc.startingBalance,
        };
      } else {
        const foundC = (balances.customCreditCardsSummary || []).find((c) => c.id === acc.id);
        return {
          ...acc,
          carryOverDueThisMonth: foundC ? Math.max(0, Math.round(foundC.totalDebt)) : acc.carryOverDueThisMonth,
        };
      }
    });

    setArchivedMonths(updatedArchives);
    setStartBalances({ csh: nextCshStart, dc: nextDcStart });
    setCarryOvers(nextCarryOvers);
    setCycleStartDate(startStr);
    setCycleEndDate(endStr);
    setCustomAccounts(updatedCustom);
    setTransactions([]);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVED_MONTHS, JSON.stringify(updatedArchives));
      await AsyncStorage.setItem(STORAGE_KEYS.START_BALANCES, JSON.stringify({ csh: nextCshStart, dc: nextDcStart }));
      await AsyncStorage.setItem(STORAGE_KEYS.CARRY_OVERS, JSON.stringify(nextCarryOvers));
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_START, startStr);
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_END, endStr);
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ACCOUNTS, JSON.stringify(updatedCustom));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    } catch (e) {
      console.error('Error rolling over to new month:', e);
    }

    return {
      archiveEntry,
      newStartCsh: nextCshStart,
      newStartDc: nextDcStart,
      newCarryOvers: nextCarryOvers,
      newCycleStartDate: startStr,
      newCycleEndDate: endStr,
    };
  };

  // Export & Import Full Backup JSON (so user can save a backup anywhere on their phone or restore it anytime)
  const createFullBackupPayload = () => {
    return {
      appName: 'U3mXpns',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      developer: 'Yousry Mahmoud Naiem',
      data: {
        transactions: sortedTransactions,
        startBalances,
        cycleStartDate,
        cycleEndDate,
        carryOvers,
        alertPrefs,
        language,
        customAccounts,
        archivedMonths,
        categoryBudgets,
      },
    };
  };

  const restoreFromBackupPayload = async (parsedJson) => {
    const d = parsedJson?.data || parsedJson;
    if (!d || typeof d !== 'object') {
      throw new Error('Invalid backup format');
    }

    if (Array.isArray(d.transactions)) {
      const sorted = sortTransactionsNewestFirst(d.transactions);
      setTransactions(sorted);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sorted));
    }
    if (d.startBalances) {
      setStartBalances(d.startBalances);
      await AsyncStorage.setItem(STORAGE_KEYS.START_BALANCES, JSON.stringify(d.startBalances));
    }
    if (d.cycleStartDate) {
      setCycleStartDate(d.cycleStartDate);
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_START, d.cycleStartDate);
    }
    if (d.cycleEndDate) {
      setCycleEndDate(d.cycleEndDate);
      await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_END, d.cycleEndDate);
    }
    if (d.carryOvers) {
      setCarryOvers(d.carryOvers);
      await AsyncStorage.setItem(STORAGE_KEYS.CARRY_OVERS, JSON.stringify(d.carryOvers));
    }
    if (d.alertPrefs) {
      setAlertPrefs(d.alertPrefs);
      await AsyncStorage.setItem(STORAGE_KEYS.ALERT_PREFS, JSON.stringify(d.alertPrefs));
    }
    if (Array.isArray(d.customAccounts)) {
      setCustomAccounts(d.customAccounts);
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_ACCOUNTS, JSON.stringify(d.customAccounts));
    }
    if (Array.isArray(d.archivedMonths)) {
      setArchivedMonths(d.archivedMonths);
      await AsyncStorage.setItem(STORAGE_KEYS.ARCHIVED_MONTHS, JSON.stringify(d.archivedMonths));
    }
    if (d.categoryBudgets && typeof d.categoryBudgets === 'object') {
      setCategoryBudgets(d.categoryBudgets);
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(d.categoryBudgets));
    }
    return true;
  };

  // Per-category budget status for the current month (spent vs limit)
  const budgetStatus = useMemo(() => {
    return Object.entries(categoryBudgets || {})
      .map(([catId, limitRaw]) => {
        const limit = parseFloat(limitRaw) || 0;
        const spent = sortedTransactions
          .filter(
            (t) =>
              t.categoryId === catId &&
              t.type !== 'income' &&
              t.type !== 'switch' &&
              t.type !== 'cc_pyd'
          )
          .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        const cat = getCategoryById(catId, language);
        return {
          categoryId: catId,
          category: { ...cat, name: cat.displayName },
          limit,
          spent,
          remaining: limit - spent,
          pct,
          level: pct > 100 ? 'exceeded' : pct >= 80 ? 'warning' : 'ok',
        };
      })
      .filter((b) => b.limit > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [categoryBudgets, sortedTransactions, language]);

  // Categories Breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    sortedTransactions.forEach((tx) => {
      if (tx.type === 'switch' || tx.categoryId === 'switch' || tx.type === 'cc_pyd' || tx.categoryId === 'cc_pyd' || tx.type === 'income') {
        return;
      }
      const cat = getCategoryById(tx.categoryId, language);
      if (!map[cat.id]) {
        map[cat.id] = { category: { ...cat, name: cat.displayName }, total: 0, count: 0 };
      }
      map[cat.id].total += parseFloat(tx.amount) || 0;
      map[cat.id].count += 1;
    });

    const list = Object.values(map).map((item) => ({
      ...item,
      percentage: balances.realTotalSpent > 0 ? (item.total / balances.realTotalSpent) * 100 : 0,
    }));

    return list.sort((a, b) => b.total - a.total);
  }, [sortedTransactions, balances.realTotalSpent, language]);

  const formatAmount = (num) => {
    const val = parseFloat(num) || 0;
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Automatically request Android notification permissions & schedule monthly 20th-25th reminders at 12:00 PM (if enabled)
  useEffect(() => {
    if (!isLoading) {
      syncMonthlyCreditCardNotifications(
        balances,
        currency,
        formatAmount,
        language === 'ar',
        alertPrefs.phoneNotificationsEnabled
      );
    }
  }, [
    isLoading,
    balances.totalCcDueThisMonth,
    balances.totalCcDueNextMonth,
    language,
    currency.symbol,
    alertPrefs.phoneNotificationsEnabled,
  ]);

  const triggerTestCreditCardNotification = async () => {
    return await sendTestCreditCardNotification(
      balances,
      currency,
      formatAmount,
      language === 'ar'
    );
  };

  const toggleDarkMode = async () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <ExpenseContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        themeColors: getThemeColors(isDarkMode),
        transactions: sortedTransactions,
        monthTransactions: sortedTransactions,
        selectedMonth: '2026-11',
        monthlyBudget: balances.totalStartedWith,
        setMonthlyBudget,
        totalIncome: balances.cshConsumed + balances.dcConsumed,
        totalExpense: balances.realTotalSpent,
        remainingBalance: balances.netAvailableAfterCards,
        balances,
        carryOvers,
        updateCarryOvers,
        alertPrefs,
        updateAlertPrefs,
        archivedMonths,
        deleteArchivedMonth,
        categoryBudgets,
        setCategoryBudget,
        budgetStatus,
        createFullBackupPayload,
        restoreFromBackupPayload,
        categoryBreakdown,
        currency,
        setCurrency,
        language,
        isArabic: language === 'ar',
        setLanguage,
        toggleLanguage,
        customAccounts,
        allPaymentMethods,
        getAccountById,
        addCustomAccount,
        deleteCustomAccount,
        allExpenseCategories,
        customCategories,
        addCustomCategory,
        deleteCategory,
        restoreAllCategories,
        getCategory,
        todayAndYesterdayTotals,
        isCreditCardMethod,
        isDebitCardMethod,
        isLoading,
        formatAmount,
        addTransaction,
        addTransactionsBatch,
        deleteTransaction,
        updateTransaction,
        updateStartBalances,
        updateCycleStartDate,
        updateCycleEndDate,
        zeroOutCreditCardDues,
        settleCreditCardTransaction,
        unsettleCreditCardTransaction,
        startNewMonthCycle,
        forceSyncFromExcel,
        loadSampleData: forceSyncFromExcel,
        resetToExcelData: forceSyncFromExcel,
        clearAllData,
        triggerTestCreditCardNotification,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
