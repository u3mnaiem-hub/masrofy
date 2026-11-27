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
    archivedMonths,
    isDarkMode,
    isOliveDark,
    themeColors,
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

  // Daily total expenses breakdown for every active day in the current fiscal month
  const dailySpendingList = useMemo(() => {
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = {};

    monthTransactions.forEach((tx) => {
      if (
        tx.type === 'switch' ||
        tx.categoryId === 'switch' ||
        tx.type === 'cc_pyd' ||
        tx.categoryId === 'cc_pyd' ||
        tx.type === 'income'
      ) {
        return;
      }
      const dateKey = tx.date || new Date().toISOString().split('T')[0];
      const amt = parseFloat(tx.amount) || 0;
      if (!map[dateKey]) {
        let dayName = '';
        try {
          const parts = dateKey.split('-').map(Number);
          if (parts.length === 3 && !parts.some(isNaN)) {
            const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const idx = dObj.getDay();
            dayName = isArabic ? dayNamesAr[idx] : dayNamesEn[idx];
          }
        } catch {}
        map[dateKey] = { date: dateKey, dayName, total: 0, count: 0 };
      }
      map[dateKey].total += amt;
      map[dateKey].count += 1;
    });

    const list = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
    const maxDaily = list.reduce((m, item) => Math.max(m, item.total), 0) || 1;
    return { list, maxDaily };
  }, [monthTransactions, isArabic]);

  const monthComparison = useMemo(() => {
    const prevArch = (archivedMonths || [])[0];
    const curTotal = balances.realTotalSpent || 0;
    const elapsedDays = Math.max(0, balances.daysElapsed || 0);
    const displayDays = Math.max(1, elapsedDays);

    if (!prevArch) {
      return {
        hasPrevious: false,
        prevLabel: isArabic
          ? 'سيتم تفعيل المقارنة تلقائياً بعد إغلاق أول شهر مالي'
          : 'Comparison activates automatically after closing your first fiscal month',
        curTotal,
        prevSamePeriodTotal: 0,
        displayDays,
        diffPct: 0,
        isSaving: true,
      };
    }

    const parseLocal = (str) => {
      if (!str || typeof str !== 'string') return null;
      const p = str.split('-').map(Number);
      if (p.length !== 3 || p.some(isNaN)) return null;
      return new Date(p[0], p[1] - 1, p[2]);
    };

    const pStart = parseLocal(prevArch.cycleStartDate);
    const prevTxs = Array.isArray(prevArch.transactions) ? prevArch.transactions : [];

    // Sum actual expenses in the previous archived month during the EXACT same number of elapsed days from its start
    let prevSamePeriodTotal = 0;
    if (pStart && prevTxs.length > 0) {
      const cutoff = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate() + elapsedDays);
      prevTxs.forEach((tx) => {
        if (
          tx.type === 'switch' ||
          tx.categoryId === 'switch' ||
          tx.type === 'cc_pyd' ||
          tx.categoryId === 'cc_pyd' ||
          tx.type === 'income'
        ) {
          return;
        }
        const txD = parseLocal(tx.date);
        if (!txD || txD <= cutoff) {
          prevSamePeriodTotal += parseFloat(tx.amount) || 0;
        }
      });
    } else {
      prevSamePeriodTotal =
        prevArch?.balancesSummary?.totalExpense ??
        prevArch?.realTotalSpent ??
        prevArch?.totalOutflow ??
        0;
    }

    const diff = curTotal - prevSamePeriodTotal;
    const diffPct =
      prevSamePeriodTotal > 0
        ? Math.round((Math.abs(diff) / prevSamePeriodTotal) * 100)
        : (curTotal > 0 ? 100 : 0);

    const prevLabel = isArabic
      ? `مقارنة أول ${displayDays} يوم من الشهر الحالي مع نفس الفترة من الشهر السابق (${prevArch.cycleStartDate})`
      : `First ${displayDays}d of this month vs same period of previous month (${prevArch.cycleStartDate})`;

    return {
      hasPrevious: true,
      curTotal,
      prevSamePeriodTotal,
      displayDays,
      prevLabel,
      diff,
      diffPct,
      isSaving: diff <= 0,
    };
  }, [archivedMonths, balances.realTotalSpent, balances.daysElapsed, isArabic]);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { alignItems: 'center', justifyContent: 'center', borderBottomColor: themeColors.primaryLight, borderBottomWidth: 2 }, isDarkMode && { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Text style={[styles.headerTitle, { textAlign: 'center', color: isDarkMode ? themeColors.primary : themeColors.primaryDark }]}>
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
        <View style={[styles.kpiContainer, SHADOWS.medium, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1 }]}>
          <Text style={[styles.kpiMainTitle, { textAlign: 'center' }, isDarkMode && { color: themeColors.textPrimary }]}>
            {isArabic ? 'مؤشرات الأداء اللحظية • Live Insights' : 'Live Performance Indicators • Real-Time'}
          </Text>

          <View style={styles.kpiStructuredContainer}>
            {/* 1. إجمالي السيولة الخارجة (Coral-Red card like Expenses in reference image) */}
            <View style={[styles.kpiCardFull, isDarkMode ? { borderColor: 'rgba(242, 113, 88, 0.38)', backgroundColor: themeColors.expenseLight } : { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.kpiValLarge, { color: isDarkMode ? themeColors.expense : '#DC2626' }]}>
                {formatAmount(balances.totalOutflow)} {currency.symbol}
              </Text>
              <Text style={[styles.kpiLbl, isDarkMode && { color: themeColors.textSecondary }]}>
                {isArabic ? 'إجمالي السيولة الخارجة (Total Outflow)' : 'Total Outflow'}
              </Text>
            </View>

            {/* 2. المصروف الفعلي & المتوسط اليومي (Cyan-Teal cards like Revenue in reference image) */}
            <View style={[styles.kpiRowSideBySide, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.kpiCardHalf, { flex: 1 }, isDarkMode && { backgroundColor: themeColors.infoLight, borderColor: 'rgba(79, 209, 217, 0.34)' }]}>
                <Text style={[styles.kpiVal, isDarkMode && { color: themeColors.info }]}>{formatAmount(balances.realTotalSpent)} {currency.symbol}</Text>
                <Text style={[styles.kpiLbl, isDarkMode && { color: themeColors.textSecondary }]}>
                  {isArabic ? 'المصروف الفعلي' : 'Actual Spent'}
                </Text>
              </View>

              <View style={[styles.kpiCardHalf, { flex: 1 }, isDarkMode && { backgroundColor: themeColors.infoLight, borderColor: 'rgba(79, 209, 217, 0.34)' }]}>
                <Text style={[styles.kpiVal, isDarkMode && { color: themeColors.info }]}>{formatAmount(balances.avgPerDay)} {currency.symbol}</Text>
                <Text style={[styles.kpiLbl, isDarkMode && { color: themeColors.textSecondary }]}>{isArabic ? 'المتوسط اليومي' : 'Daily Average'}</Text>
              </View>
            </View>

            {/* 3. المتبقي بعد الكروت (تحت لوحده في النص) */}
            <View style={[styles.kpiCardFull, isDarkMode ? { borderColor: 'rgba(0, 230, 118, 0.35)', backgroundColor: themeColors.primaryLight } : { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.kpiValLarge, { color: isDarkMode ? themeColors.primary : '#2563EB' }]}>
                {formatAmount(balances.netAvailableAfterCards)} {currency.symbol}
              </Text>
              <Text style={[styles.kpiLbl, isDarkMode && { color: themeColors.textSecondary }]}>{isArabic ? 'المتبقي بعد الكروت (Net Left After Cards)' : 'Net Left After Cards'}</Text>
            </View>
          </View>

          <View style={[styles.onTrackBanner, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border, borderWidth: 1 }, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons
              name={balances.daysMoneyLasts >= balances.daysLeft ? 'check-decagram' : 'alert-circle'}
              size={18}
              color={balances.daysMoneyLasts >= balances.daysLeft ? (isDarkMode ? themeColors.primary : '#059669') : (isDarkMode ? themeColors.expense : '#DC2626')}
            />
            <Text style={[styles.onTrackText, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
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

        {/* 1.5 MONTH-OVER-MONTH SMART COMPARISON */}
        <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'مقارنة ذكية بين الشهور 📈' : 'Month-over-Month Smart Comparison 📈'}
            </Text>
            <Text style={[styles.cardSub, isDarkMode && { color: themeColors.textSecondary }]}>
              {monthComparison.prevLabel}
            </Text>
          </View>
          {!monthComparison.hasPrevious ? (
            <View
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#F8FAFC',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDarkMode ? themeColors.border : '#E2E8F0',
                gap: 10,
              }}
            >
              <View style={{ flex: 1, alignItems: isArabic ? 'flex-end' : 'flex-start' }}>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: isDarkMode ? themeColors.textPrimary : '#334155', textAlign: isArabic ? 'right' : 'left' }}>
                  {isArabic ? 'لا يوجد شهر مالي سابق في الأرشيف بعد' : 'No Archived Fiscal Month Yet'}
                </Text>
                <Text style={{ fontSize: 11.5, color: isDarkMode ? themeColors.textSecondary : '#64748B', marginTop: 3, textAlign: isArabic ? 'right' : 'left' }}>
                  {isArabic
                    ? `إجمالي المصروف هذا الشهر حتى الآن: ${formatAmount(monthComparison.curTotal)} ${currency.symbol}`
                    : `Total spent this month so far: ${formatAmount(monthComparison.curTotal)} ${currency.symbol}`}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={26}
                color={isDarkMode ? themeColors.primary : '#64748B'}
              />
            </View>
          ) : (
            <View
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isDarkMode ? themeColors.surfaceSecondary : (monthComparison.isSaving ? '#ECFDF5' : '#FEF2F2'),
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDarkMode ? themeColors.border : (monthComparison.isSaving ? '#6EE7B7' : '#FECACA'),
                gap: 8,
              }}
            >
              <View style={{ flex: 1, alignItems: isArabic ? 'flex-end' : 'flex-start' }}>
                <Text style={{ fontSize: 12.5, fontWeight: '900', color: isDarkMode ? (monthComparison.isSaving ? themeColors.primary : themeColors.expense) : (monthComparison.isSaving ? '#047857' : '#B91C1C'), textAlign: isArabic ? 'right' : 'left' }}>
                  {monthComparison.isSaving
                    ? (isArabic ? `🎉 وفرت ${monthComparison.diffPct}% مقارنة بنفس الفترة من الشهر السابق!` : `🎉 Saved ${monthComparison.diffPct}% vs same period last month!`)
                    : (isArabic ? `⚠️ زيادة ${monthComparison.diffPct}% عن نفس الفترة من الشهر السابق` : `⚠️ Up ${monthComparison.diffPct}% vs same period last month`)}
                </Text>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDarkMode ? themeColors.textPrimary : '#334155', marginTop: 4, textAlign: isArabic ? 'right' : 'left' }}>
                  {isArabic
                    ? `هذا الشهر: ${formatAmount(monthComparison.curTotal)} ${currency.symbol} • نفس الفترة الشهر السابق: ${formatAmount(monthComparison.prevSamePeriodTotal)} ${currency.symbol}`
                    : `This Month: ${formatAmount(monthComparison.curTotal)} ${currency.symbol} • Same Period Prev: ${formatAmount(monthComparison.prevSamePeriodTotal)} ${currency.symbol}`}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={monthComparison.isSaving ? 'trending-down' : 'trending-up'}
                size={26}
                color={isDarkMode ? (monthComparison.isSaving ? themeColors.primary : themeColors.expense) : (monthComparison.isSaving ? '#059669' : '#DC2626')}
              />
            </View>
          )}
        </View>

        {/* 2. WHERE THE MONEY GOES */}
        <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'أين تذهب الأموال؟' : 'Where the Money Goes'}
            </Text>
            <Text style={[styles.cardSub, isDarkMode && { color: themeColors.textSecondary }]}>
              {isArabic ? 'أكثر البنود استهلاكاً بالأرقام والنسب' : 'Top spending categories by amount & share'}
            </Text>
          </View>

          {/* Top Category Callout — Compact crisp typography so 100% of Arabic & English text fits cleanly */}
          {topCategory && (
            <View
              style={[
                styles.topCallout,
                { gap: 8, paddingHorizontal: 10, paddingVertical: 10 },
                isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
            >
              <View style={[styles.topCalloutLeft, { flex: 1, minWidth: 0, gap: 8 }, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.badgeIcon, { width: 34, height: 34, borderRadius: 10, flexShrink: 0, backgroundColor: isDarkMode ? themeColors.primaryLight : topCategory.category.color }, isDarkMode && { borderWidth: 1, borderColor: themeColors.border }]}>
                  <MaterialCommunityIcons name={topCategory.category.icon} size={18} color={isDarkMode ? themeColors.primary : '#FFFFFF'} />
                </View>
                <View style={[{ flex: 1, minWidth: 0 }, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                  <Text style={[styles.topCalloutBadge, { fontSize: 10 }, isDarkMode && { color: themeColors.primary }, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                    {isArabic ? 'أعلى بند استهلاك' : 'Highest Category'}
                  </Text>
                  <Text
                    style={[
                      styles.topCalloutName,
                      { fontSize: 12.5, lineHeight: 17 },
                      isDarkMode && { color: themeColors.textPrimary },
                      isArabic && { textAlign: 'right' },
                    ]}
                    numberOfLines={2}
                  >
                    {topCategory.category.name}
                  </Text>
                </View>
              </View>
              <View style={[styles.topCalloutRight, { flexShrink: 0 }, isArabic && { alignItems: 'flex-start' }]}>
                <Text style={[styles.topCalloutAmt, { fontSize: 13.5 }, isDarkMode && { color: themeColors.expense }]}>
                  {formatAmount(topCategory.total)} {currency.symbol}
                </Text>
                <Text style={[styles.topCalloutPct, { fontSize: 10 }, isDarkMode && { color: themeColors.textSecondary }]}>
                  {Math.round(topCategory.percentage)}% {isArabic ? 'من الصرف' : 'of spend'}
                </Text>
              </View>
            </View>
          )}

          {/* All Categories Bars */}
          <View style={styles.categoriesList}>
            {categoryBreakdown.map((item, idx) => {
              const barColor = isOliveDark
                ? (idx % 2 === 0 ? themeColors.primary : themeColors.info)
                : isDarkMode
                ? (idx % 2 === 0 ? themeColors.primary : themeColors.info)
                : item.category.color;
              return (
                <View key={item.category.id} style={styles.catItemRow}>
                  <View style={[styles.catTopRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.catLeftInfo, { flex: 1, minWidth: 0 }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.colorDot, { backgroundColor: barColor }]} />
                      <Text style={[styles.catItemName, isDarkMode && { color: themeColors.textPrimary }, { flexShrink: 1 }]} numberOfLines={1}>
                        {item.category.name}
                      </Text>
                    </View>
                    <View style={[styles.catRightInfo, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Text style={[styles.catAmtText, isDarkMode && { color: themeColors.textPrimary }]}>{formatAmount(item.total)} {currency.symbol}</Text>
                      <Text style={[styles.catPctText, isDarkMode && { color: themeColors.textSecondary }]}>({Math.round(item.percentage)}%)</Text>
                    </View>
                  </View>

                  <View style={[styles.barTrack, isDarkMode && { backgroundColor: themeColors.surfaceSecondary }, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(item.percentage, 4)}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2B. DAILY TOTAL SPENDING IN CURRENT FISCAL MONTH */}
        <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'إجمالي مصاريف كل يوم في الشهر 📅' : 'Daily Total Expenses in Month 📅'}
            </Text>
            <Text style={[styles.cardSub, isDarkMode && { color: themeColors.textSecondary }]}>
              {isArabic
                ? `عدد الأيام التي بها مصروفات: ${dailySpendingList.list.length} يوم • الأحدث أولاً`
                : `Active spending days: ${dailySpendingList.list.length} days • Newest first`}
            </Text>
          </View>

          {dailySpendingList.list.length === 0 ? (
            <Text style={{ fontSize: 12, color: isDarkMode ? themeColors.textSecondary : COLORS.textMuted, textAlign: 'center', paddingVertical: 12 }}>
              {isArabic ? 'لا توجد مصروفات مسجلة في هذا الشهر المالي بعد' : 'No expenses logged in this fiscal month yet'}
            </Text>
          ) : (
            <View style={{ gap: 9 }}>
              {dailySpendingList.list.map((dItem) => {
                const barPct = Math.max(6, Math.round((dItem.total / dailySpendingList.maxDaily) * 100));
                const isPeak = dItem.total === dailySpendingList.maxDaily && dailySpendingList.list.length > 1;
                return (
                  <View
                    key={dItem.date}
                    style={{
                      backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#F8FAFC',
                      borderRadius: 11,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: isDarkMode
                        ? (isPeak ? themeColors.primary : themeColors.border)
                        : (isPeak ? '#FCA5A5' : '#E2E8F0'),
                    }}
                  >
                    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, flexWrap: 'wrap' }, isArabic && { flexDirection: 'row-reverse' }]}>
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: isDarkMode ? themeColors.textPrimary : COLORS.textPrimary }}>
                          {dItem.date}
                        </Text>
                        {!!dItem.dayName && (
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDarkMode ? themeColors.textSecondary : COLORS.textSecondary }}>
                            ({dItem.dayName})
                          </Text>
                        )}
                        <Text style={{ fontSize: 9.5, fontWeight: '700', color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                          • {dItem.count} {isArabic ? 'حركة' : 'tx'}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '900',
                          flexShrink: 0,
                          color: isDarkMode
                            ? (isPeak ? themeColors.expense : themeColors.primary)
                            : (isPeak ? '#DC2626' : COLORS.primaryDark),
                        }}
                      >
                        {formatAmount(dItem.total)} {currency.symbol}
                      </Text>
                    </View>
                    <View style={[styles.barTrack, isDarkMode && { backgroundColor: themeColors.primaryUltraLight }, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${barPct}%`,
                            backgroundColor: isDarkMode
                              ? (isPeak ? themeColors.expense : themeColors.primary)
                              : (isPeak ? '#DC2626' : themeColors.primary),
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. WEEKDAY PATTERN */}
        <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'توزيع الصرف حسب أيام الأسبوع' : 'Spending by Day of Week'}
            </Text>
            <View style={[styles.highestDayPill, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderWidth: 1, borderColor: themeColors.border }]}>
              <Text style={[styles.highestDayText, isDarkMode && { color: themeColors.primary }]}>
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
                  <Text style={[styles.colAmt, isDarkMode && { color: themeColors.textSecondary }]}>
                    {day.total > 0 ? formatAmount(day.total) : '0'}
                  </Text>
                  <View style={[styles.colTrack, isDarkMode && { backgroundColor: themeColors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.colFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: isDarkMode
                            ? (isMax ? themeColors.expense : themeColors.primary)
                            : (isMax ? '#EF4444' : COLORS.primary),
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.colName,
                      isDarkMode && { color: themeColors.textSecondary },
                      (day.id === 4 || day.name === 'الخميس' || day.name.length > 5) && { fontSize: 8.5 },
                      isMax && [styles.colNameMax, isDarkMode && { color: themeColors.primary }],
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
        <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'أكبر 10 مصاريف مسجلة' : 'Top 10 Biggest Expenses'}
            </Text>
            <Text style={[styles.cardSub, isDarkMode && { color: themeColors.textSecondary }]}>
              {isArabic ? 'أعلى المعاملات الفردية قيمة في هذه الدورة' : 'Largest individual transactions recorded this period'}
            </Text>
          </View>

          {top10Expenses.map((tx, idx) => (
            <View key={tx.id} style={[styles.top10Row, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.top10RankBox, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderWidth: 1, borderColor: themeColors.border }, isArabic ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10 }]}>
                <Text style={[styles.top10RankText, isDarkMode && { color: themeColors.primary }]}>#{idx + 1}</Text>
              </View>

              <View style={[styles.top10Middle, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={[styles.top10Note, isDarkMode && { color: themeColors.textPrimary }]} numberOfLines={1}>
                  {tx.note || tx.categoryId}
                </Text>
                <Text style={[styles.top10Date, isDarkMode && { color: themeColors.textMuted }]}>{tx.date}</Text>
              </View>

              <Text style={[styles.top10Amt, isDarkMode && { color: themeColors.expense }]}>
                -{formatAmount(tx.amount)} {currency.symbol}
              </Text>
            </View>
          ))}
        </View>

        {/* 5. CREDIT CARD BILLS & GRACE PERIODS */}
        <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.cardHeader, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'مديونيات ومواعيد سداد بطاقات الائتمان 💳' : 'Credit Card Bills & Due Dates 💳'}
            </Text>
            <Text style={[styles.cardSub, isDarkMode && { color: themeColors.textSecondary }]}>
              {isArabic
                ? 'القاعدة: أي شراء بالكارت يستحق قبل يوم 25 من الشهر التالي'
                : 'Rule: Any credit card purchase is due before the 25th of the FOLLOWING month'}
            </Text>
          </View>

          <View style={styles.billsTable}>
            {/* Arab Bank due this month */}
            <View style={[styles.billRow, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={[styles.billName, isDarkMode && { color: themeColors.textPrimary }]}>
                  {isArabic ? 'البنك العربي (الشهر الحالي)' : 'Arab Bank (Current Month)'}
                </Text>
                <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                  {isArabic
                    ? `${formatAmount(balances.ccArCarryOverLeft)} مرحل + ${formatAmount(balances.ccArPurchasesDueThisMonth)} مشتريات مستحقة`
                    : `${formatAmount(balances.ccArCarryOverLeft)} carry-over + ${formatAmount(balances.ccArPurchasesDueThisMonth)} due purchases`}
                </Text>
              </View>
              <Text style={[styles.billDue, isDarkMode && { color: themeColors.textSecondary }]}>
                {isArabic ? `مستحق ${balances.currentMonthDueDate}` : `Due ${balances.currentMonthDueDate}`}
              </Text>
              <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.expense : '#DC2626' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.ccArDueThisMonth)} {currency.symbol}
              </Text>
            </View>

            {/* Arab Bank due next month */}
            {balances.ccArDueNextMonth > 0 && (
              <View style={[styles.billRow, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.billName, isDarkMode && { color: themeColors.textPrimary }]}>
                    {isArabic ? 'البنك العربي (الشهر القادم)' : 'Arab Bank (Next Month)'}
                  </Text>
                  <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                    {isArabic ? 'مشتريات تُسدد الشهر القادم' : 'Purchases due next month'}
                  </Text>
                </View>
                <Text style={[styles.billDue, isDarkMode && { color: themeColors.textSecondary }]}>
                  {isArabic ? `مستحق ${balances.nextMonthDueDate}` : `Due ${balances.nextMonthDueDate}`}
                </Text>
                <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.warning : '#EA580C' }, isArabic && { textAlign: 'left' }]}>
                  {formatAmount(balances.ccArDueNextMonth)} {currency.symbol}
                </Text>
              </View>
            )}

            {/* Credit Agricole due this month if any */}
            {balances.ccCaDueThisMonth > 0 && (
              <View style={[styles.billRow, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.billName, isDarkMode && { color: themeColors.textPrimary }]}>
                    {isArabic ? 'كريدي أجريكول (الشهر الحالي)' : 'Crédit Agricole (Current Month)'}
                  </Text>
                  <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                    {isArabic ? 'مشتريات الشهر السابق المستحقة هذا الشهر' : 'Previous month purchases due this month'}
                  </Text>
                </View>
                <Text style={[styles.billDue, isDarkMode && { color: themeColors.textSecondary }]}>
                  {isArabic ? `مستحق ${balances.currentMonthDueDate}` : `Due ${balances.currentMonthDueDate}`}
                </Text>
                <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.expense : '#DC2626' }, isArabic && { textAlign: 'left' }]}>
                  {formatAmount(balances.ccCaDueThisMonth)} {currency.symbol}
                </Text>
              </View>
            )}

            {/* Credit Agricole due next month */}
            <View style={[styles.billRow, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={[styles.billName, isDarkMode && { color: themeColors.textPrimary }]}>
                  {isArabic ? 'كريدي أجريكول (الشهر القادم)' : 'Crédit Agricole (Next Month)'}
                </Text>
                <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                  {isArabic
                    ? `مشتريات الشهر الحالي • تُسدد يوم 25 الشهر التالي`
                    : `Current month purchases • Due 25th next month`}
                </Text>
              </View>
              <Text style={[styles.billDue, isDarkMode && { color: themeColors.textSecondary }]}>
                {isArabic ? `مستحق ${balances.nextMonthDueDate}` : `Due ${balances.nextMonthDueDate}`}
              </Text>
              <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.warning : '#D97706' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.ccCaDueNextMonth)} {currency.symbol}
              </Text>
            </View>

            {/* Custom Credit Cards in Insights Table */}
            {(balances.customCreditCardsSummary || []).map((cCard) => (
              <View key={cCard.id} style={[styles.billRow, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.billName, isDarkMode && { color: themeColors.textPrimary }]}>{cCard.bankName} (CC)</Text>
                  <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                    {isArabic
                      ? `هذا الشهر: ${formatAmount(cCard.dueThisMonth)} • القادم: ${formatAmount(cCard.dueNextMonth)}`
                      : `This month: ${formatAmount(cCard.dueThisMonth)} • Next: ${formatAmount(cCard.dueNextMonth)}`}
                  </Text>
                </View>
                <Text style={[styles.billDue, isDarkMode && { color: themeColors.textSecondary }]}>
                  {cCard.dueThisMonth > 0 ? balances.currentMonthDueDate : balances.nextMonthDueDate}
                </Text>
                <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.warning : '#D97706' }, isArabic && { textAlign: 'left' }]}>
                  {formatAmount(cCard.totalDebt)} {currency.symbol}
                </Text>
              </View>
            ))}

            {/* Summary by Due Date: Due This Month vs Due Next Month */}
            <View
              style={[
                styles.billRow,
                { backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#FEF2F2', paddingHorizontal: 10, borderRadius: 10, borderWidth: isDarkMode ? 1 : 0, borderColor: themeColors.border },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text style={[styles.billName, { color: isDarkMode ? themeColors.expense : '#991B1B', flex: 1.4 }, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `واجب السداد قبل ${balances.currentMonthDueDate} (باقي ${balances.daysUntilCurrentDue} يوم)`
                  : `Total Due Before ${balances.currentMonthDueDate} (${balances.daysUntilCurrentDue}d left)`}
              </Text>
              <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.expense : '#DC2626' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcDueThisMonth)} {currency.symbol}
              </Text>
            </View>

            <View
              style={[
                styles.billRow,
                { backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#FFFBEB', paddingHorizontal: 10, borderRadius: 10, marginTop: 4, borderWidth: isDarkMode ? 1 : 0, borderColor: themeColors.border },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
            >
              <Text style={[styles.billName, { color: isDarkMode ? themeColors.warning : '#92400E', flex: 1.4 }, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `مستحق قبل ${balances.nextMonthDueDate} (${balances.daysUntilNextDue} يوم سماح)`
                  : `Total Due Before ${balances.nextMonthDueDate} (${balances.daysUntilNextDue}d grace)`}
              </Text>
              <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.warning : '#D97706' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcDueNextMonth)} {currency.symbol}
              </Text>
            </View>

            <View style={[styles.billRow, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={[{ flex: 1.4 }, isArabic && { alignItems: 'flex-end' }]}>
                <Text style={[styles.billName, isDarkMode && { color: themeColors.textPrimary }]}>
                  {isArabic ? 'إجمالي المسدد للكروت' : 'Total Card Payments Made'}
                </Text>
                <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.textMuted : COLORS.textMuted }}>
                  {isArabic
                    ? `عربي: ${formatAmount(balances.ccArPaid)} • أجريكول: ${formatAmount(balances.ccCaPaid)}`
                    : `Arab Bank: ${formatAmount(balances.ccArPaid)} • Crédit Agricole: ${formatAmount(balances.ccCaPaid)}`}
                </Text>
              </View>
              <Text style={[styles.billDue, isDarkMode && { color: themeColors.textSecondary }]}>{isArabic ? 'تم السداد ✅' : 'Paid ✅'}</Text>
              <Text style={[styles.billAmt, { color: isDarkMode ? themeColors.income : '#059669' }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcPaid)} {currency.symbol}
              </Text>
            </View>

            <View style={[styles.billRow, styles.billTotalRow, isDarkMode && { borderTopColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.billTotalText, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
                {isArabic ? 'إجمالي مديونية الكروت الكلية (الحالي + القادم)' : 'Total Combined Credit Card Debt'}
              </Text>
              <Text style={[styles.billTotalAmt, isDarkMode && { color: themeColors.expense }, isArabic && { textAlign: 'left' }]}>
                {formatAmount(balances.totalCcDebt)} {currency.symbol}
              </Text>
            </View>
          </View>

          {/* Live Credit Card Transactions List with Grace Period */}
          {ccTransactions.length > 0 && (
            <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? themeColors.border : '#E2E8F0' }}>
              <Text
                style={[
                  { fontSize: 13, fontWeight: '800', color: isDarkMode ? themeColors.textPrimary : COLORS.textPrimary, marginBottom: 8 },
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
                  <View key={tx.id} style={[styles.top10Row, isDarkMode && { borderBottomColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.top10Middle, isArabic && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.top10Note, isDarkMode && { color: themeColors.textPrimary }]} numberOfLines={1}>
                        {tx.note || cardLabel}
                      </Text>
                      <Text style={[styles.top10Date, isDarkMode && { color: themeColors.textMuted }]}>{tx.date} • {cardLabel}</Text>
                      {grace && (
                        <Text style={{ fontSize: 10, color: isDarkMode ? themeColors.primary : '#2563EB', fontWeight: '700', marginTop: 2 }}>
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
