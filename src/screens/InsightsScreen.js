import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense, getGracePeriodStats } from '../context/ExpenseContext';

export const InsightsScreen = () => {
  const {
    categoryBreakdown,
    monthTransactions,
    balances,
    currency,
    formatAmount,
    isArabic,
    isCreditCardMethod,
    getAccountById,
  } = useExpense();

  const { width: winWidth } = useWindowDimensions();

  // Top 10 single biggest expenses (excluding switch and cc_pyd)
  const top10Expenses = useMemo(() => {
    return [...monthTransactions]
      .filter((t) => t.type === 'expense' && t.categoryId !== 'switch' && t.categoryId !== 'cc_pyd')
      .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
      .slice(0, 10);
  }, [monthTransactions]);

  // Weekday pattern analysis
  const weekdayPattern = useMemo(() => {
    const days = [
      { id: 0, name: isArabic ? 'الأحد' : 'Sun', total: 0, count: 0 },
      { id: 1, name: isArabic ? 'الاثنين' : 'Mon', total: 0, count: 0 },
      { id: 2, name: isArabic ? 'الثلاثاء' : 'Tue', total: 0, count: 0 },
      { id: 3, name: isArabic ? 'الأربعاء' : 'Wed', total: 0, count: 0 },
      { id: 4, name: isArabic ? 'الخميس' : 'Thu', total: 0, count: 0 },
      { id: 5, name: isArabic ? 'الجمعة' : 'Fri', total: 0, count: 0 },
      { id: 6, name: isArabic ? 'السبت' : 'Sat', total: 0, count: 0 },
    ];

    monthTransactions.forEach((tx) => {
      if (tx.type === 'switch' || tx.categoryId === 'switch' || tx.type === 'cc_pyd' || tx.categoryId === 'cc_pyd' || tx.type === 'income') {
        return;
      }
      try {
        const d = new Date(tx.date);
        const dayIdx = d.getDay();
        if (days[dayIdx]) {
          days[dayIdx].total += parseFloat(tx.amount) || 0;
          days[dayIdx].count += 1;
        }
      } catch {}
    });

    const maxDay = [...days].sort((a, b) => b.total - a.total)[0];
    return { days, maxDay };
  }, [monthTransactions, isArabic]);

  // Credit card transactions breakdown for live inspection in Insights
  const ccTransactions = useMemo(() => {
    return monthTransactions.filter(
      (tx) =>
        (isCreditCardMethod && isCreditCardMethod(tx.paymentMethod)) ||
        tx.paymentMethod === 'cc_ar' ||
        tx.paymentMethod === 'cc_ca' ||
        tx.type === 'cc_pyd' ||
        tx.categoryId === 'cc_pyd'
    );
  }, [monthTransactions, isCreditCardMethod]);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
            {isArabic ? 'لوحة التحليلات الذكية (Insights 📊)' : 'Smart Insights Dashboard 📊'}
          </Text>
          <Text style={[styles.headerSub, { textAlign: 'center' }]}>
            {isArabic
              ? 'تحليلات حية وتتبع لحظي للمصروفات ومديونيات الكروت'
              : 'Live analytics for expenses, cash flow & credit card billing cycles'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ width: '100%', minWidth: '100%' }}
        >
          <View style={{ flex: 1, width: '100%', gap: 14 }}>
        {/* 1. TOP KPI BANNER */}
        <View style={[styles.kpiContainer, SHADOWS.medium]}>
          <Text style={[styles.kpiMainTitle, { textAlign: 'center' }]}>
            {isArabic ? 'مؤشرات الأداء اللحظية • Live Insights' : 'Live Performance Indicators • Real-Time'}
          </Text>

          {/* KPI Blocks arranged exactly as requested:
              1. Top Center: إجمالي السيولة الخارجة (Full Width)
              2. Middle Row: المصروف الفعلي & المتوسط اليومي (Side by Side)
              3. Bottom Center: المتبقي بعد الكروت (Full Width)
          */}
          <View style={styles.kpiStructuredContainer}>
            {/* 1. إجمالي السيولة الخارجة (في النص لوحده) */}
            <View style={[styles.kpiCardFull, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.kpiValLarge, { color: '#DC2626' }]}>
                {formatAmount(balances.totalOutflow)} {currency.symbol}
              </Text>
              <Text style={styles.kpiLbl}>
                {isArabic ? 'إجمالي السيولة الخارجة (Total Outflow)' : 'Total Outflow'}
              </Text>
            </View>

            {/* 2. المصروف الفعلي & المتوسط اليومي جنب بعض */}
            <View style={[styles.kpiRowSideBySide, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.kpiCardHalf, { flex: 1 }]}>
                <Text style={styles.kpiVal}>{formatAmount(balances.realTotalSpent)} {currency.symbol}</Text>
                <Text style={styles.kpiLbl}>
                  {isArabic ? 'المصروف الفعلي' : 'Actual Spent'}
                </Text>
              </View>

              <View style={[styles.kpiCardHalf, { flex: 1 }]}>
                <Text style={styles.kpiVal}>{formatAmount(balances.avgPerDay)} {currency.symbol}</Text>
                <Text style={styles.kpiLbl}>{isArabic ? 'المتوسط اليومي' : 'Daily Average'}</Text>
              </View>
            </View>

            {/* 3. المتبقي بعد الكروت (تحت لوحده في النص) */}
            <View style={[styles.kpiCardFull, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.kpiValLarge, { color: '#2563EB' }]}>
                {formatAmount(balances.netAvailableAfterCards)} {currency.symbol}
              </Text>
              <Text style={styles.kpiLbl}>{isArabic ? 'المتبقي بعد الكروت (Net Left After Cards)' : 'Net Left After Cards'}</Text>
            </View>
          </View>

          <View style={[styles.onTrackBanner, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons
              name={balances.daysMoneyLasts >= balances.daysLeft ? 'check-decagram' : 'alert-circle'}
              size={18}
              color={balances.daysMoneyLasts >= balances.daysLeft ? '#059669' : '#DC2626'}
            />
            <Text style={[styles.onTrackText, isArabic && { textAlign: 'right' }]}>
              {balances.daysMoneyLasts >= balances.daysLeft
                ? isArabic
                  ? `✅ وضعك ممتاز وآمن — الرصيد يكفي لـ ${balances.daysMoneyLasts} يوماً قادمة بمعدل الصرف الحالي`
                  : `✅ On Track — Your balance covers the next ${balances.daysMoneyLasts} days at the current daily spend rate`
                : isArabic
                ? `⚠️ تنبيه: الرصيد يكفي لـ ${balances.daysMoneyLasts} يوماً (${balances.daysLeft} يوم متبقي في الدورة)`
                : `⚠️ Alert: Balance covers ${balances.daysMoneyLasts} days (${balances.daysLeft} days left in this cycle)`}
            </Text>
          </View>
        </View>

        {/* 2. WHERE THE MONEY GOES */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.cardTitle}>
              {isArabic ? 'أين تذهب الأموال؟' : 'Where the Money Goes'}
            </Text>
            <Text style={styles.cardSub}>
              {isArabic ? 'أكثر البنود استهلاكاً بالأرقام والنسب' : 'Top spending categories by amount & share'}
            </Text>
          </View>

          {/* Top Category Callout */}
          {topCategory && (
            <View style={[styles.topCallout, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.topCalloutLeft, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.badgeIcon, { backgroundColor: topCategory.category.color }]}>
                  <MaterialCommunityIcons name={topCategory.category.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={isArabic ? { alignItems: 'flex-end' } : undefined}>
                  <Text style={styles.topCalloutBadge}>
                    {isArabic ? 'أعلى بند استهلاك' : 'Highest Category'}
                  </Text>
                  <Text style={styles.topCalloutName}>{topCategory.category.name}</Text>
                </View>
              </View>
              <View style={[styles.topCalloutRight, isArabic && { alignItems: 'flex-start' }]}>
                <Text style={styles.topCalloutAmt}>
                  {formatAmount(topCategory.total)} {currency.symbol}
                </Text>
                <Text style={styles.topCalloutPct}>
                  {Math.round(topCategory.percentage)}% {isArabic ? 'من إجمالي الصرف' : 'of total spend'}
                </Text>
              </View>
            </View>
          )}

          {/* All Categories Bars */}
          <View style={styles.categoriesList}>
            {categoryBreakdown.map((item) => (
              <View key={item.category.id} style={styles.catItemRow}>
                <View style={[styles.catTopRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.catLeftInfo, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.colorDot, { backgroundColor: item.category.color }]} />
                    <Text style={styles.catItemName}>{item.category.name}</Text>
                  </View>
                  <View style={[styles.catRightInfo, isArabic && { flexDirection: 'row-reverse' }]}>
                    <Text style={styles.catAmtText}>{formatAmount(item.total)} {currency.symbol}</Text>
                    <Text style={styles.catPctText}>({Math.round(item.percentage)}%)</Text>
                  </View>
                </View>

                <View style={[styles.barTrack, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(item.percentage, 4)}%`,
                        backgroundColor: item.category.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. WEEKDAY PATTERN */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.cardTitle}>
              {isArabic ? 'توزيع الصرف حسب أيام الأسبوع' : 'Spending by Day of Week'}
            </Text>
            <View style={styles.highestDayPill}>
              <Text style={styles.highestDayText}>
                {isArabic
                  ? `${weekdayPattern.maxDay.name} هو الأعلى صرفاً 🔥 (${formatAmount(weekdayPattern.maxDay.total)} ${currency.symbol})`
                  : `${weekdayPattern.maxDay.name} is highest 🔥 (${formatAmount(weekdayPattern.maxDay.total)} ${currency.symbol})`}
              </Text>
            </View>
          </View>

          <View style={[styles.weekdayChart, isArabic && { flexDirection: 'row-reverse' }]}>
            {weekdayPattern.days.map((day) => {
              const maxVal = weekdayPattern.maxDay.total || 1;
              const heightPct = Math.max(10, Math.round((day.total / maxVal) * 100));
              const isMax = day.id === weekdayPattern.maxDay.id;

              return (
                <View key={day.id} style={styles.weekdayColumn}>
                  <Text style={styles.colAmt}>
                    {day.total > 0 ? formatAmount(day.total) : '0'}
                  </Text>
                  <View style={styles.colTrack}>
                    <View
                      style={[
                        styles.colFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: isMax ? '#EF4444' : COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.colName,
                      (day.id === 4 || day.name === 'الخميس' || day.name.length > 5) && { fontSize: 8.5 },
                      isMax && styles.colNameMax,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    {day.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4. BIGGEST EXPENSES (TOP 10) */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.cardTitle}>
              {isArabic ? 'أكبر 10 مصاريف مسجلة' : 'Top 10 Biggest Expenses'}
            </Text>
            <Text style={styles.cardSub}>
              {isArabic ? 'أعلى المعاملات الفردية قيمة في هذه الدورة' : 'Largest individual transactions recorded this period'}
            </Text>
          </View>

          {top10Expenses.map((tx, idx) => (
            <View key={tx.id} style={[styles.top10Row, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.top10RankBox, isArabic ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]}>
                <Text style={styles.top10RankText}>#{idx + 1}</Text>
              </View>

              <View style={[styles.top10Middle, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={styles.top10Note} numberOfLines={1}>
                  {tx.note || tx.categoryId}
                </Text>
                <Text style={styles.top10Date}>{tx.date}</Text>
              </View>

              <Text style={styles.top10Amt}>
                -{formatAmount(tx.amount)} {currency.symbol}
              </Text>
            </View>
          ))}
        </View>

        {/* 5. CREDIT CARD BILLS & GRACE PERIODS */}
        <View style={[styles.card, SHADOWS.small]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.cardTitle}>
              {isArabic ? 'مديونيات ومواعيد سداد بطاقات الائتمان 💳' : 'Credit Card Bills & Due Dates 💳'}
            </Text>
            <Text style={styles.cardSub}>
              {isArabic
                ? 'القاعدة: أي شراء بالكارت يستحق قبل يوم 25 من الشهر التالي'
                : 'Rule: Any credit card purchase is due before the 25th of the FOLLOWING month'}
            </Text>
          </View>

          <View style={styles.billsTable}>
            {/* Arab Bank due this month (25/11) */}
            <View style={[styles.billRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={styles.billName}>
                  {isArabic ? 'البنك العربي (الشهر الحالي)' : 'Arab Bank (Current Month)'}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {isArabic
                    ? `${formatAmount(balances.ccArCarryOverLeft)} مرحل + ${formatAmount(balances.ccArPurchasesDueThisMonth)} مشتريات أكتوبر`
                    : `${formatAmount(balances.ccArCarryOverLeft)} carry-over + ${formatAmount(balances.ccArPurchasesDueThisMonth)} Oct purchases`}
                </Text>
              </View>
              <Text style={styles.billDue}>
                {isArabic ? `مستحق ${balances.currentMonthDueDate}` : `Due ${balances.currentMonthDueDate}`}
              </Text>
              <Text style={[styles.billAmt, { color: '#DC2626' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.ccArDueThisMonth)} {currency.symbol}
              </Text>
            </View>

            {/* Arab Bank due next month (25/12) */}
            {balances.ccArDueNextMonth > 0 && (
              <View style={[styles.billRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.billName}>
                    {isArabic ? 'البنك العربي (الشهر القادم)' : 'Arab Bank (Next Month)'}
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                    {isArabic ? 'مشتريات نوفمبر • تُسدد الشهر القادم' : 'Nov purchases • Due next month'}
                  </Text>
                </View>
                <Text style={styles.billDue}>
                  {isArabic ? `مستحق ${balances.nextMonthDueDate}` : `Due ${balances.nextMonthDueDate}`}
                </Text>
                <Text style={[styles.billAmt, { color: '#EA580C' }, isArabic && { textAlign: 'left' }]}>
                  {formatAmount(balances.ccArDueNextMonth)} {currency.symbol}
                </Text>
              </View>
            )}

            {/* Credit Agricole due this month (25/11) if any */}
            {balances.ccCaDueThisMonth > 0 && (
              <View style={[styles.billRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.billName}>
                    {isArabic ? 'كريدي أجريكول (الشهر الحالي)' : 'Crédit Agricole (Current Month)'}
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                    {isArabic ? 'مشتريات الشهر السابق المستحقة هذا الشهر' : 'Previous month purchases due this month'}
                  </Text>
                </View>
                <Text style={styles.billDue}>
                  {isArabic ? `مستحق ${balances.currentMonthDueDate}` : `Due ${balances.currentMonthDueDate}`}
                </Text>
                <Text style={[styles.billAmt, { color: '#DC2626' }, isArabic && { textAlign: 'left' }]}>
                  {formatAmount(balances.ccCaDueThisMonth)} {currency.symbol}
                </Text>
              </View>
            )}

            {/* Credit Agricole due next month (25/12) */}
            <View style={[styles.billRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={styles.billName}>
                  {isArabic ? 'كريدي أجريكول (الشهر القادم)' : 'Crédit Agricole (Next Month)'}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {isArabic
                    ? `مشتريات الشهر الحالي • تُسدد يوم 25 الشهر التالي`
                    : `Current month purchases • Due 25th next month`}
                </Text>
              </View>
              <Text style={styles.billDue}>
                {isArabic ? `مستحق ${balances.nextMonthDueDate}` : `Due ${balances.nextMonthDueDate}`}
              </Text>
              <Text style={[styles.billAmt, { color: '#D97706' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.ccCaDueNextMonth)} {currency.symbol}
              </Text>
            </View>

            {/* Custom Credit Cards in Insights Table */}
            {(balances.customCreditCardsSummary || []).map((cCard) => (
              <View key={cCard.id} style={[styles.billRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.billName}>{cCard.bankName} (CC)</Text>
                  <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                    {isArabic
                      ? `هذا الشهر: ${formatAmount(cCard.dueThisMonth)} • القادم: ${formatAmount(cCard.dueNextMonth)}`
                      : `This month: ${formatAmount(cCard.dueThisMonth)} • Next: ${formatAmount(cCard.dueNextMonth)}`}
                  </Text>
                </View>
                <Text style={styles.billDue}>
                  {cCard.dueThisMonth > 0 ? balances.currentMonthDueDate : balances.nextMonthDueDate}
                </Text>
                <Text style={[styles.billAmt, { color: '#D97706' }, isArabic && { textAlign: 'left' }]}>
                  {formatAmount(cCard.totalDebt)} {currency.symbol}
                </Text>
              </View>
            ))}

            {/* Summary by Due Date: Due This Month vs Due Next Month */}
            <View
              style={[
                styles.billRow,
                { backgroundColor: '#FEF2F2', paddingHorizontal: 10, borderRadius: 10 },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text style={[styles.billName, { color: '#991B1B', flex: 1.4 }, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `واجب السداد قبل ${balances.currentMonthDueDate} (باقي ${balances.daysUntilCurrentDue} يوم)`
                  : `Total Due Before ${balances.currentMonthDueDate} (${balances.daysUntilCurrentDue}d left)`}
              </Text>
              <Text style={[styles.billAmt, { color: '#DC2626' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcDueThisMonth)} {currency.symbol}
              </Text>
            </View>

            <View
              style={[
                styles.billRow,
                { backgroundColor: '#FFFBEB', paddingHorizontal: 10, borderRadius: 10, marginTop: 4 },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text style={[styles.billName, { color: '#92400E', flex: 1.4 }, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `مستحق قبل ${balances.nextMonthDueDate} (${balances.daysUntilNextDue} يوم سماح)`
                  : `Total Due Before ${balances.nextMonthDueDate} (${balances.daysUntilNextDue}d grace)`}
              </Text>
              <Text style={[styles.billAmt, { color: '#D97706' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcDueNextMonth)} {currency.symbol}
              </Text>
            </View>

            <View style={[styles.billRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={styles.billName}>
                  {isArabic ? 'إجمالي المسدد للكروت' : 'Total Card Payments Made'}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {isArabic
                    ? `عربي: ${formatAmount(balances.ccArPaid)} • أجريكول: ${formatAmount(balances.ccCaPaid)}`
                    : `Arab Bank: ${formatAmount(balances.ccArPaid)} • Crédit Agricole: ${formatAmount(balances.ccCaPaid)}`}
                </Text>
              </View>
              <Text style={styles.billDue}>{isArabic ? 'تم السداد ✅' : 'Paid ✅'}</Text>
              <Text style={[styles.billAmt, { color: '#059669' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcPaid)} {currency.symbol}
              </Text>
            </View>

            <View style={[styles.billRow, styles.billTotalRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.billTotalText, isArabic && { textAlign: 'right' }]}>
                {isArabic ? 'إجمالي مديونية الكروت الكلية (الحالي + القادم)' : 'Total Combined Credit Card Debt'}
              </Text>
              <Text style={[styles.billTotalAmt, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcDebt)} {currency.symbol}
              </Text>
            </View>
          </View>

          {/* Live Credit Card Transactions List with Grace Period */}
          {ccTransactions.length > 0 && (
            <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
              <Text
                style={[
                  { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
                  isArabic && { textAlign: 'right' },
                ]}
              >
                {isArabic
                  ? `سجل معاملات الكروت وفترة السماح (${ccTransactions.length})`
                  : `Credit Card Transactions & Grace Periods (${ccTransactions.length})`}
              </Text>
              {ccTransactions.map((tx) => {
                const isPaid = tx.type === 'cc_pyd' || tx.categoryId === 'cc_pyd';
                const accObj = getAccountById
                  ? getAccountById(isPaid ? tx.targetCard || 'cc_ar' : tx.paymentMethod)
                  : null;
                const cardLabel = accObj
                  ? accObj.displayName
                  : isPaid
                  ? (tx.targetCard === 'cc_ca'
                      ? (isArabic ? 'سداد كريدي أجريكول' : 'Crédit Agricole Payment')
                      : (isArabic ? 'سداد البنك العربي' : 'Arab Bank Payment'))
                  : (tx.paymentMethod === 'cc_ca'
                      ? (isArabic ? 'كريدي أجريكول (CC CA)' : 'Crédit Agricole (CC CA)')
                      : (isArabic ? 'البنك العربي (CC AR)' : 'Arab Bank (CC AR)'));
                const grace = !isPaid ? getGracePeriodStats(tx.date, tx.dueDate) : null;
                return (
                  <View key={tx.id} style={[styles.top10Row, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.top10Middle, isArabic && { alignItems: 'flex-end' }]}>
                      <Text style={styles.top10Note} numberOfLines={1}>
                        {tx.note || cardLabel}
                      </Text>
                      <Text style={styles.top10Date}>{tx.date} • {cardLabel}</Text>
                      {grace && (
                        <Text style={{ fontSize: 10, color: '#2563EB', fontWeight: '700', marginTop: 2 }}>
                          {isArabic
                            ? `سداد قبل ${grace.dueDate} (${grace.totalGraceDays} يوم سماح • متبقي ${grace.remainingGraceDays} يوم)`
                            : `Due before ${grace.dueDate} (${grace.totalGraceDays}d grace • ${grace.remainingGraceDays}d left)`}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: isArabic ? 'flex-start' : 'flex-end' }}>
                      <Text style={[styles.top10Amt, { color: isPaid ? '#059669' : '#DC2626' }]}>
                        {isPaid ? '+' : '-'}{formatAmount(tx.amount)} {currency.symbol}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </ScrollView>
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
    alignItems: 'flex-start',
  },
  headerTitleWrap: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  kpiContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiMainTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  kpiStructuredContainer: {
    gap: 7,
    marginBottom: 12,
    width: '100%',
  },
  kpiCardFull: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiRowSideBySide: {
    flexDirection: 'row',
    gap: 7,
    width: '100%',
  },
  kpiCardHalf: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValLarge: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  kpiVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  kpiLbl: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  onTrackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onTrackText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  topCallout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    marginBottom: 16,
  },
  topCalloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCalloutBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  topCalloutName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  topCalloutRight: {
    alignItems: 'flex-end',
  },
  topCalloutAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E11D48',
  },
  topCalloutPct: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoriesList: {
    gap: 12,
  },
  catItemRow: {
    gap: 6,
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catRightInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  catAmtText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catPctText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  highestDayPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  highestDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  weekdayChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 14,
  },
  weekdayColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  colAmt: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  colTrack: {
    width: 16,
    height: 85,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  colFill: {
    width: '100%',
    borderRadius: 8,
  },
  colName: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  colNameMax: {
    color: '#DC2626',
    fontWeight: '800',
  },
  top10Row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  top10RankBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  top10RankText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  top10Middle: {
    flex: 1,
    alignItems: 'flex-start',
  },
  top10Note: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  top10Date: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  top10Amt: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.expense,
  },
  billsTable: {
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  billName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billDue: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 0.9,
    textAlign: 'center',
  },
  billAmt: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  billTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  billTotalText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 2,
  },
  billTotalAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    flex: 1,
    textAlign: 'right',
  },
});
