import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { TransactionItem } from '../components/TransactionItem';
import { getCategoryById, getPaymentMethodById } from '../constants/categories';
import { saveExcelToChosenFolder, shareExcelFile } from '../utils/excelHelper';

export const HistoryScreen = () => {
  const {
    transactions,
    currency,
    formatAmount,
    language,
    isArabic,
    isCreditCardMethod,
    getAccountById,
    archivedMonths,
    deleteArchivedMonth,
    isDarkMode,
    themeColors,
  } = useExpense();
  const { width: winWidth } = useWindowDimensions();

  // Tab: 'current' (current cycle transactions) vs 'archive' (archived past months history file)
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'cards', 'income'

  // Modal to inspect a selected archived month's full transactions
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveSearch, setArchiveSearch] = useState('');

  // Filtered transactions for CURRENT month (always sorted newest-first)
  const filteredList = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType === 'expense') {
        if (t.type === 'income' || t.type === 'switch' || t.categoryId === 'switch') return false;
      } else if (filterType === 'cards') {
        const isCardTx =
          (isCreditCardMethod && isCreditCardMethod(t.paymentMethod)) ||
          t.paymentMethod === 'cc_ar' ||
          t.paymentMethod === 'cc_ca' ||
          t.type === 'cc_pyd' ||
          t.categoryId === 'cc_pyd';
        if (!isCardTx) return false;
      } else if (filterType === 'income') {
        if (t.type !== 'income' && t.categoryId !== 'incomings') return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const category = getCategoryById(t.categoryId, language);
        const payment = getAccountById ? getAccountById(t.paymentMethod) : getPaymentMethodById(t.paymentMethod, language);
        const matchNote = (t.note || '').toLowerCase().includes(query);
        const matchCategory = (category.displayName || '').toLowerCase().includes(query);
        const matchPayment = (payment?.displayName || '').toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query);
        return matchNote || matchCategory || matchPayment || matchAmount;
      }

      return true;
    });
  }, [transactions, filterType, searchQuery, language]);

  // Total for current filtered results (excluding internal switch transfers)
  const totalAmount = useMemo(() => {
    return filteredList.reduce((acc, t) => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'switch' || t.categoryId === 'switch') return acc;
      return t.type === 'income' ? acc + amt : acc - amt;
    }, 0);
  }, [filteredList]);

  // Filtered transactions for SELECTED ARCHIVED month
  const selectedArchiveFilteredTxs = useMemo(() => {
    if (!selectedArchive || !selectedArchive.transactions) return [];
    if (!archiveSearch.trim()) return selectedArchive.transactions;
    const q = archiveSearch.trim().toLowerCase();
    return selectedArchive.transactions.filter((t) => {
      const matchNote = (t.note || '').toLowerCase().includes(q);
      const matchAmt = (t.amount || '').toString().includes(q);
      return matchNote || matchAmt;
    });
  }, [selectedArchive, archiveSearch]);

  const handleDeleteArchive = (item) => {
    Alert.alert(
      isArabic ? 'حذف هذا الشهر من الأرشيف' : 'Delete Archived Month',
      isArabic
        ? `هل أنت متأكد من حذف سجل الشهر (${item.cycleStartDate} إلى ${item.cycleEndDate}) نهائياً؟`
        : `Delete archive for ${item.cycleStartDate} to ${item.cycleEndDate} permanently?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، حذف' : 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteArchivedMonth(item.id);
            if (selectedArchive?.id === item.id) setSelectedArchive(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, isDarkMode && { color: themeColors.textPrimary }]}>
          {activeTab === 'current'
            ? isArabic ? 'سجل المعاملات (من الأحدث للأقدم)' : 'Transaction History (Newest First)'
            : isArabic ? 'أرشيف الشهور السابقة (History File) 📁' : 'Past Months Archive (History File) 📁'}
        </Text>
      </View>

      {/* Top Segment Switcher: الشهر الحالي vs أرشيف الشهور */}
      <View style={[styles.tabSegmentContainer, isArabic && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity
          style={[styles.tabSegmentBtn, activeTab === 'current' && styles.tabSegmentBtnActive]}
          onPress={() => setActiveTab('current')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="calendar-today"
            size={16}
            color={activeTab === 'current' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.tabSegmentText, activeTab === 'current' && styles.tabSegmentTextActive]}>
            {isArabic ? `الشهر الحالي (${transactions.length})` : `Current Month (${transactions.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSegmentBtn, activeTab === 'archive' && styles.tabSegmentBtnActive]}
          onPress={() => setActiveTab('archive')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="archive-clock"
            size={16}
            color={activeTab === 'archive' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.tabSegmentText, activeTab === 'archive' && styles.tabSegmentTextActive]}>
            {isArabic ? `أرشيف الشهور (${archivedMonths.length})` : `History File (${archivedMonths.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'current' ? (
        /* CURRENT MONTH VIEW */
        <View style={styles.container}>
          {/* Search input */}
          <View style={[styles.searchBar, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.searchInput, isArabic ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}
              placeholder={
                isArabic
                  ? 'ابحث بالبند، الوصف، أو المبلغ...'
                  : 'Search by category, note, or amount...'
              }
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign={isArabic ? 'right' : 'left'}
            />
          </View>

          {/* Horizontally Scrollable Filter Pills */}
          <View style={{ marginBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterRow, isArabic && { flexDirection: 'row-reverse' }]}
            >
              <TouchableOpacity
                style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
                  {isArabic ? `الكل (${transactions.length})` : `All (${transactions.length})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filterType === 'expense' && styles.expenseChipActive]}
                onPress={() => setFilterType('expense')}
              >
                <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>
                  {isArabic ? 'مصروفات 🔻' : 'Expenses 🔻'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filterType === 'cards' && styles.expenseChipActive]}
                onPress={() => setFilterType('cards')}
              >
                <Text style={[styles.filterText, filterType === 'cards' && styles.filterTextActive]}>
                  {isArabic ? 'الكروت 💳' : 'Cards 💳'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filterType === 'income' && styles.incomeChipActive]}
                onPress={() => setFilterType('income')}
              >
                <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>
                  {isArabic ? 'الوارد 🔺' : 'Income 🔺'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Summary Info */}
          <View style={[styles.summaryRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.countText}>
              {isArabic ? `العدد: ${filteredList.length} معاملة (الأحدث بأعلى)` : `Showing: ${filteredList.length} (Newest at top)`}
            </Text>
            <Text style={styles.sumText}>
              {isArabic ? 'الصافي: ' : 'Net: '}
              {totalAmount >= 0 ? '+' : ''}{formatAmount(totalAmount)} {currency.symbol}
            </Text>
          </View>

          {/* Bidirectional (Vertical + Horizontal) Scrollable Transactions List */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ minWidth: Math.max(winWidth - 32, 340), width: '100%' }}
            >
              <View style={{ flex: 1, width: '100%' }}>
                {filteredList.length > 0 ? (
                  filteredList.map((item) => <TransactionItem key={item.id} item={item} />)
                ) : (
                  <View style={styles.emptyWrap}>
                    <MaterialCommunityIcons name="file-search-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>
                      {isArabic ? 'لا توجد معاملات مطابقة' : 'No Matching Transactions'}
                    </Text>
                    <Text style={styles.emptySub}>
                      {isArabic ? 'جرّب تغيير كلمة البحث أو الفلتر' : 'Try adjusting your search or filter options'}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      ) : (
        /* ARCHIVED MONTHS (HISTORY FILE) VIEW */
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.archiveContent}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ minWidth: Math.max(winWidth - 32, 340), width: '100%' }}
          >
            <View style={{ flex: 1, width: '100%' }}>
              <View style={[styles.archiveIntroCard, isArabic && { alignItems: 'flex-end' }]}>
                <View style={[styles.archiveIntroHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                  <MaterialCommunityIcons name="folder-text" size={24} color="#1D4ED8" />
                  <Text style={styles.archiveIntroTitle}>
                    {isArabic ? 'ملف أرشيف الشهور السابقة (History File)' : 'Archived Months History File'}
                  </Text>
                </View>
                <Text style={[styles.archiveIntroDesc, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? 'يتم هنا حفظ كافة معاملات وبيانات الشهور السابقة تلقائياً عند الضغط على "ترحيل وفتح شهر جديد"، ويمكنك استعراض كل شهر وتفاصيل معاملاته في أي وقت.'
                    : 'All transactions & metrics of past months are preserved here upon rollover. Tap any month card to view its full transaction record.'}
                </Text>
              </View>

              {archivedMonths.length > 0 ? (
                archivedMonths.map((item) => {
                  const txCount = item.transactions?.length || 0;
                  const outflow = item.balancesSummary?.totalOutflow ?? 0;
                  const actualSpend = item.balancesSummary?.totalExpense ?? 0;
                  const finalRem = item.balancesSummary?.finalRemainingBalance ?? 0;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.archiveCard, SHADOWS.small]}
                      onPress={() => setSelectedArchive(item)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.archiveCardHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.cycleRangeBadge, isArabic && { flexDirection: 'row-reverse' }]}>
                          <MaterialCommunityIcons name="calendar-month" size={16} color="#1D4ED8" />
                          <Text style={styles.cycleRangeText}>
                            {item.cycleStartDate} ➔ {item.cycleEndDate}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteArchive(item)}
                          style={styles.deleteArchiveBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.archiveCardMetricsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                        <View style={styles.archiveMetric}>
                          <Text style={styles.archiveMetricVal}>{formatAmount(outflow)} {currency.symbol}</Text>
                          <Text style={styles.archiveMetricLbl}>{isArabic ? 'إجمالي السيولة' : 'Outflow'}</Text>
                        </View>
                        <View style={styles.archiveMetricDivider} />
                        <View style={styles.archiveMetric}>
                          <Text style={styles.archiveMetricVal}>{formatAmount(actualSpend)} {currency.symbol}</Text>
                          <Text style={styles.archiveMetricLbl}>{isArabic ? 'استهلاك فعلي' : 'Actual Spent'}</Text>
                        </View>
                        <View style={styles.archiveMetricDivider} />
                        <View style={styles.archiveMetric}>
                          <Text style={[styles.archiveMetricVal, { color: finalRem >= 0 ? '#059669' : '#DC2626' }]}>
                            {formatAmount(finalRem)} {currency.symbol}
                          </Text>
                          <Text style={styles.archiveMetricLbl}>{isArabic ? 'المتبقي نهائي' : 'Final Net'}</Text>
                        </View>
                      </View>

                      <View style={[styles.archiveCardFooter, isArabic && { flexDirection: 'row-reverse' }]}>
                        <Text style={styles.archiveTxCount}>
                          {isArabic ? `📝 ${txCount} معاملة مسجلة في هذا الشهر` : `📝 ${txCount} transactions recorded`}
                        </Text>
                        <View style={[styles.viewDetailsBadge, isArabic && { flexDirection: 'row-reverse' }]}>
                          <Text style={styles.viewDetailsText}>{isArabic ? 'عرض المعاملات' : 'View'}</Text>
                          <MaterialCommunityIcons
                            name={isArabic ? 'chevron-left' : 'chevron-right'}
                            size={16}
                            color="#2563EB"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="folder-open-outline" size={56} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>
                    {isArabic ? 'لا توجد شهور مؤرشفة حتى الآن' : 'No Archived Months Yet'}
                  </Text>
                  <Text style={[styles.emptySub, { textAlign: 'center', paddingHorizontal: 20 }]}>
                    {isArabic
                      ? 'عند الضغط على "ترحيل وفتح شهر جديد" من الشاشة الرئيسية، سيتم حفظ سجل الشهر الماضي هنا تلقائياً لتتمكن من مراجعته في أي وقت.'
                      : 'When you tap "Rollover & Open New Month", previous cycle transactions will appear here for historical inspection.'}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* INSPECT ARCHIVED MONTH MODAL */}
      <Modal
        visible={!!selectedArchive}
        animationType="slide"
        onRequestClose={() => setSelectedArchive(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={[styles.archiveModalHeader, isArabic && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              onPress={() => setSelectedArchive(null)}
              style={styles.closeModalBtn}
            >
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.archiveModalTitle}>
                {isArabic ? 'سجل معاملات الشهر المؤرشف' : 'Archived Month Transactions'}
              </Text>
              <Text style={styles.archiveModalSub}>
                {selectedArchive?.cycleStartDate} ➔ {selectedArchive?.cycleEndDate}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: '#ECFDF5',
                borderWidth: 1,
                borderColor: '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                if (!selectedArchive) return;
                Alert.alert(
                  isArabic ? 'تصدير هذا الشهر إلى إكسيل (.xlsx) 📊' : 'Export Month to Excel (.xlsx) 📊',
                  isArabic ? 'كيف ترغب في تصدير ملف الإكسيل؟' : 'Choose export method:',
                  [
                    { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
                    {
                      text: isArabic ? 'حفظ في مجلد بالموبايل 📁' : 'Save to Folder 📁',
                      onPress: () =>
                        saveExcelToChosenFolder({
                          transactions: selectedArchive.transactions || [],
                          balances: selectedArchive.balancesSummary || {},
                          currencySymbol: currency.symbol,
                          isArabic,
                        }),
                    },
                    {
                      text: isArabic ? 'مشاركة الملف 📤' : 'Share File 📤',
                      onPress: () =>
                        shareExcelFile({
                          transactions: selectedArchive.transactions || [],
                          balances: selectedArchive.balancesSummary || {},
                          currencySymbol: currency.symbol,
                          isArabic,
                        }),
                    },
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="file-excel-outline" size={20} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Search inside archive */}
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <View style={[styles.searchBar, isArabic && { flexDirection: 'row-reverse' }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={[styles.searchInput, isArabic ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 }]}
                placeholder={isArabic ? 'ابحث في معاملات هذا الشهر...' : 'Search inside this archived month...'}
                placeholderTextColor={COLORS.textMuted}
                value={archiveSearch}
                onChangeText={setArchiveSearch}
                textAlign={isArabic ? 'right' : 'left'}
              />
            </View>
          </View>

          {/* Transactions List of Archived Month */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
            showsVerticalScrollIndicator={true}
          >
            <View style={[styles.summaryRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.countText}>
                {isArabic
                  ? `العدد: ${selectedArchiveFilteredTxs.length} معاملة (الأحدث بأعلى)`
                  : `Showing: ${selectedArchiveFilteredTxs.length} (Newest at top)`}
              </Text>
              <Text style={styles.sumText}>
                {isArabic ? 'الاستهلاك: ' : 'Spent: '}
                {formatAmount(selectedArchive?.balancesSummary?.totalExpense || 0)} {currency.symbol}
              </Text>
            </View>

            {selectedArchiveFilteredTxs.length > 0 ? (
              selectedArchiveFilteredTxs.map((item) => (
                <TransactionItem key={item.id} item={item} />
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="file-search-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>{isArabic ? 'لا توجد معاملات مطابقة' : 'No Matching Transactions'}</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tabSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabSegmentBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  expenseChipActive: {
    backgroundColor: COLORS.expense,
    borderColor: COLORS.expense,
  },
  incomeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textWhite,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  sumText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 30,
  },
  archiveContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  archiveIntroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  archiveIntroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  archiveIntroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  archiveIntroDesc: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
  },
  archiveCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  archiveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cycleRangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  cycleRangeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  deleteArchiveBtn: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  archiveCardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  archiveMetric: {
    flex: 1,
    alignItems: 'center',
  },
  archiveMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  archiveMetricLbl: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  archiveMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderLight,
  },
  archiveCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  archiveTxCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  viewDetailsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  archiveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeModalBtn: {
    padding: 6,
  },
  archiveModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  archiveModalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
