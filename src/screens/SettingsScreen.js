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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
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
  } = useExpense();

  const { width: winWidth } = useWindowDimensions();

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [banksModalVisible, setBanksModalVisible] = useState(false);
  const [rolloverModalVisible, setRolloverModalVisible] = useState(false);
  const [categoryBudgetsModalVisible, setCategoryBudgetsModalVisible] = useState(false);
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);
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

            <View style={styles.languageCard}>
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
                    color={language === 'en' ? '#FFFFFF' : COLORS.textSecondary}
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
                    color={language === 'ar' ? '#FFFFFF' : COLORS.textSecondary}
                  />
                  <Text style={[styles.langBtnText, language === 'ar' && styles.langBtnTextActive]}>
                    العربية (RTL)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dark Mode Switch */}
            <View style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#334155' : '#EDE9FE' }]}>
                  <MaterialCommunityIcons
                    name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                    size={20}
                    color={isDarkMode ? '#FDE047' : '#7C3AED'}
                  />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.settingTitle}>
                    {isArabic ? 'الوضع المظلم (Dark Mode) 🌙' : 'Dark Mode (الوضع المظلم) 🌙'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'التبديل بين الثيم الداكن للراحة البصرية والثيم الفاتح'
                      : 'Toggle between dark theme for eye comfort and light theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={isDarkMode ? '#059669' : '#64748B'}
              />
            </View>

            {/* Manage & Delete Categories Option */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setManageCategoriesVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2E1065' : '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="shape-outline" size={20} color={isDarkMode ? '#C084FC' : '#7C3AED'} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, isDarkMode && { color: themeColors.textPrimary }]}>
                    {isArabic ? 'إدارة وحذف بنود المصروفات 🏷️' : 'Manage & Delete Categories 🏷️'}
                  </Text>
                  <Text style={[styles.settingSubtitle, isDarkMode && { color: themeColors.textSecondary }]}>
                    {isArabic
                      ? 'حذف أي بند (افتراضي أو مخصص) أو استعادة البنود الافتراضية'
                      : 'Delete any category (built-in or custom) or restore defaults'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={isDarkMode ? '#A1A1AA' : COLORS.textMuted}
              />
            </TouchableOpacity>

            {/* Credit Card Reminders & Notifications Controls */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'إعدادات تنبيهات سداد الكروت 🔔' : 'Credit Card Due Reminders 🔔'}
            </Text>

            <View style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="bell-alert-outline" size={20} color="#DC2626" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.settingTitle}>
                    {isArabic
                      ? 'تنبيه سداد الكروت عند فتح التطبيق'
                      : 'Startup Credit Card Due Alert'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'إظهار نافذة التذكير بمستحقات الكروت تلقائياً عند بداية تشغيل التطبيق'
                      : 'Automatically show due card amounts popup when opening the app'}
                  </Text>
                </View>
              </View>
              <Switch
                value={alertPrefs?.startupAlertEnabled !== false}
                onValueChange={(val) => updateAlertPrefs({ startupAlertEnabled: val })}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={alertPrefs?.startupAlertEnabled !== false ? '#059669' : '#64748B'}
              />
            </View>

            <View style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="cellphone-message" size={20} color="#D97706" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.settingTitle}>
                    {isArabic
                      ? 'إشعارات الهاتف من يوم 20 إلى 25 بالشهر'
                      : 'Phone Notifications (20th to 25th of Month)'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'إرسال تذكير يومي الساعة 12:00 ظهراً من يوم 20 حتى 25 بمستحقات الكروت'
                      : 'Daily phone notification at 12:00 PM from the 20th to 25th'}
                  </Text>
                </View>
              </View>
              <Switch
                value={alertPrefs?.phoneNotificationsEnabled !== false}
                onValueChange={(val) => updateAlertPrefs({ phoneNotificationsEnabled: val })}
                trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                thumbColor={alertPrefs?.phoneNotificationsEnabled !== false ? '#059669' : '#64748B'}
              />
            </View>

            {/* Zero-Out Credit Card Dues Button */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleZeroOutCreditCards}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="credit-card-refund-outline" size={22} color="#DC2626" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#991B1B', fontWeight: '800' }]}>
                    {isArabic ? 'تصفير مستحقات بطاقات الائتمان 💳' : 'Zero-Out Credit Card Dues 💳'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? `إجمالي المستحق حالياً: ${formatAmount(balances.totalCcDebt)} ${currency.symbol} • اضغط لتصفير مديونية الكروت بالكامل`
                      : `Current Dues: ${formatAmount(balances.totalCcDebt)} ${currency.symbol} • Tap to zero out card debts`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#DC2626"
              />
            </TouchableOpacity>

            {/* Preference Settings Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'التفضيلات المالية والبنوك والشهر الجديد' : 'Financial Preferences, Banks & New Month'}
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={() => setBudgetModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="calendar-plus" size={20} color="#1D4ED8" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#1E3A8A' }]}>
                    {isArabic ? 'تعديل يدوي للشهر الجديد' : 'Manual Edit for New Month'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? `ضبط وتعديل يدوي لأرصدة البداية وتواريخ الدورة (${balances?.cycleStartDate} إلى ${balances?.cycleEndDate}) والعملة`
                      : `Manually configure starting balances, cycle dates (${balances?.cycleStartDate} to ${balances?.cycleEndDate}) & currency`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#1D4ED8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={() => setBanksModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="bank-plus" size={20} color="#059669" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.settingTitle}>
                    {isArabic
                      ? 'إضافة وإدارة البنوك والكروت (CC / DC حساب بنكي)'
                      : 'Add & Manage Banks & Cards (CC / DC Bank Account)'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? `أضف أي بنك أو كارت ائتمان أو حساب بنكي DC (${(customAccounts || []).length} مضاف)`
                      : `Add custom Credit Cards or DC Bank Accounts (${(customAccounts || []).length} custom added)`}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {/* Category Budgets & Overspending Alerts */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => setCategoryBudgetsModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FDE68A' }]}>
                  <MaterialCommunityIcons name="target" size={22} color="#D97706" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#B45309', fontWeight: '800' }]}>
                    {isArabic ? 'ميزانيات البنود وتنبيهات التجاوز 🎯' : 'Category Budgets & Alerts 🎯'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'حدد حداً أقصى للمصاريف (طعام، فواتير، مواصلات، إلخ) مع تنبيه فوري عند التجاوز'
                      : 'Set monthly limits per category with instant warning alerts upon overspending'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#D97706"
              />
            </TouchableOpacity>

            {/* Dedicated Rollover & Open New Month Button */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderColor: '#2563EB', backgroundColor: '#EFF6FF', borderWidth: 2 },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleOpenRollover}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#2563EB' }]}>
                  <MaterialCommunityIcons name="calendar-sync" size={22} color="#FFFFFF" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#1D4ED8', fontSize: 16, fontWeight: '800' }]}>
                    {isArabic ? 'ترحيل وفتح شهر جديد 🗓️' : 'Rollover & Open New Month 🗓️'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'حفظ معاملات الشهر في أرشيف الشهور وتصفير السجلات وترحيل الكاش ومستحقات الكروت'
                      : 'Archive past month to history, reset logs, and roll over cash & CC dues'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={22}
                color="#2563EB"
              />
            </TouchableOpacity>

            {/* Full App Backup & Restore Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'النسخ الاحتياطي والاستعادة 💾' : 'Backup & Restore 💾'}
            </Text>

            {/* Save Backup to Device / Mobile Folder */}
            <TouchableOpacity
              style={[styles.settingItem, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleSaveBackupToDevice}
              disabled={backupBusy}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#22C55E' }]}>
                  <MaterialCommunityIcons name="folder-download" size={22} color="#FFFFFF" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#15803D', fontWeight: '800' }]}>
                    {isArabic ? 'حفظ نسخة احتياطية على الموبايل 💾' : 'Save Backup to Phone Folder 💾'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'اختر مجلداً في ذاكرة الموبايل أو بطاقة الذاكرة لحفظ ملف النسخة الاحتياطية'
                      : 'Choose any folder on device or SD card to save the backup file'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#15803D"
              />
            </TouchableOpacity>

            {/* Share Backup File */}
            <TouchableOpacity
              style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleShareBackupFile}
              disabled={backupBusy}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="share-variant" size={20} color="#7C3AED" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#5B21B6' }]}>
                    {isArabic ? 'مشاركة / إرسال ملف النسخة الاحتياطية 📤' : 'Share / Export Backup File 📤'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'إرسال ملف النسخة (.json) عبر واتساب أو جوجل درايف أو البريد'
                      : 'Send .json backup file via WhatsApp, Drive, or Email'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#7C3AED"
              />
            </TouchableOpacity>

            {/* Export All Records to Excel (.xlsx) */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                { borderColor: '#10B981', backgroundColor: '#ECFDF5', borderWidth: 2 },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleExportAllToExcel}
              disabled={backupBusy}
              activeOpacity={0.8}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#059669' }]}>
                  <MaterialCommunityIcons name="file-excel-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#065F46', fontWeight: '800', fontSize: 15 }]}>
                    {isArabic ? 'تصدير كافة السجلات إلى إكسيل (.xlsx) 📊' : 'Export All Records to Excel (.xlsx) 📊'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'إنشاء ملف إكسيل حقيقي باسم "مصروفاتي_[تاريخ_اليوم].xlsx" وحفظه بمجلد تختاره بالموبايل أو مشاركته'
                      : 'Generate true .xlsx file "مصروفاتي_[date].xlsx" and save to folder or share'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={22}
                color="#059669"
              />
            </TouchableOpacity>

            {/* Restore Backup */}
            <TouchableOpacity
              style={[styles.settingItem, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleRestoreBackup}
              disabled={backupBusy}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#D97706' }]}>
                  <MaterialCommunityIcons name="file-upload" size={22} color="#FFFFFF" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: '#B45309', fontWeight: '800' }]}>
                    {isArabic ? 'استعادة نسخة احتياطية من الهاتف 📥' : 'Restore Backup from File 📥'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'حدد ملف النسخة الاحتياطية (.json) لاستعادة كافة المعاملات وأرشيف الشهور'
                      : 'Pick a .json backup file to restore all transactions and history'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color="#B45309"
              />
            </TouchableOpacity>

            {/* Data Tools Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'البيانات والتقارير' : 'Data & Reports'}
            </Text>

            <TouchableOpacity
              style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleShareSummary}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="share-variant-outline" size={20} color="#8B5CF6" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.settingTitle}>
                    {isArabic ? 'مشاركة الملخص المالي' : 'Share Financial Summary'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'إرسال التقرير الشهري عبر واتساب أو نسخه كنص'
                      : 'Export monthly summary via WhatsApp or copy text'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleResetSampleData}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="database-refresh-outline" size={20} color="#D97706" />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.settingTitle}>
                    {isArabic ? 'تسكين بيانات وهمية لتجربة التطبيق' : 'Load Mock Data for Testing'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'تحميل معاملات وأرصدة تجريبية لاختبار شاشات وميزات التطبيق'
                      : 'Populate sample transactions and balances for app testing'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <View style={[styles.settingRight, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconBox, { backgroundColor: COLORS.expenseLight }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.expense} />
                </View>
                <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.settingTitle, { color: COLORS.expense }]}>
                    {isArabic ? 'مسح جميع البيانات' : 'Clear All Data'}
                  </Text>
                  <Text style={styles.settingSubtitle}>
                    {isArabic
                      ? 'حذف كل المعاملات المسجلة والبدء من جديد'
                      : 'Delete all recorded transactions and start fresh'}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={isArabic ? 'chevron-left' : 'chevron-right'}
                size={20}
                color={COLORS.expense}
              />
            </TouchableOpacity>

            {/* About App Section */}
            <Text style={[styles.sectionHeader, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'عن التطبيق' : 'About App'}
            </Text>
            <View style={styles.aboutCard}>
              <View style={[styles.aboutHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={styles.aboutLogo}>
                  <MaterialCommunityIcons name="wallet" size={24} color={COLORS.textWhite} />
                </View>
                <View style={[{ flex: 1 }, isArabic ? { alignItems: 'flex-end', marginRight: 10 } : { alignItems: 'flex-start', marginLeft: 10 }]}>
                  <Text style={[styles.aboutName, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'U3mXpns - متتبع المصروفات والكروت' : 'U3mXpns - Expense & Card Tracker'}
                  </Text>
                  <Text style={[styles.aboutVersion, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'الإصدار 2.5.0 للأندرويد (عربي / English)' : 'Version 2.5.0 for Android (EN / AR)'}
                  </Text>
                  <Text style={[{ fontSize: 11.5, fontWeight: '800', color: COLORS.primaryDark, marginTop: 3 }, isArabic && { textAlign: 'right' }]}>
                    Developed by Yousry Mahmoud Naiem
                  </Text>
                </View>
              </View>
              <View style={styles.aboutDivider} />
              <Text style={[styles.aboutDesc, isArabic ? { textAlign: 'right' } : { textAlign: 'left' }]}>
                {isArabic
                  ? 'تطبيق شخصي سريع ويعمل 100% بدون إنترنت لإدارة الكاش المتاح (Available Cash) والحساب البنكي (DC / حساب بنكي) وبطاقات الائتمان وفترة السماح ومواعيد السداد مع تحليلات لحظية شاملة.'
                  : 'A fast, 100% offline personal finance & multi-bank card tracker designed to manage your Available Cash, DC / Bank Accounts, and Credit Card grace periods with real-time Insights.'}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 14,
    textAlign: 'left',
  },
  languageCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  langBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dangerItem: {
    borderColor: '#FECACA',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  aboutLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  aboutVersion: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
    width: '100%',
  },
  aboutDesc: {
    fontSize: 11.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
});
