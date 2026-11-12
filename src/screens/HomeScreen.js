import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
  useWindowDimensions,
  DevSettings,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { BalanceCard } from '../components/BalanceCard';
import { TopSpendingChart } from '../components/TopSpendingChart';
import { TransactionItem } from '../components/TransactionItem';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { SetBudgetModal } from '../components/SetBudgetModal';
import { ManageBanksModal } from '../components/ManageBanksModal';
import { RolloverModal } from '../components/RolloverModal';
import { ExcelSheetEntryModal } from '../components/ExcelSheetEntryModal';
import { VoiceQueryModal } from '../components/VoiceQueryModal';
import { ManageCategoriesModal } from '../components/ManageCategoriesModal';

export const HomeScreen = ({ onNavigateToHistory, onNavigateToSettings }) => {
  const {
    monthTransactions,
    balances,
    currency,
    formatAmount,
    isLoading,
    isArabic,
    toggleLanguage,
    isDarkMode,
    toggleDarkMode,
    themeColors,
    alertPrefs,
    updateAlertPrefs,
  } = useExpense();

  const { width: winWidth } = useWindowDimensions();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [modalTargetCard, setModalTargetCard] = useState('cc_ar');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [rolloverModalVisible, setRolloverModalVisible] = useState(false);
  const [banksModalVisible, setBanksModalVisible] = useState(false);
  const [excelSheetVisible, setExcelSheetVisible] = useState(false);
  const [dueReminderVisible, setDueReminderVisible] = useState(false);
  const [voiceQueryVisible, setVoiceQueryVisible] = useState(false);
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);
  const hasShownStartupAlert = useRef(false);

  // Show startup Credit Card due-date reminder modal once data is loaded (only if startupAlertEnabled is true)
  useEffect(() => {
    if (
      !isLoading &&
      !hasShownStartupAlert.current &&
      balances.totalCcDebt > 0 &&
      alertPrefs?.startupAlertEnabled !== false
    ) {
      hasShownStartupAlert.current = true;
      setDueReminderVisible(true);
    }
  }, [isLoading, balances.totalCcDebt, balances.totalCcDueThisMonth, alertPrefs?.startupAlertEnabled]);

  const openAddExpense = () => {
    setModalType('expense');
    setModalVisible(true);
  };

  const openAddIncome = () => {
    setModalType('income');
    setModalVisible(true);
  };

  const openPayCc = (cardId = 'cc_ar') => {
    setModalType('cc_pyd');
    setModalTargetCard(cardId);
    setModalVisible(true);
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

  // Recent 6 transactions (already sorted newest-first at the top)
  const recentTransactions = monthTransactions.slice(0, 6);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: themeColors.background }]}>
      <View style={[styles.container, isDarkMode && { backgroundColor: themeColors.background }]}>
        {/* Top App Header Area */}
        <View style={[styles.headerContainer, isDarkMode && { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
          {/* Top Row: App Logo & Name (مصروفي with U3mXpns underneath) + Settings Button */}
          <View style={[styles.brandingRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.branding, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={styles.appLogoCircle}>
                <MaterialCommunityIcons name="wallet" size={20} color={COLORS.textWhite} />
              </View>
              <View style={[styles.nameCol, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={[styles.appNameAr, isDarkMode && { color: themeColors.primary }]}>مصروفي</Text>
                <Text style={[styles.appNameSub, isDarkMode && { color: themeColors.textSecondary }]}>U3mXpns</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Dark Mode Quick Toggle */}
              <TouchableOpacity
                style={[
                  styles.settingsHeaderBtn,
                  { backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#F1F5F9', borderColor: isDarkMode ? themeColors.border : '#E2E8F0' },
                ]}
                onPress={toggleDarkMode}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                  size={20}
                  color={isDarkMode ? '#FDE047' : '#475569'}
                />
              </TouchableOpacity>

              {onNavigateToSettings && (
                <TouchableOpacity
                  style={[
                    styles.settingsHeaderBtn,
                    { backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#F1F5F9', borderColor: isDarkMode ? themeColors.border : '#E2E8F0' },
                  ]}
                  onPress={onNavigateToSettings}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="cog-outline" size={20} color={isDarkMode ? '#A1A1AA' : COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bottom Row: Navigation & Action Tabs cleanly positioned underneath */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.actionTabsContent,
              isArabic && { flexDirection: 'row-reverse' },
            ]}
            style={styles.actionTabsScroll}
          >
            {/* Manage & Delete Categories Button */}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? themeColors.purpleLight : '#FAF5FF',
                  borderColor: isDarkMode ? '#5B4B8A' : '#D8B4FE',
                  paddingHorizontal: 9,
                },
              ]}
              onPress={() => setManageCategoriesVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="shape-outline" size={15} color={isDarkMode ? themeColors.purple : '#7C3AED'} />
              <Text style={[styles.syncBtnText, { color: isDarkMode ? themeColors.purple : '#7C3AED', fontWeight: '800' }]}>
                {isArabic ? 'إدارة وحذف البنود 🏷️' : 'Manage Categories 🏷️'}
              </Text>
            </TouchableOpacity>
            {/* Instant Language Switcher Button (EN <-> AR) */}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? themeColors.indigoLight : '#EEF2FF',
                  borderColor: isDarkMode ? '#4B5282' : '#C7D2FE',
                  paddingHorizontal: 8,
                },
              ]}
              onPress={toggleLanguage}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="translate" size={15} color={isDarkMode ? themeColors.indigo : '#4F46E5'} />
              <Text style={[styles.syncBtnText, { color: isDarkMode ? themeColors.indigo : '#4F46E5' }]}>
                {isArabic ? 'English' : 'عربي'}
              </Text>
            </TouchableOpacity>

            {/* Quick "ترحيل وشهر جديد" Button */}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? themeColors.infoLight : '#EFF6FF',
                  borderColor: isDarkMode ? '#3B5984' : '#2563EB',
                  paddingHorizontal: 9,
                },
              ]}
              onPress={handleOpenRollover}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="calendar-sync" size={15} color={isDarkMode ? themeColors.info : '#1D4ED8'} />
              <Text style={[styles.syncBtnText, { color: isDarkMode ? themeColors.info : '#1D4ED8', fontWeight: '800' }]}>
                {isArabic ? 'ترحيل وشهر جديد' : 'Rollover Month'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? themeColors.primaryLight : '#F0FDF4',
                  borderColor: isDarkMode ? '#2D6A56' : '#BBF7D0',
                  paddingHorizontal: 8,
                },
              ]}
              onPress={() => setBanksModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="bank-plus" size={15} color={isDarkMode ? themeColors.primary : '#059669'} />
              <Text style={[styles.syncBtnText, { color: isDarkMode ? themeColors.primary : '#059669' }]}>
                {isArabic ? '+ بنك/كارت' : '+ Bank/Card'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? themeColors.expenseLight : '#FEF2F2',
                  borderColor: isDarkMode ? '#7A3E43' : '#FECACA',
                  paddingHorizontal: 8,
                },
              ]}
              onPress={() => setDueReminderVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={alertPrefs?.startupAlertEnabled === false && alertPrefs?.phoneNotificationsEnabled === false ? 'bell-off-outline' : 'bell-ring-outline'}
                size={15}
                color={isDarkMode ? themeColors.expense : '#DC2626'}
              />
              <Text style={[styles.syncBtnText, { color: isDarkMode ? themeColors.expense : '#DC2626' }]}>
                {isArabic ? 'التنبيه' : 'CC Alert'}
              </Text>
            </TouchableOpacity>

            {/* Instant Voice Query for Today & Yesterday */}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? themeColors.purpleLight : '#F5F3FF',
                  borderColor: isDarkMode ? '#5B4B8A' : '#DDD6FE',
                  paddingHorizontal: 9,
                },
              ]}
              onPress={() => setVoiceQueryVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="microphone-message" size={15} color="#7C3AED" />
              <Text style={[styles.syncBtnText, { color: '#7C3AED', fontWeight: '800' }]}>
                {isArabic ? 'استعلام صوتي 🎙️' : 'Voice Query 🎙️'}
              </Text>
            </TouchableOpacity>

            {/* Dark Mode Pill */}
            <TouchableOpacity
              style={[
                styles.syncBtn,
                {
                  backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                  borderColor: isDarkMode ? '#475569' : '#CBD5E1',
                  paddingHorizontal: 9,
                },
              ]}
              onPress={toggleDarkMode}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isDarkMode ? 'weather-sunny' : 'weather-night'}
                size={15}
                color={isDarkMode ? '#FDE047' : '#334155'}
              />
              <Text style={[styles.syncBtnText, { color: isDarkMode ? '#F8FAFC' : '#334155', fontWeight: '700' }]}>
                {isDarkMode ? (isArabic ? 'نهاري ☀️' : 'Light ☀️') : (isArabic ? 'ليلي 🌙' : 'Dark 🌙')}
              </Text>
            </TouchableOpacity>

            {/* Quick Reload Button */}
            <TouchableOpacity
              style={[styles.syncBtn, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', paddingHorizontal: 8 }]}
              onPress={() => {
                try {
                  if (typeof DevSettings !== 'undefined' && DevSettings.reload) {
                    DevSettings.reload();
                  }
                } catch {}
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="reload" size={14} color="#334155" />
              <Text style={[styles.syncBtnText, { color: '#334155' }]}>
                {isArabic ? 'تحديث' : 'Reload'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Scrollable Screen Content */}
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={{ width: '100%' }}>
            {/* Main Balance Card (Spent Amount Spotlight, Net Available + Monthly Consumption %, Accounts Grid) */}
            <BalanceCard
              onOpenAddExpense={openAddExpense}
              onOpenAddIncome={openAddIncome}
              onOpenExcelSheet={() => setExcelSheetVisible(true)}
              onOpenPayCc={openPayCc}
            />

              {/* Cycle Starting Capital & New Month Rollover Card */}
              <TouchableOpacity
                style={[
                  styles.startFundsCard,
                  SHADOWS.small,
                  isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                ]}
                onPress={() => setCycleModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={[styles.startFundsHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.startFundsTitle, isDarkMode && { color: themeColors.textPrimary }]}>
                    {isArabic ? 'بيانات الشهر والتواريخ' : 'Month Data & Dates'}
                  </Text>
                  <View style={[styles.dateBadge, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: '#1E1B4B' }]}>
                    <MaterialCommunityIcons name="calendar-range" size={14} color={isDarkMode ? '#A5B4FC' : '#3730A3'} />
                    <Text style={[styles.dateBadgeText, isDarkMode && { color: '#C7D2FE' }]}>
                      {isArabic
                        ? `${balances.cycleStartDate} ⬅️ ${balances.cycleEndDate} ✎`
                        : `${balances.cycleStartDate} ➡️ ${balances.cycleEndDate} ✎`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.startFundsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={styles.startItem}>
                    <Text style={[styles.startItemVal, isDarkMode && { color: themeColors.textPrimary }]}>{formatAmount(balances.startCsh)} {currency.symbol}</Text>
                    <Text style={[styles.startItemLbl, isDarkMode && { color: themeColors.textSecondary }]}>
                      {isArabic ? 'كاش متاح (بداية)' : 'Available Cash (Start)'}
                    </Text>
                  </View>

                  <View style={[styles.startItemDivider, isDarkMode && { backgroundColor: themeColors.border }]} />

                  <View style={styles.startItem}>
                    <Text style={[styles.startItemVal, isDarkMode && { color: themeColors.textPrimary }]}>{formatAmount(balances.startDc)} {currency.symbol}</Text>
                    <Text style={[styles.startItemLbl, isDarkMode && { color: themeColors.textSecondary }]}>
                      {isArabic ? 'DC / حساب بنكي' : 'DC / Bank Account'}
                    </Text>
                  </View>

                  <View style={[styles.startItemDivider, isDarkMode && { backgroundColor: themeColors.border }]} />

                  <View style={styles.startItem}>
                    <Text style={[styles.startItemVal, { color: COLORS.primaryDark }, isDarkMode && { color: themeColors.primary }]}>
                      {formatAmount(balances.totalStartedWith)} {currency.symbol}
                    </Text>
                    <Text style={[styles.startItemLbl, isDarkMode && { color: themeColors.textSecondary }]}>
                      {isArabic ? 'إجمالي البداية' : 'Total Starting Base'}
                    </Text>
                  </View>
                </View>

                {/* Direct "شهر جديد" Button right inside the Cycle Card */}
                <View
                  style={[
                    {
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#F1F5F9',
                      flexDirection: isArabic ? 'row-reverse' : 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', flex: 1, textAlign: isArabic ? 'right' : 'left' }}>
                    {isArabic
                      ? 'اضغط لبدء شهر جديد وترحيل الكاش ومستحقات الكروت تلقائياً'
                      : 'Tap to start a new month & auto-rollover remaining Cash & CC dues'}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#2563EB',
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                      flexDirection: isArabic ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                    onPress={handleOpenRollover}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="calendar-sync" size={15} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
                      {isArabic ? 'ترحيل وشهر جديد' : 'Rollover'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Top Spending Categories Visual Chart */}
              <TopSpendingChart onSeeAll={onNavigateToHistory} />

              {/* Recent Transactions Section (Ordered Newest to Oldest from the Top) */}
              <View style={[styles.sectionHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {isArabic ? 'أحدث المعاملات (الأحدث أولاً)' : 'Recent Transactions'}
                </Text>
                <TouchableOpacity onPress={onNavigateToHistory} style={styles.seeAllBadge} activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>
                    {isArabic ? `عرض الكل (${monthTransactions.length})` : `View All (${monthTransactions.length})`}
                  </Text>
                </TouchableOpacity>
              </View>

              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    item={tx}
                    onEdit={(selectedTx) => {
                      setEditingTransaction(selectedTx);
                      setModalType(selectedTx.type || 'expense');
                      setModalVisible(true);
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={48}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyTitle}>
                    {isArabic ? 'لا توجد معاملات مسجلة في هذا الشهر' : 'No Transactions in This Month'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {isArabic ? 'اضغط على "تسجيل مصروف" لإضافة أول معاملة' : 'Tap "Add Expense" to log your first transaction'}
                  </Text>
                </View>
              )}

              <View style={{ height: 40 }} />
            </View>
        </ScrollView>

        {/* Manage & Delete Categories Modal */}
        <ManageCategoriesModal
          visible={manageCategoriesVisible}
          onClose={() => setManageCategoriesVisible(false)}
        />

        {/* Add / Edit Modal */}
        <AddTransactionModal
          visible={modalVisible}
          initialType={modalType}
          initialTargetCard={modalTargetCard}
          editingTransaction={editingTransaction}
          onClose={() => {
            setModalVisible(false);
            setEditingTransaction(null);
          }}
        />

        {/* Cycle & Starting Balances Modal */}
        <SetBudgetModal
          visible={cycleModalVisible}
          onClose={() => setCycleModalVisible(false)}
        />

        {/* Rollover & Open New Month Modal */}
        <RolloverModal
          visible={rolloverModalVisible}
          onClose={() => setRolloverModalVisible(false)}
        />

        {/* Manage Custom Banks & Cards Modal */}
        <ManageBanksModal
          visible={banksModalVisible}
          onClose={() => setBanksModalVisible(false)}
        />

        {/* Excel Sheet Entry Modal */}
        <ExcelSheetEntryModal
          visible={excelSheetVisible}
          onClose={() => setExcelSheetVisible(false)}
        />

        {/* Startup Credit Card Due Reminder Modal */}
        <Modal
          visible={dueReminderVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDueReminderVisible(false)}
        >
          <View style={styles.reminderOverlay}>
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={styles.reminderScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={[styles.reminderBox, SHADOWS.medium]}>
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderIconCircle}>
                    <MaterialCommunityIcons name="bell-ring" size={20} color="#DC2626" />
                  </View>
                  <Text style={styles.reminderTitle}>
                    {isArabic ? 'تنبيه سداد بطاقات الائتمان 💳' : 'Credit Card Payment Reminder 💳'}
                  </Text>
                  <Text style={styles.reminderSubtitle}>
                    {isArabic
                      ? 'الأيام المتبقية والمبالغ المستحقة قبل يوم 25'
                      : 'Remaining days & amounts due before the 25th'}
                  </Text>
                </View>

                {/* Due This Month (before 25th of Current Month) */}
                {balances.totalCcDueThisMonth > 0 && (
                  <View style={styles.reminderSectionUrgent}>
                    <Text style={[styles.reminderSectionTitleUrgent, isArabic && { textAlign: 'right' }]}>
                      {isArabic
                        ? `مستحق السداد قبل ${balances.currentMonthDueDate}`
                        : `Due before ${balances.currentMonthDueDate}`}
                    </Text>

                    <View style={[styles.reminderAmountRow, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Text style={styles.reminderMainAmountUrgent}>
                        {formatAmount(balances.totalCcDueThisMonth)} {currency.symbol}
                      </Text>
                      <Text style={styles.reminderDaysBadgeUrgent}>
                        {isArabic
                          ? `باقي ${balances.daysUntilCurrentDue} يوم ⏳`
                          : `${balances.daysUntilCurrentDue} days left ⏳`}
                      </Text>
                    </View>

                    {balances.ccArDueThisMonth > 0 && (
                      <Text style={[styles.reminderDetailTextUrgent, isArabic && { textAlign: 'right' }]}>
                        {isArabic
                          ? `• البنك العربي (CC AR): ${formatAmount(balances.ccArDueThisMonth)} ${currency.symbol}`
                          : `• Arab Bank (CC AR): ${formatAmount(balances.ccArDueThisMonth)} ${currency.symbol}`}
                      </Text>
                    )}
                    {balances.ccCaDueThisMonth > 0 && (
                      <Text style={[styles.reminderDetailTextUrgent, isArabic && { textAlign: 'right' }]}>
                        {isArabic
                          ? `• كريدي أجريكول (CC CA): ${formatAmount(balances.ccCaDueThisMonth)} ${currency.symbol}`
                          : `• Crédit Agricole (CC CA): ${formatAmount(balances.ccCaDueThisMonth)} ${currency.symbol}`}
                      </Text>
                    )}
                    {(balances.customCreditCardsSummary || [])
                      .filter((c) => c.dueThisMonth > 0)
                      .map((c) => (
                        <Text key={c.id} style={[styles.reminderDetailTextUrgent, isArabic && { textAlign: 'right' }]}>
                          • {c.bankName} (CC): {formatAmount(c.dueThisMonth)} {currency.symbol}
                        </Text>
                      ))}
                  </View>
                )}

                {/* Due Next Month (before 25th of Next Month - Grace Period) */}
                {balances.totalCcDueNextMonth > 0 && (
                  <View style={styles.reminderSectionNext}>
                    <Text style={[styles.reminderSectionTitleNext, isArabic && { textAlign: 'right' }]}>
                      {isArabic
                        ? `مستحق قبل ${balances.nextMonthDueDate} (فترة سماح)`
                        : `Due before ${balances.nextMonthDueDate} (Grace Period)`}
                    </Text>

                    <View style={[styles.reminderAmountRow, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Text style={styles.reminderMainAmountNext}>
                        {formatAmount(balances.totalCcDueNextMonth)} {currency.symbol}
                      </Text>
                      <Text style={styles.reminderDaysBadgeNext}>
                        {isArabic
                          ? `باقي ${balances.daysUntilNextDue} يوم ⏳`
                          : `${balances.daysUntilNextDue} days left ⏳`}
                      </Text>
                    </View>

                    {balances.ccCaDueNextMonth > 0 && (
                      <Text style={[styles.reminderDetailText, isArabic && { textAlign: 'right' }]}>
                        {isArabic
                          ? `• كريدي أجريكول (CC CA): ${formatAmount(balances.ccCaDueNextMonth)} ${currency.symbol}`
                          : `• Crédit Agricole (CC CA): ${formatAmount(balances.ccCaDueNextMonth)} ${currency.symbol}`}
                      </Text>
                    )}
                    {balances.ccArDueNextMonth > 0 && (
                      <Text style={[styles.reminderDetailText, isArabic && { textAlign: 'right' }]}>
                        {isArabic
                          ? `• البنك العربي (CC AR): ${formatAmount(balances.ccArDueNextMonth)} ${currency.symbol}`
                          : `• Arab Bank (CC AR): ${formatAmount(balances.ccArDueNextMonth)} ${currency.symbol}`}
                      </Text>
                    )}
                    {(balances.customCreditCardsSummary || [])
                      .filter((c) => c.dueNextMonth > 0)
                      .map((c) => (
                        <Text key={c.id} style={[styles.reminderDetailText, isArabic && { textAlign: 'right' }]}>
                          • {c.bankName} (CC): {formatAmount(c.dueNextMonth)} {currency.symbol}
                        </Text>
                      ))}
                  </View>
                )}

                {/* Toggle Controls to Turn Off Startup Alert & Phone Notifications (Days 20-25) */}
                <View style={styles.alertTogglesBox}>
                  <View style={[styles.toggleRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.toggleLabel, isArabic && { textAlign: 'right' }]}>
                      {isArabic
                        ? 'إظهار هذا التنبيه عند فتح التطبيق'
                        : 'Show this reminder on app startup'}
                    </Text>
                    <Switch
                      value={alertPrefs?.startupAlertEnabled !== false}
                      onValueChange={(val) => updateAlertPrefs({ startupAlertEnabled: val })}
                      trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                      thumbColor={alertPrefs?.startupAlertEnabled !== false ? '#059669' : '#64748B'}
                    />
                  </View>

                  <View style={[styles.toggleRow, { marginTop: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.toggleLabel, isArabic && { textAlign: 'right' }]}>
                      {isArabic
                        ? 'إشعارات الموبايل من يوم 20 إلى 25 (12 ظهراً)'
                        : 'Phone notifications days 20–25 (12:00 PM)'}
                    </Text>
                    <Switch
                      value={alertPrefs?.phoneNotificationsEnabled !== false}
                      onValueChange={(val) => updateAlertPrefs({ phoneNotificationsEnabled: val })}
                      trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                      thumbColor={alertPrefs?.phoneNotificationsEnabled !== false ? '#059669' : '#64748B'}
                    />
                  </View>
                </View>

                {/* Quick Pay Action inside Reminder */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#059669',
                    borderRadius: 14,
                    paddingVertical: 11,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    gap: 6,
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setDueReminderVisible(false);
                    openPayCc(balances.ccCaDueThisMonth > 0 ? 'cc_ca' : 'cc_ar');
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="credit-card-check" size={17} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                    {isArabic ? 'سداد مستحقات الكروت الآن 💳' : 'Pay Credit Cards Now 💳'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reminderConfirmBtn}
                  onPress={() => setDueReminderVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reminderConfirmText}>
                    {isArabic ? 'تمام، إغلاق 👍' : 'Got it, Close 👍'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
        {/* Voice Query Assistant Modal (Today & Yesterday Expenses) */}
        <VoiceQueryModal
          visible={voiceQueryVisible}
          onClose={() => setVoiceQueryVisible(false)}
          onOpenAddExpense={openAddExpense}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameCol: {
    justifyContent: 'center',
  },
  appNameAr: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
    lineHeight: 25,
  },
  appNameSub: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
    lineHeight: 25,
    letterSpacing: 0.5,
  },
  settingsHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTabsScroll: {
    marginTop: 2,
  },
  actionTabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 8,
  },
  appName: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  appLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  startFundsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  startFundsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  startFundsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3730A3',
  },
  startFundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startItem: {
    flex: 1,
    alignItems: 'center',
  },
  startItemVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  startItemLbl: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  startItemDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  seeAllBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  reminderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  reminderScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  reminderBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reminderHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  reminderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  reminderSubtitle: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  reminderSectionUrgent: {
    backgroundColor: '#881337', // أحمر قاني / أحمر غامق
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#700D28',
    marginBottom: 8,
  },
  reminderSectionNext: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 9,
  },
  reminderAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  reminderRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  reminderSectionTitleUrgent: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reminderSectionTitleNext: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  reminderDaysBadgeUrgent: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  reminderDaysBadgeNext: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  reminderMainAmountUrgent: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  reminderMainAmountNext: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#D97706',
    textAlign: 'left',
  },
  reminderDetailTextUrgent: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#FEE2E2',
    textAlign: 'left',
    marginTop: 1,
    lineHeight: 13,
  },
  reminderDetailText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'left',
    marginTop: 1,
    lineHeight: 13,
  },
  alertTogglesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  reminderConfirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reminderConfirmText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
