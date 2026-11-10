import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const BudgetBar = () => {
  const {
    monthlyBudget,
    totalExpense,
    budgetProgress,
    budgetRemaining,
    isOverBudget,
    currency,
    formatAmount,
  } = useExpense();

  if (!monthlyBudget || monthlyBudget <= 0) {
    return null;
  }

  // Determine color status based on usage
  let barColor = COLORS.primary;
  let statusText = 'وضع الميزانية ممتاز ومستقر 🟢';
  let badgeBg = COLORS.primaryLight;
  let badgeText = COLORS.primaryDark;

  if (isOverBudget) {
    barColor = COLORS.expense;
    statusText = `تجاوزت الميزانية بـ ${formatAmount(Math.abs(budgetRemaining))} ${currency.symbol} 🚨`;
    badgeBg = COLORS.expenseLight;
    badgeText = COLORS.expenseDark;
  } else if (budgetProgress >= 85) {
    barColor = COLORS.warning;
    statusText = `تنبيه: استهلكت ${Math.round(budgetProgress)}% من الميزانية ⚠️`;
    badgeBg = COLORS.warningLight;
    badgeText = '#B45309';
  } else if (budgetProgress >= 60) {
    statusText = `استهلكت ${Math.round(budgetProgress)}% - متبقي ${formatAmount(budgetRemaining)} ${currency.symbol}`;
  } else {
    statusText = `متبقي في الميزانية: ${formatAmount(budgetRemaining)} ${currency.symbol}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>الميزانية الشهرية المقررة</Text>
        <Text style={styles.budgetValue}>
          {formatAmount(monthlyBudget)} {currency.symbol}
        </Text>
      </View>

      {/* Progress track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(budgetProgress, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeLabel, { color: badgeText }]}>
            {statusText}
          </Text>
        </View>
        <Text style={styles.percentageText}>
          {Math.round(budgetProgress)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    writingDirection: 'rtl',
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressTrack: {
    height: 10,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  footerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 1,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});
