// Settings Screen - Masrofy v2.5.0
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Switch,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, COLOR_PALETTES } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { ManageBanksModal } from '../components/ManageBanksModal';
import { RolloverModal } from '../components/RolloverModal';
import { CategoryBudgetsModal } from '../components/CategoryBudgetsModal';
import { ManageCategoriesModal } from '../components/ManageCategoriesModal';
import {
  saveBackupToChosenFolder,
  shareBackupFile,
  pickAndReadBackupFile,
} from '../utils/backupHelper';
import {
  saveExcelToChosenFolder,
  shareExcelFile,
  buildExcelFileName,
} from '../utils/excelHelper';

export const SettingsScreen = () => {
  const {
    balances,
    monthlyBudget,
    currency,
    transactions,
    totalIncome,
    totalExpense,
    remainingBalance,
    formatAmount,
    loadSampleData,
    clearAllData,
    language,
    isArabic,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
    customAccounts,
    alertPrefs,
    updateAlertPrefs,
    createFullBackupPayload,
    restoreFromBackupPayload,
    zeroOutCreditCardDues,
    archivedMonths,
    themeColors,
    colorPalette,
    setColorPalette,
    appPin,
    setOrUpdateAppPin,
    biometricEnabled,
    biometricHardwareAvailable,
    setBiometricEnabled,
    autoLockAfterMinute,
    setAutoLockAfterMinute,
    unlockAppWithBiometrics,
    lockAppNow,
    allExpenseCategories,
    allPaymentMethods,
  } = useExpense();

  const { width: winWidth } = useWindowDimensions();

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [banksModalVisible, setBanksModalVisible] = useState(false);
  const [rolloverModalVisible, setRolloverModalVisible] = useState(false);
  const [categoryBudgetsModalVisible, setCategoryBudgetsModalVisible] = useState(false);
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState(appPin || '');
  const [backupBusy, setBackupBusy] = useState(false);

  // 1. Save Backup to Phone Folder
  const handleSaveBackupToDevice = async () => {
    try {
      setBackupBusy(true);
      const payload = createFullBackupPayload();
      const res = await saveBackupToChosenFolder(payload);
      setBackupBusy(false);
      if (res.ok || res.success) {
        Alert.alert(
          isArabic ? 'تم حفظ النسخة الاحتياطية بنجاح 💾' : 'Backup Saved Successfully 💾',
          isArabic
            ? `تم حفظ ملف النسخة الاحتياطية (${res.fileName}) في المجلد الذي اخترته بنجاح.`
            : `Backup file (${res.fileName}) was successfully saved to your selected folder.`
        );
      } else if (!res.cancelled) {
        // Fallback to share file
        await handleShareBackupFile();
      }
    } catch (e) {
      setBackupBusy(false);
      Alert.alert(
        isArabic ? 'خطأ في الحفظ' : 'Backup Error',
        e?.message || (isArabic ? 'تعذر حفظ النسخة الاحتياطية' : 'Could not save backup')
      );
    }
  };

  // 2. Share Backup File
  const handleShareBackupFile = async () => {
    try {
      setBackupBusy(true);
      const payload = createFullBackupPayload();
      const res = await shareBackupFile(payload);
      setBackupBusy(false);
      if (!res.ok && !res.success && !res.cancelled) {
        Alert.alert(
          isArabic ? 'خطأ' : 'Error',
          res.error || (isArabic ? 'تعذر مشاركة ملف النسخة الاحتياطية' : 'Could not share backup file')
        );
      }
    } catch (e) {
      setBackupBusy(false);
      Alert.alert(
        isArabic ? 'خطأ' : 'Error',
        e?.message || (isArabic ? 'تعذر مشاركة النسخة الاحتياطية' : 'Could not share backup')
      );
    }
  };

  // 3. Restore Backup from Phone
  const handleRestoreBackup = async () => {
    try {
      setBackupBusy(true);
      const pickRes = await pickAndReadBackupFile();
      setBackupBusy(false);

      if (pickRes.cancelled) {
        return;
      }
      if (!pickRes.ok && !pickRes.success) {
        Alert.alert(
          isArabic ? 'خطأ في قراءة الملف' : 'File Error',
          pickRes.error || (isArabic ? 'تعذر قراءة ملف النسخة الاحتياطية' : 'Could not read backup file')
        );
        return;
      }

      const p = pickRes.payload || pickRes.parsed;
      const dataObj = p?.data || p;
      const count = dataObj?.transactions?.length ?? 0;
      const archiveCount = dataObj?.archivedMonths?.length ?? 0;
      const dt = p?.exportedAt ? new Date(p.exportedAt).toLocaleString() : '';

      Alert.alert(
        isArabic ? 'تأكيد استعادة النسخة الاحتياطية 📥' : 'Confirm Backup Restore 📥',
        isArabic
          ? `ملف النسخة الاحتياطية (${pickRes.fileName || ''}) يحتوي على:\n` +
            `• ${count} معاملة\n` +
            `• ${archiveCount} شهور مؤرشفة\n` +
            (dt ? `• تاريخ النسخة: ${dt}\n\n` : '\n') +
            `هل تريد استبدال بيانات التطبيق الحالية بهذه النسخة؟`
          : `This backup (${pickRes.fileName || ''}) contains:\n` +
            `• ${count} transactions\n` +
            `• ${archiveCount} archived months\n` +
            (dt ? `• Date: ${dt}\n\n` : '\n') +
            `Overwrite current app data with this backup?`,
        [
          { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: isArabic ? 'نعم، استعادة الآن' : 'Yes, Restore Now',
            onPress: async () => {
              try {
                setBackupBusy(true);
                await restoreFromBackupPayload(p);
                setBackupBusy(false);
                Alert.alert(
                  isArabic ? 'تمت الاستعادة بنجاح 🎉' : 'Restored Successfully 🎉',
                  isArabic
                    ? `تم استعادة ${count} معاملة و ${archiveCount} شهور مؤرشفة وكافة الإعدادات بنجاح.`
                    : `Restored ${count} transactions and ${archiveCount} archived months successfully.`
                );
              } catch (err) {
                setBackupBusy(false);
                Alert.alert(isArabic ? 'فشل الاستعادة' : 'Restore Failed', err?.message || String(err));
              }
            },
          },
        ]
      );
    } catch (e) {
      setBackupBusy(false);
      Alert.alert(isArabic ? 'خطأ' : 'Error', e?.message || 'Failed to restore backup');
    }
  };

  // Zero-out Credit Card Dues Handler
  const handleZeroOutCreditCards = () => {
    const totalDue = balances.totalCcDebt || 0;
    if (totalDue <= 0) {
      Alert.alert(
        isArabic ? 'لا توجد مديونيات مستحقة 💳' : 'No Dues 💳',
        isArabic
          ? 'رصيد مديونية بطاقات الائتمان هو صفر (0) بالفعل.'
          : 'All credit card debts are already zero.'
      );
      return;
    }

    Alert.alert(
      isArabic ? 'تصفير مستحقات بطاقات الائتمان 💳' : 'Zero-Out Credit Card Dues 💳',
      isArabic
        ? `إجمالي المستحق حالياً: ${formatAmount(totalDue)} ${currency.symbol}\n` +
          `• البنك العربي (CC AR): ${formatAmount(balances.ccArDebt)} ${currency.symbol}\n` +
          `• كريدي أجريكول (CC CA): ${formatAmount(balances.ccCaDebt)} ${currency.symbol}\n\n` +
          `اختر البطاقة المراد تصفير مديونيتها:`
        : `Total Due: ${formatAmount(totalDue)} ${currency.symbol}\n` +
          `Select card to zero-out:`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'تصفير العربي فقط' : 'Zero Arab Bank only',
          onPress: async () => {
            await zeroOutCreditCardDues('cc_ar');
            Alert.alert(
              isArabic ? 'تم التصفير بنجاح' : 'Success',
              isArabic ? 'تم تصفير مديونية كارت البنك العربي بنجاح وأصبح 0.' : 'Arab Bank dues zeroed out.'
            );
          },
        },
        {
          text: isArabic ? 'تصفير أجريكول فقط' : 'Zero Crédit Agricole only',
          onPress: async () => {
            await zeroOutCreditCardDues('cc_ca');
            Alert.alert(
              isArabic ? 'تم التصفير بنجاح' : 'Success',
              isArabic ? 'تم تصفير مديونية كارت كريدي أجريكول بنجاح وأصبح 0.' : 'Crédit Agricole dues zeroed out.'
            );
          },
        },
        {
          text: isArabic ? 'تصفير جميع الكروت ⚡' : 'Zero All Cards ⚡',
          style: 'destructive',
          onPress: async () => {
            await zeroOutCreditCardDues('all');
            Alert.alert(
              isArabic ? 'تم تصفير كافة البطاقات 🎉' : 'All Cards Zeroed Out 🎉',
              isArabic
                ? 'تم تصفير مستحقات جميع بطاقات الائتمان بالكامل وأصبح رصيد المديونية 0.'
                : 'All credit card debts have been completely zeroed out.'
            );
          },
        },
      ]
    );
  };

  // Export All Records to Real .XLSX Excel File
  const handleExportAllToExcel = () => {
    const defaultName = buildExcelFileName();
    Alert.alert(
      isArabic ? 'تصدير كافة السجلات إلى إكسيل (.xlsx) 📊' : 'Export All Records to Excel (.xlsx) 📊',
      isArabic
        ? `سيتم استخراج كافة معاملات وسجلات التطبيق إلى ملف إكسيل حقيقي (.xlsx) باسم:\n«${defaultName}»\n\nكيف ترغب في تصدير الملف؟`
        : `Export all app records as a real .xlsx Excel file "${defaultName}".\nChoose destination:`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'حفظ في مجلد بالموبايل 📁' : 'Save to Phone Folder 📁',
          onPress: async () => {
            try {
              setBackupBusy(true);
              const res = await saveExcelToChosenFolder({
                transactions,
                archivedMonths,
                balances,
                currencySymbol: currency.symbol,
                isArabic,
                allExpenseCategories,
                allPaymentMethods,
              });
              setBackupBusy(false);
              if (res.success) {
                Alert.alert(
                  isArabic ? 'تم الحفظ بنجاح 🎉' : 'Saved Successfully 🎉',
                  isArabic
                    ? `تم حفظ ملف الإكسيل «${res.fileName}» بنجاح في:\n${res.location || 'المجلد المختار'}`
                    : `Saved "${res.fileName}" successfully to ${res.location}`
                );
              } else if (!res.cancelled) {
                Alert.alert(isArabic ? 'خطأ' : 'Error', res.error || (isArabic ? 'تعذر حفظ الملف' : 'Save failed'));
              }
            } catch (err) {
              setBackupBusy(false);
              Alert.alert(isArabic ? 'خطأ' : 'Error', isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving file');
            }
          },
        },
        {
          text: isArabic ? 'مشاركة الملف 📤' : 'Share File 📤',
          onPress: async () => {
            try {
              setBackupBusy(true);
              const res = await shareExcelFile({
                transactions,
                archivedMonths,
                balances,
                currencySymbol: currency.symbol,
                isArabic,
                allExpenseCategories,
                allPaymentMethods,
              });
              setBackupBusy(false);
              if (!res.success) {
                Alert.alert(isArabic ? 'خطأ' : 'Error', res.error || (isArabic ? 'تعذر مشاركة الملف' : 'Share failed'));
              }
            } catch (err) {
              setBackupBusy(false);
              Alert.alert(isArabic ? 'خطأ' : 'Error', isArabic ? 'حدث خطأ أثناء المشاركة' : 'Error sharing file');
            }
          },
        },
      ]
    );
  };

  // Share financial summary
  const handleShareSummary = async () => {
    try {
      const summaryText = isArabic
        ? `📊 *U3mXpns - الملخص المالي للدورة*
----------------------------------
💰 إجمالي السيولة الخارجة (Total Outflow): ${formatAmount(balances.totalOutflow)} ${currency.symbol}
🔻 الاستهلاك الفعلي (بدون تحويلات): ${formatAmount(totalExpense)} ${currency.symbol}
💵 صافي المتبقي (بعد CC): ${formatAmount(remainingBalance)} ${currency.symbol}
🎯 رأس مال البداية: ${formatAmount(monthlyBudget)} ${currency.symbol}
💳 مستحق قبل ${balances.currentMonthDueDate}: ${formatAmount(balances.totalCcDueThisMonth)} ${currency.symbol}
💳 مستحق قبل ${balances.nextMonthDueDate}: ${formatAmount(balances.totalCcDueNextMonth)} ${currency.symbol}
📝 عدد المعاملات: ${transactions.length}
----------------------------------
تم التصدير من تطبيق U3mXpns للأندرويد`
        : `📊 *U3mXpns - Monthly Financial Summary*
----------------------------------
💰 Total Outflow: ${formatAmount(balances.totalOutflow)} ${currency.symbol}
🔻 Actual Spent (No Switch): ${formatAmount(totalExpense)} ${currency.symbol}
💵 Net Available (After Cards): ${formatAmount(remainingBalance)} ${currency.symbol}
🎯 Starting Capital Base: ${formatAmount(monthlyBudget)} ${currency.symbol}
💳 Due Before ${balances.currentMonthDueDate}: ${formatAmount(balances.totalCcDueThisMonth)} ${currency.symbol}
💳 Due Before ${balances.nextMonthDueDate}: ${formatAmount(balances.totalCcDueNextMonth)} ${currency.symbol}
📝 Total Transactions: ${transactions.length}
----------------------------------
Generated by U3mXpns for Android`;

      await Share.share({
        message: summaryText,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Reset demo data
  const handleResetSampleData = () => {
    Alert.alert(
      isArabic ? 'تسكين بيانات وهمية لتجربة التطبيق' : 'Load Mock Data for Testing',
      isArabic
        ? 'سيؤدي هذا إلى تحميل معاملات وأرصدة تجريبية لفحص وتجربة التطبيق.'
        : 'This will populate sample transactions and balances for app testing.',
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، تسكين البيانات' : 'Yes, Load Data',
          onPress: async () => {
            await loadSampleData();
            Alert.alert(
              isArabic ? 'تم التسكين بنجاح' : 'Loaded',
              isArabic ? 'تم تسكين البيانات الوهمية بنجاح.' : 'Sample test data has been populated.'
            );
          },
        },
      ]
    );
  };

  // Clear all data
  const handleClearAll = () => {
    Alert.alert(
      isArabic ? 'مسح جميع البيانات' : 'Clear All Data',
      isArabic
        ? 'تحذير: سيتم حذف جميع المعاملات المسجلة نهائياً ولا يمكن التراجع.'
        : 'Warning: This action will permanently delete all recorded transactions and cannot be undone.',
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'مسح الكل' : 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert(
              isArabic ? 'تم المسح' : 'Cleared',
              isArabic ? 'تم مسح جميع المعاملات بنجاح.' : 'All transactions have been cleared.'
            );
          },
        },
      ]
    );
  };

  // Smart Date Check before Opening Rollover Modal
  const handleOpenRollover = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCycleEarly = balances?.cycleEndDate && todayStr < balances.cycleEndDate;
    const daysElapsed = balances?.daysElapsed ?? 1;
    const daysLeft = balances?.daysLeft ?? 0;

    if (isCycleEarly && daysLeft > 0) {
      Alert.alert(
        isArabic ? '⚠️ تنبيه: الشهر الحالي لم يكتمل بعد' : '⚠️ Alert: Month Not Completed Yet',
        isArabic
          ? `لم يمر سوى ${daysElapsed} يوم فقط من بداية هذا الشهر (${balances?.cycleStartDate})، ومتبقي ${daysLeft} يوم حتى نهاية الدورة في (${balances?.cycleEndDate}).\n\nهل أنت متأكد أنك تريد إنهاء الشهر الحالي والترحيل لشهر جديد الآن؟`
          : `Only ${daysElapsed} days have passed since the start of this month (${balances?.cycleStartDate}), and ${daysLeft} days remain until ${balances?.cycleEndDate}.\n\nAre you sure you want to end this month and roll over now?`,
        [
          { text: isArabic ? 'تراجع / إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: isArabic ? 'نعم، متابعة الترحيل' : 'Yes, Continue Rollover',
            style: 'destructive',
            onPress: () => setRolloverModalVisible(true),
          },
        ]
      );
    } else {
      setRolloverModalVisible(true);
    }
  };

  // 16-step progression from Dark Navy Blue (#0C2D57) down to Very Light Sky Blue (#E0F2FE)
  const BLUE_SHADES = [
    { bg: '#0A2647', border: '#144272', iconBg: '#144272', iconColor: '#93C5FD', title: '#FFFFFF', sub: '#DBEAFE' }, // 0: Language
    { bg: '#0E3360', border: '#1B4D89', iconBg: '#1B4D89', iconColor: '#BAE6FD', title: '#FFFFFF', sub: '#DBEAFE' }, // 1: Dark Mode
    { bg: '#134074', border: '#1E5696', iconBg: '#1E5696', iconColor: '#BAE6FD', title: '#FFFFFF', sub: '#E0F2FE' }, // 2: Categories
    { bg: '#174E8C', border: '#2364AA', iconBg: '#2364AA', iconColor: '#E0F2FE', title: '#FFFFFF', sub: '#E0F2FE' }, // 3: Startup CC Alert
    { bg: '#1B5CA4', border: '#2972BE', iconBg: '#2972BE', iconColor: '#E0F2FE', title: '#FFFFFF', sub: '#E0F2FE' }, // 4: Phone Notifications
    { bg: '#1E6BB8', border: '#3182CE', iconBg: '#3182CE', iconColor: '#F0F9FF', title: '#FFFFFF', sub: '#E0F2FE' }, // 5: Zero Out CC
    { bg: '#2579C9', border: '#3B8FD9', iconBg: '#1B5CA4', iconColor: '#FFFFFF', title: '#FFFFFF', sub: '#F0F9FF' }, // 6: Manual Edit Month
    { bg: '#3188D8', border: '#4DA0E6', iconBg: '#1E6BB8', iconColor: '#FFFFFF', title: '#FFFFFF', sub: '#F0F9FF' }, // 7: Manage Banks
    { bg: '#479BE6', border: '#66B2F0', iconBg: '#1E5696', iconColor: '#FFFFFF', title: '#FFFFFF', sub: '#F0F9FF' }, // 8: Category Budgets
    { bg: '#63B0F2', border: '#3898EC', iconBg: '#0C4A6E', iconColor: '#FFFFFF', title: '#082F49', sub: '#0C4A6E' }, // 9: Rollover Month
    { bg: '#7EC3F8', border: '#56B0F5', iconBg: '#0369A1', iconColor: '#FFFFFF', title: '#082F49', sub: '#0C4A6E' }, // 10: Save Backup
    { bg: '#99D2FB', border: '#75C2F9', iconBg: '#0284C7', iconColor: '#FFFFFF', title: '#082F49', sub: '#075985' }, // 11: Share Backup
    { bg: '#B3E0FD', border: '#8ED0FB', iconBg: '#0284C7', iconColor: '#FFFFFF', title: '#082F49', sub: '#075985' }, // 12: Export Excel
    { bg: '#C6E9FE', border: '#99D5FC', iconBg: '#0369A1', iconColor: '#FFFFFF', title: '#082F49', sub: '#0369A1' }, // 13: Restore Backup
    { bg: '#D6F0FE', border: '#B0E0FD', iconBg: '#0284C7', iconColor: '#FFFFFF', title: '#0C4A6E', sub: '#0369A1' }, // 14: Share Summary
    { bg: '#E3F5FF', border: '#BAE6FD', iconBg: '#0369A1', iconColor: '#FFFFFF', title: '#0C4A6E', sub: '#0369A1' }, // 15: Sample Data
    { bg: '#EFF9FF', border: '#C6E9FE', iconBg: '#0284C7', iconColor: '#FFFFFF', title: '#0C4A6E', sub: '#0369A1' }, // 16: Clear Data
  ];

  const cardTheme = (idx) => {
    const s = BLUE_SHADES[Math.min(idx, BLUE_SHADES.length - 1)];
    return {
      cardStyle: { backgroundColor: s.bg, borderColor: s.border, borderWidth: 1.5 },
      iconBoxStyle: { backgroundColor: s.iconBg },
      iconColor: s.iconColor,
      titleStyle: { color: s.title, fontWeight: '800' },
      subStyle: { color: s.sub },
    };
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { alignItems: 'center', justifyContent: 'center' }, isDarkMode && { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { textAlign: 'center' }, isDarkMode && { color: themeColors.textPrimary }]}>
          {isArabic ? 'الإعدادات والبيانات' : 'Settings & Data'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ width: '100%' }}>
            {/* App Language Section (English <-> Arabic) */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'لغة التطبيق / App Language 🌐' : 'App Language / لغة التطبيق 🌐'}
            </Text>

            <View style={[styles.languageCard, cardTheme(0).cardStyle]}>
              <View style={[styles.langButtonsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={[
                    styles.langBtn,
                    language === 'en' && styles.langBtnActive,
                  ]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="alphabet-latin"
                    size={20}
                    color={language === 'en' ? '#0A2647' : '#E0F2FE'}
                  />
                  <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
                    English (LTR)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langBtn,
                    language === 'ar' && styles.langBtnActive,
                  ]}
                  onPress={() => setLanguage('ar')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="abjad-arabic"
                    size={20}
                    color={language === 'ar' ? '#0A2647' : '#E0F2FE'}
                  />
                  <Text style={[styles.langBtnText, language === 'ar' && styles.langBtnTextActive]}>
                    العربية (RTL)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 1. Dark Mode Switch */}
            <View style={[styles.settingItem, cardTheme(1).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(1).iconBoxStyle]}>
                  <MaterialCommunityIcons
                    name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                    size={20}
                    color={cardTheme(1).iconColor}
                  />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(1).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'الوضع المظلم (Dark Mode) 🌙' : 'Dark Mode (الوضع المظلم) 🌙'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(1).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'التبديل بين الثيم الداكن للراحة البصرية والثيم الفاتح'
                      : 'Toggle between dark theme for eye comfort and light theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#64748B', true: '#7DD3FC' }}
                thumbColor={isDarkMode ? '#0284C7' : '#F8FAFC'}
              />
            </View>

            {/* 1.A Dedicated App Color Theme Selection Option */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                { backgroundColor: themeColors.primaryDark, borderColor: themeColors.primary, borderWidth: 1.5 },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.primary }]}>
                  <MaterialCommunityIcons name="palette-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#FFFFFF', fontWeight: '800' }, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'ثيم وألوان التطبيق (App Theme) 🎨' : 'App Color Theme 🎨'}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: '#F1F5F9' }, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? `الثيم الحالي: ${COLOR_PALETTES[colorPalette]?.nameAr || 'الأخضر الزمردي'} • اضغط لتغيير ألوان البرنامج بالكامل`
                      : `Current Theme: ${COLOR_PALETTES[colorPalette]?.nameEn || 'Emerald'} • Tap to customize app colors`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* 1.B Dedicated App Security Lock (Fingerprint + Auto-Lock 1 min + PIN) Option */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                cardTheme(2).cardStyle,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => {
                setPinInput(appPin || '');
                setSecurityModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(2).iconBoxStyle]}>
                  <MaterialCommunityIcons name="fingerprint" size={22} color={cardTheme(2).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(2).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'تأمين وقفل التطبيق بالبصمة والرقم السري 🔒' : 'Biometric Fingerprint & PIN Lock 🔒'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(2).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? `الدخول بالبصمة (${biometricEnabled ? 'مفعل' : 'متوقف'}) • قفل تلقائي بعد دقيقة بالخلفية (${autoLockAfterMinute ? 'مفعل' : 'متوقف'}) • رقم سري (${appPin ? 'مفعل' : 'غير محدد'})`
                      : `Fingerprint (${biometricEnabled ? 'On' : 'Off'}) • 1-Min Background Auto-Lock (${autoLockAfterMinute ? 'On' : 'Off'}) • PIN (${appPin ? 'Set' : 'None'})`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(2).iconColor}
              />
            </TouchableOpacity>

            {/* 2. Manage & Delete Categories Option */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                cardTheme(2).cardStyle,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setManageCategoriesVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(2).iconBoxStyle]}>
                  <MaterialCommunityIcons name="shape-outline" size={20} color={cardTheme(2).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(2).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'إدارة وحذف بنود المصروفات 🏷️' : 'Manage & Delete Categories 🏷️'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(2).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'حذف أي بند (افتراضي أو مخصص) أو استعادة البنود الافتراضية'
                      : 'Delete any category (built-in or custom) or restore defaults'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(2).iconColor}
              />
            </TouchableOpacity>

            {/* Credit Card Reminders & Notifications Controls */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'إعدادات تنبيهات سداد الكروت 🔔' : 'Credit Card Due Reminders 🔔'}
            </Text>

            {/* 3. Startup Alert */}
            <View style={[styles.settingItem, cardTheme(3).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(3).iconBoxStyle]}>
                  <MaterialCommunityIcons name="bell-alert-outline" size={20} color={cardTheme(3).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(3).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'تنبيه سداد الكروت عند فتح التطبيق'
                      : 'Startup Credit Card Due Alert'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(3).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إظهار نافذة التذكير بمستحقات الكروت تلقائياً عند بداية تشغيل التطبيق'
                      : 'Automatically show due card amounts popup when opening the app'}
                  </Text>
                </View>
              </View>
              <Switch
                value={alertPrefs?.startupAlertEnabled !== false}
                onValueChange={(val) => updateAlertPrefs({ startupAlertEnabled: val })}
                trackColor={{ false: '#64748B', true: '#7DD3FC' }}
                thumbColor={alertPrefs?.startupAlertEnabled !== false ? '#0284C7' : '#F8FAFC'}
              />
            </View>

            {/* 4. Phone Notifications */}
            <View style={[styles.settingItem, cardTheme(4).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(4).iconBoxStyle]}>
                  <MaterialCommunityIcons name="cellphone-message" size={20} color={cardTheme(4).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(4).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إشعارات الهاتف من يوم 20 إلى 25 بالشهر'
                      : 'Phone Notifications (20th to 25th of Month)'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(4).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إرسال تذكير يومي الساعة 12:00 ظهراً من يوم 20 حتى 25 بمستحقات الكروت'
                      : 'Daily phone notification at 12:00 PM from the 20th to 25th'}
                  </Text>
                </View>
              </View>
              <Switch
                value={alertPrefs?.phoneNotificationsEnabled !== false}
                onValueChange={(val) => updateAlertPrefs({ phoneNotificationsEnabled: val })}
                trackColor={{ false: '#64748B', true: '#7DD3FC' }}
                thumbColor={alertPrefs?.phoneNotificationsEnabled !== false ? '#0284C7' : '#F8FAFC'}
              />
            </View>

            {/* 5. Zero-Out Credit Card Dues Button */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                cardTheme(5).cardStyle,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleZeroOutCreditCards}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(5).iconBoxStyle]}>
                  <MaterialCommunityIcons name="credit-card-refund-outline" size={20} color={cardTheme(5).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(5).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'تصفير مستحقات بطاقات الائتمان 💳' : 'Zero-Out Credit Card Dues 💳'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(5).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? `إجمالي المستحق حالياً: ${formatAmount(balances.totalCcDebt)} ${currency.symbol} • اضغط لتصفير مديونية الكروت`
                      : `Current Dues: ${formatAmount(balances.totalCcDebt)} ${currency.symbol} • Tap to zero out card debts`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(5).iconColor}
              />
            </TouchableOpacity>

            {/* Preference Settings Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'التفضيلات المالية والبنوك والشهر الجديد' : 'Financial Preferences, Banks & New Month'}
            </Text>

            {/* 6. Manual Edit for New Month */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(6).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={() => setBudgetModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(6).iconBoxStyle]}>
                  <MaterialCommunityIcons name="calendar-plus" size={20} color={cardTheme(6).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(6).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'تعديل يدوي للشهر الجديد' : 'Manual Edit for New Month'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(6).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? `ضبط وتعديل يدوي لأرصدة البداية وتواريخ الدورة (${balances?.cycleStartDate} إلى ${balances?.cycleEndDate})`
                      : `Manually configure starting balances, cycle dates (${balances?.cycleStartDate} to ${balances?.cycleEndDate})`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(6).iconColor}
              />
            </TouchableOpacity>

            {/* 7. Add & Manage Banks */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(7).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={() => setBanksModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(7).iconBoxStyle]}>
                  <MaterialCommunityIcons name="bank-plus" size={20} color={cardTheme(7).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(7).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إضافة وإدارة البنوك والكروت (CC / DC حساب بنكي)'
                      : 'Add & Manage Banks & Cards (CC / DC Bank Account)'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(7).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? `أضف أي بنك أو كارت ائتمان أو حساب بنكي DC (${(customAccounts || []).length} مضاف)`
                      : `Add custom Credit Cards or DC Bank Accounts (${(customAccounts || []).length} custom added)`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(7).iconColor}
              />
            </TouchableOpacity>

            {/* 8. Category Budgets & Overspending Alerts */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                cardTheme(8).cardStyle,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setCategoryBudgetsModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(8).iconBoxStyle]}>
                  <MaterialCommunityIcons name="target" size={20} color={cardTheme(8).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(8).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'ميزانيات البنود وتنبيهات التجاوز 🎯' : 'Category Budgets & Alerts 🎯'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(8).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'حدد حداً أقصى للمصاريف (طعام، فواتير، مواصلات، إلخ) مع تنبيه فوري عند التجاوز'
                      : 'Set monthly limits per category with instant warning alerts upon overspending'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(8).iconColor}
              />
            </TouchableOpacity>

            {/* 9. Dedicated Rollover & Open New Month Button */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                cardTheme(9).cardStyle,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleOpenRollover}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(9).iconBoxStyle]}>
                  <MaterialCommunityIcons name="calendar-sync" size={20} color={cardTheme(9).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(9).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'ترحيل وفتح شهر جديد 🗓️' : 'Rollover & Open New Month 🗓️'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(9).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'حفظ معاملات الشهر في أرشيف الشهور وتصفير السجلات وترحيل الكاش ومستحقات الكروت'
                      : 'Archive past month to history, reset logs, and roll over cash & CC dues'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(9).titleStyle.color}
              />
            </TouchableOpacity>

            {/* Full App Backup & Restore Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'النسخ الاحتياطي والاستعادة 💾' : 'Backup & Restore 💾'}
            </Text>

            {/* 10. Save Backup to Device / Mobile Folder */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(10).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleSaveBackupToDevice}
              disabled={backupBusy}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(10).iconBoxStyle]}>
                  <MaterialCommunityIcons name="folder-download" size={20} color={cardTheme(10).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(10).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'حفظ نسخة احتياطية على الموبايل 💾' : 'Save Backup to Phone Folder 💾'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(10).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'اختر مجلداً في ذاكرة الموبايل أو بطاقة الذاكرة لحفظ ملف النسخة الاحتياطية'
                      : 'Choose any folder on device or SD card to save the backup file'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(10).titleStyle.color}
              />
            </TouchableOpacity>

            {/* 11. Share Backup File */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(11).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleShareBackupFile}
              disabled={backupBusy}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(11).iconBoxStyle]}>
                  <MaterialCommunityIcons name="share-variant" size={20} color={cardTheme(11).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(11).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'مشاركة / إرسال ملف النسخة الاحتياطية 📤' : 'Share / Export Backup File 📤'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(11).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إرسال ملف النسخة (.json) عبر واتساب أو جوجل درايف أو البريد'
                      : 'Send .json backup file via WhatsApp, Drive, or Email'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(11).titleStyle.color}
              />
            </TouchableOpacity>

            {/* 12. Export All Records to Excel (.xlsx) */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                cardTheme(12).cardStyle,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleExportAllToExcel}
              disabled={backupBusy}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(12).iconBoxStyle]}>
                  <MaterialCommunityIcons name="file-excel-outline" size={20} color={cardTheme(12).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(12).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'تصدير كافة السجلات إلى إكسيل (.xlsx) 📊' : 'Export All Records to Excel (.xlsx) 📊'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(12).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إنشاء ملف إكسيل حقيقي باسم "مصروفاتي_[تاريخ_اليوم].xlsx" وحفظه أو مشاركته'
                      : 'Generate true .xlsx file "مصروفاتي_[date].xlsx" and save to folder or share'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(12).titleStyle.color}
              />
            </TouchableOpacity>

            {/* 13. Restore Backup */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(13).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleRestoreBackup}
              disabled={backupBusy}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(13).iconBoxStyle]}>
                  <MaterialCommunityIcons name="file-upload" size={20} color={cardTheme(13).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(13).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'استعادة نسخة احتياطية من الهاتف 📥' : 'Restore Backup from File 📥'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(13).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'حدد ملف النسخة الاحتياطية (.json) لاستعادة كافة المعاملات وأرشيف الشهور'
                      : 'Pick a .json backup file to restore all transactions and history'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(13).titleStyle.color}
              />
            </TouchableOpacity>

            {/* Data Tools Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'البيانات والتقارير' : 'Data & Reports'}
            </Text>

            {/* 14. Share Summary */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(14).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleShareSummary}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(14).iconBoxStyle]}>
                  <MaterialCommunityIcons name="share-variant-outline" size={20} color={cardTheme(14).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(14).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'مشاركة الملخص المالي' : 'Share Financial Summary'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(14).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إرسال التقرير الشهري عبر واتساب أو نسخه كنص'
                      : 'Export monthly summary via WhatsApp or copy text'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(14).titleStyle.color}
              />
            </TouchableOpacity>

            {/* 15. Reset Sample Data */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(15).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleResetSampleData}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(15).iconBoxStyle]}>
                  <MaterialCommunityIcons name="database-refresh-outline" size={20} color={cardTheme(15).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(15).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'تسكين بيانات وهمية لتجربة التطبيق' : 'Load Mock Data for Testing'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(15).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'تحميل معاملات وأرصدة تجريبية لاختبار شاشات وميزات التطبيق'
                      : 'Populate sample transactions and balances for app testing'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(15).titleStyle.color}
              />
            </TouchableOpacity>

            {/* 16. Clear All Data */}
            <TouchableOpacity
              style={[styles.settingItem, cardTheme(16).cardStyle, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, cardTheme(16).iconBoxStyle]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={cardTheme(16).iconColor} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, cardTheme(16).titleStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'مسح جميع البيانات' : 'Clear All Data'}
                  </Text>
                  <Text style={[styles.settingSubtitle, cardTheme(16).subStyle, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'حذف كل المعاملات المسجلة والبدء من جديد'
                      : 'Delete all recorded transactions and start fresh'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={cardTheme(16).titleStyle.color}
              />
            </TouchableOpacity>

            {/* About App Section - Black rectangle with white text, largest card on the screen */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'عن التطبيق' : 'About App'}
            </Text>
            <View style={styles.aboutCard}>
              <View style={[styles.aboutHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={styles.aboutLogo}>
                  <MaterialCommunityIcons name="wallet" size={28} color="#000000" />
                </View>
                <View style={[{ flex: 1 }, isArabic ? { alignItems: 'flex-end', marginRight: 12 } : { alignItems: 'flex-start', marginLeft: 12 }]}>
                  <Text style={[styles.aboutName, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'U3mXpns - مصروفي (متتبع المصروفات والكروت)' : 'U3mXpns - Masrofy Expense & Card Tracker'}
                  </Text>
                  <Text style={[styles.aboutVersion, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'الإصدار 2.5.0 للأندرويد (عربي / English)' : 'Version 2.5.0 for Android (EN / AR)'}
                  </Text>
                  <Text style={[{ fontSize: 12.5, fontWeight: '800', color: '#38BDF8', marginTop: 4 }, isArabic && { textAlign: 'right' }]}>
                    Developed by Yousry Mahmoud Naiem
                  </Text>
                </View>
              </View>
              <View style={styles.aboutDivider} />
              <Text style={[styles.aboutDesc, isArabic ? { textAlign: 'right' } : { textAlign: 'left' }]}>
                {isArabic
                  ? 'تطبيق شخصي سريع ويعمل 100% بدون إنترنت لإدارة الكاش (Cash) والحساب البنكي (DC / حساب بنكي) وبطاقات الائتمان وفترة السماح ومواعيد السداد مع تحليلات لحظية شاملة.'
                  : 'A fast, 100% offline personal finance & multi-bank card tracker designed to manage your Cash, DC / Bank Accounts, and Credit Card grace periods with real-time Insights.'}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

      {/* Set Budget Modal */}
      <SetBudgetModal
        visible={budgetModalVisible}
        onClose={() => setBudgetModalVisible(false)}
      />

      {/* Manage Custom Banks & Cards Modal */}
      <ManageBanksModal
        visible={banksModalVisible}
        onClose={() => setBanksModalVisible(false)}
      />

      {/* Rollover & Open New Month Modal */}
      <RolloverModal
        visible={rolloverModalVisible}
        onClose={() => setRolloverModalVisible(false)}
      />

      {/* Category Budgets & Overspending Alerts Modal */}
      <CategoryBudgetsModal
        visible={categoryBudgetsModalVisible}
        onClose={() => setCategoryBudgetsModalVisible(false)}
      />

      {/* Manage & Delete Categories Modal */}
      <ManageCategoriesModal
        visible={manageCategoriesVisible}
        onClose={() => setManageCategoriesVisible(false)}
      />

      {/* Dedicated App Color Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, isDarkMode && { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, isDarkMode && { color: themeColors.textPrimary }]}>
                {isArabic ? '🎨 اختيار ثيم وألوان التطبيق' : '🎨 Choose App Color Theme'}
              </Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color={isDarkMode ? themeColors.textPrimary : COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12, textAlign: isArabic ? 'right' : 'left' }}>
                {isArabic
                  ? 'اختر الثيم المفضل لديك لتغيير ألوان الهيدر، الأزرار، وشريط التنقل في كافة شاشات التطبيق فوراً:'
                  : 'Select your preferred color palette to immediately update headers, buttons, and tabs across the app:'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {Object.values(COLOR_PALETTES).map((pal) => {
                  const selected = colorPalette === pal.id;
                  return (
                    <TouchableOpacity
                      key={pal.id}
                      onPress={() => setColorPalette(pal.id)}
                      activeOpacity={0.8}
                      style={{
                        width: '48%',
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: selected ? 2.5 : 1.5,
                        borderColor: selected ? pal.primary : '#CBD5E1',
                        backgroundColor: pal.primaryUltraLight,
                        flexDirection: isArabic ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: pal.primary }} />
                      <Text style={{ fontWeight: '900', fontSize: 12.5, color: '#0F172A', flex: 1, textAlign: isArabic ? 'right' : 'left' }}>
                        {isArabic ? pal.nameAr : pal.nameEn}
                      </Text>
                      {selected && <MaterialCommunityIcons name="check-circle" size={20} color={pal.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: themeColors.primary, marginTop: 18 }]}
                onPress={() => setThemeModalVisible(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>{isArabic ? 'تم وتطبيق الثيم ✓' : 'Done & Apply ✓'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dedicated Security & Biometric Fingerprint Lock Modal */}
      <Modal
        visible={securityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, isDarkMode && { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, isDarkMode && { color: themeColors.textPrimary }]}>
                {isArabic ? '🔒 تأمين التطبيق بالبصمة والرقم السري' : '🔒 Fingerprint & PIN Security Lock'}
              </Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color={isDarkMode ? themeColors.textPrimary : COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* 1. Fingerprint / Biometric Login Toggle */}
              <View style={[styles.securityRowCard, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.securityRowTitle, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? '👆 الدخول ببصمة الإصبع (Fingerprint)' : '👆 Fingerprint / Biometric Login'}
                  </Text>
                  <Text style={[styles.securityRowSub, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'طلب بصمة الإصبع عند فتح تطبيق مصروفي لحماية بياناتك المالية'
                      : 'Require fingerprint authentication when opening Masrofy'}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={(v) => setBiometricEnabled(v)}
                  trackColor={{ false: '#64748B', true: themeColors.primaryLight }}
                  thumbColor={biometricEnabled ? themeColors.primary : '#F8FAFC'}
                />
              </View>

              {/* 2. 1-Minute Background Auto-Lock Toggle */}
              <View style={[styles.securityRowCard, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.securityRowTitle, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? '⏱️ خروج وقفل تلقائي بعد دقيقة في الخلفية' : '⏱️ Auto-Lock After 1 Minute in Background'}
                  </Text>
                  <Text style={[styles.securityRowSub, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'إغلاق التطبيق وقفل الشاشة تلقائياً عند تركه في الخلفية لمدة دقيقة واحدة (60 ثانية)'
                      : 'Automatically lock the app if left in the background for 1 minute (60s)'}
                  </Text>
                </View>
                <Switch
                  value={autoLockAfterMinute}
                  onValueChange={(v) => setAutoLockAfterMinute(v)}
                  trackColor={{ false: '#64748B', true: themeColors.primaryLight }}
                  thumbColor={autoLockAfterMinute ? themeColors.primary : '#F8FAFC'}
                />
              </View>

              {/* 3. Test Fingerprint / Lock App Now Button */}
              {biometricHardwareAvailable && (
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { backgroundColor: '#0284C7', marginBottom: 14, flexDirection: isArabic ? 'row-reverse' : 'row' }]}
                  onPress={async () => {
                    const ok = await unlockAppWithBiometrics();
                    Alert.alert(
                      ok ? (isArabic ? 'تم التحقق بالبصمة بنجاح ✅' : 'Fingerprint Verified ✅') : (isArabic ? 'لم يكتمل التحقق' : 'Not Verified'),
                      ok
                        ? (isArabic ? 'مستشعر البصمة يعمل بنجاح لتأمين تطبيق مصروفي.' : 'Fingerprint authentication is working properly.')
                        : (isArabic ? 'تم إلغاء البصمة أو لم يتم التعرف عليها.' : 'Fingerprint scan was cancelled or not recognized.')
                    );
                  }}
                >
                  <MaterialCommunityIcons name="fingerprint" size={20} color="#FFFFFF" />
                  <Text style={styles.modalPrimaryBtnText}>
                    {isArabic ? 'فحص وتجربة البصمة الآن 👆' : 'Test Fingerprint Sensor Now 👆'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* 4. Optional 4-Digit Backup PIN */}
              <Text style={[styles.securityRowTitle, { marginTop: 6, marginBottom: 4 }, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
                {isArabic ? '🔢 الرقم السري الاحتياطي (4 أرقام - اختياري)' : '🔢 4-Digit Backup PIN (Optional)'}
              </Text>
              <Text style={[styles.securityRowSub, { marginBottom: 8 }, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? 'يمكنك تعيين رقم سري من 4 أرقام للدخول به بجانب بصمة الإصبع (اتركه فارغاً للاكتفاء بالبصمة فقط):'
                  : 'Set an optional 4-digit PIN alongside Fingerprint login:'}
              </Text>
              <TextInput
                style={[styles.pinInputBox, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surfaceSecondary }]}
                placeholder={isArabic ? 'أدخل 4 أرقام (مثال: 1234)' : 'Enter 4-digit PIN'}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={pinInput}
                onChangeText={setPinInput}
              />
              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { flex: 1, backgroundColor: themeColors.primary }]}
                  onPress={async () => {
                    const clean = (pinInput || '').trim();
                    if (clean && clean.length < 4) {
                      Alert.alert(isArabic ? 'تنبيه' : 'Alert', isArabic ? 'الرقم السري يجب أن يتكون من 4 أرقام' : 'PIN must be 4 digits');
                      return;
                    }
                    await setOrUpdateAppPin(clean);
                    Alert.alert(
                      isArabic ? 'تم الحفظ 🔒' : 'Saved 🔒',
                      clean
                        ? (isArabic ? 'تم حفظ الرقم السري وتفعيل الحماية بنجاح.' : 'PIN lock saved.')
                        : (isArabic ? 'تم حفظ الإعدادات بنجاح.' : 'Security settings saved.')
                    );
                  }}
                >
                  <MaterialCommunityIcons name="lock-check-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.modalPrimaryBtnText}>{isArabic ? 'حفظ الرقم السري' : 'Save PIN'}</Text>
                </TouchableOpacity>

                {(appPin || (biometricEnabled && biometricHardwareAvailable)) && (
                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, { backgroundColor: '#334155', paddingHorizontal: 14 }]}
                    onPress={() => {
                      setSecurityModalVisible(false);
                      lockAppNow();
                    }}
                  >
                    <MaterialCommunityIcons name="lock" size={18} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryBtnText}>{isArabic ? 'قفل الآن' : 'Lock Now'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E2E8F0', // Light gray background instead of white
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    backgroundColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
    marginTop: 14,
    textAlign: 'left',
  },
  languageCard: {
    minHeight: 74,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  langButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#144272',
    borderWidth: 1.5,
    borderColor: '#1E5696',
  },
  langBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#7DD3FC',
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0F2FE',
  },
  langBtnTextActive: {
    color: '#0A2647',
    fontWeight: '900',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 78,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  dangerItem: {
    borderColor: '#93C5FD',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  settingSubtitle: {
    fontSize: 10.5,
    lineHeight: 15.5,
    marginTop: 3,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  securityRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  securityRowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  securityRowSub: {
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
    marginTop: 2,
  },
  pinInputBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  aboutCard: {
    backgroundColor: '#000000',
    borderRadius: 22,
    padding: 22,
    minHeight: 185,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
    width: '100%',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  aboutLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 3,
    fontWeight: '700',
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
    width: '100%',
  },
  aboutDesc: {
    fontSize: 12.5,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
