import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { PAYMENT_METHODS } from '../constants/categories';

export const AnalyticsScreen = () => {
  const {
    categoryBreakdown,
    monthTransactions,
    balances,
    currency,
    formatAmount,
  } = useExpense();

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Weekday pattern analysis (matching Excel Insights sheet)
  const weekdayAnalysis = useMemo(() => {
    const days = [
      { id: 0, name: 'الأحد', total: 0, count: 0 },
      { id: 1, name: 'الاثنين', total: 0, count: 0 },
      { id: 2, name: 'الثلاثاء', total: 0, count: 0 },
      { id: 3, name: 'الأربعاء', total: 0, count: 0 },
      { id: 4, name: 'الخميس', total: 0, count: 0 },
      { id: 5, name: 'الجمعة', total: 0, count: 0 },
      { id: 6, name: 'السبت', total: 0, count: 0 },
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
  }, [monthTransactions]);

  // Payment method distribution
  const paymentBreakdown = useMemo(() => {
    return PAYMENT_METHODS.map((pm) => {
      const sum = monthTransactions
        .filter((t) => t.type === 'expense' && t.paymentMethod === pm.id && t.categoryId !== 'switch' && t.categoryId !== 'cc_pyd')
        .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
      const percent = balances.realTotalSpent > 0 ? (sum / balances.realTotalSpent) * 100 : 0;
      return { ...pm, sum, percent };
    }).filter((pm) => pm.sum > 0);
  }, [monthTransactions, balances.realTotalSpent]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التحليلات وتوزيع المصروفات</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* #1 Top Spending Category Spotlight */}
        {topCategory && (
          <View style={[styles.topSpotlightCard, SHADOWS.medium, { borderColor: topCategory.category.color }]}>
            <View style={styles.spotlightBadge}>
              <MaterialCommunityIcons name="fire" size={14} color="#DC2626" />
              <Text style={styles.spotlightBadgeText}>أكثر بند تم الصرف عليه</Text>
            </View>

            <View style={styles.spotlightMain}>
              <View style={[styles.spotlightIcon, { backgroundColor: topCategory.category.bgColor }]}>
                <MaterialCommunityIcons
                  name={topCategory.category.icon}
                  size={32}
                  color={topCategory.category.color}
                />
              </View>

              <View style={styles.spotlightTexts}>
                <Text style={styles.spotlightName}>{topCategory.category.name}</Text>
                <Text style={styles.spotlightSub}>
                  إجمالي {topCategory.count} معاملات استهلاكية
                </Text>
              </View>

              <View style={styles.spotlightNumbers}>
                <Text style={[styles.spotlightAmount, { color: topCategory.category.color }]}>
                  {formatAmount(topCategory.total)} {currency.symbol}
                </Text>
                <Text style={styles.spotlightShare}>
                  {Math.round(topCategory.percentage)}% من كامل مصاريفك
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Overview Stats (Pace & Safety) */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, SHADOWS.small]}>
            <Text style={styles.statLabel}>المعدل اليومي</Text>
            <Text style={styles.statValue}>
              {formatAmount(balances.avgPerDay)} {currency.symbol}
            </Text>
            <Text style={styles.statSub}>متوسط استهلاكك اليومي</Text>
          </View>

          <View style={[styles.statBox, SHADOWS.small]}>
            <Text style={styles.statLabel}>السيولة تكفي</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              {balances.daysMoneyLasts} يوماً
            </Text>
            <Text style={styles.statSub}>بناءً على نفس معدل الصرف</Text>
          </View>
        </View>

        {/* All Categories Visual Bar Chart */}
        <View style={[styles.sectionCard, SHADOWS.small]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCount}>
              مرتبة من الأعلى للأقل
            </Text>
            <Text style={styles.sectionTitle}>الرسم البياني لكافة بنود الصرف</Text>
          </View>

          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((item, idx) => (
              <View key={item.category.id} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <View style={styles.catRight}>
                    <Text style={styles.catRank}>#{idx + 1}</Text>
                    <View
                      style={[
                        styles.catIconWrap,
                        { backgroundColor: item.category.bgColor },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.category.icon}
                        size={18}
                        color={item.category.color}
                      />
                    </View>
                    <View>
                      <Text style={styles.catName}>{item.category.name}</Text>
                      <Text style={styles.catCount}>
                        {item.count} حركات
                      </Text>
                    </View>
                  </View>

                  <View style={styles.catLeft}>
                    <Text style={styles.catAmount}>
                      {formatAmount(item.total)} {currency.symbol}
                    </Text>
                    <Text style={styles.catPercent}>
                      {Math.round(item.percentage)}%
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catProgress,
                      {
                        width: `${Math.max(item.percentage, 3)}%`,
                        backgroundColor: item.category.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>لا توجد بيانات مصروفات بعد</Text>
          )}
        </View>

        {/* Weekday Spending Pattern (from Excel Insights) */}
        <View style={[styles.sectionCard, SHADOWS.small, { marginTop: 14 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.maxDayPill}>
              <Text style={styles.maxDayPillText}>
                الأعلى: {weekdayAnalysis.maxDay.name} ({formatAmount(weekdayAnalysis.maxDay.total)} {currency.symbol})
              </Text>
            </View>
            <Text style={styles.sectionTitle}>نمط الصرف بأيام الأسبوع</Text>
          </View>

          <View style={styles.weekdayBars}>
            {weekdayAnalysis.days.map((day) => {
              const maxVal = weekdayAnalysis.maxDay.total || 1;
              const barHeightPercent = Math.max(8, Math.round((day.total / maxVal) * 100));
              const isHighest = day.id === weekdayAnalysis.maxDay.id && day.total > 0;

              return (
                <View key={day.id} style={styles.weekdayCol}>
                  <Text style={styles.weekdayAmt}>
                    {day.total > 0 ? formatAmount(day.total) : '-'}
                  </Text>
                  <View style={styles.weekdayTrack}>
                    <View
                      style={[
                        styles.weekdayFill,
                        {
                          height: `${barHeightPercent}%`,
                          backgroundColor: isHighest ? '#EF4444' : COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.weekdayLabel, isHighest && styles.weekdayLabelHighest]}>
                    {day.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Payment Methods Breakdown */}
        {paymentBreakdown.length > 0 && (
          <View style={[styles.sectionCard, SHADOWS.small, { marginTop: 14 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>
              المصروفات حسب طريقة الدفع
            </Text>
            {paymentBreakdown.map((pm) => (
              <View key={pm.id} style={styles.pmRow}>
                <View style={styles.pmRight}>
                  <Text style={styles.pmName}>{pm.name}</Text>
                </View>
                <View style={styles.pmLeft}>
                  <Text style={styles.pmAmount}>
                    {formatAmount(pm.sum)} {currency.symbol}
                  </Text>
                  <Text style={styles.pmPercent}>
                    ({Math.round(pm.percent)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  topSpotlightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    marginBottom: 14,
  },
  spotlightBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  spotlightBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  spotlightMain: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightTexts: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  spotlightName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    writingDirection: 'rtl',
  },
  spotlightSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  spotlightNumbers: {
    alignItems: 'flex-start',
  },
  spotlightAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  spotlightShare: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  catRow: {
    marginBottom: 14,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  catRank: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    width: 20,
    textAlign: 'center',
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    writingDirection: 'rtl',
  },
  catCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  catLeft: {
    alignItems: 'flex-start',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catPercent: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  catTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  catProgress: {
    height: '100%',
    borderRadius: 4,
  },
  maxDayPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  maxDayPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  weekdayBars: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingBottom: 6,
  },
  weekdayCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  weekdayAmt: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  weekdayTrack: {
    width: 14,
    height: 75,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekdayFill: {
    width: '100%',
    borderRadius: 7,
  },
  weekdayLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  weekdayLabelHighest: {
    color: '#DC2626',
    fontWeight: '800',
  },
  pmRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pmRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  pmName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pmLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pmAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pmPercent: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: 20,
  },
});
