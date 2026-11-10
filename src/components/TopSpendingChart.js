import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const TopSpendingChart = ({ onSeeAll }) => {
  const { categoryBreakdown, currency, formatAmount, isArabic, isDarkMode, themeColors } = useExpense();

  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return null;
  }

  const topCategory = categoryBreakdown[0];
  const topCategories = categoryBreakdown.slice(0, 4);

  return (
    <View style={[styles.card, SHADOWS.small, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      {/* Header */}
      <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.titleRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <MaterialCommunityIcons name="chart-bar" size={20} color={isDarkMode ? themeColors.primary : COLORS.primaryDark} />
          <Text style={[styles.title, isDarkMode && { color: themeColors.textPrimary }]}>
            {isArabic ? 'أكثر البنود استهلاكاً' : 'Top Spends'}
          </Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>{isArabic ? 'التفاصيل كاملة' : 'Full Details'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* #1 Top Category Spotlight Banner */}
      {topCategory && (
        <View
          style={[
            styles.topSpotlight,
            { backgroundColor: topCategory.category.bgColor, borderColor: topCategory.category.color },
            isArabic && { flexDirection: 'row-reverse' },
          ]}
        >
          <View
            style={[
              styles.spotlightRight,
              isArabic ? { flexDirection: 'row-reverse', marginLeft: 8 } : { marginRight: 8 },
            ]}
          >
            <View style={[styles.spotlightIconBox, { backgroundColor: topCategory.category.color }]}>
              <MaterialCommunityIcons name={topCategory.category.icon} size={22} color="#FFFFFF" />
            </View>
            <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
              <View style={[styles.tagBadge, isArabic && { alignSelf: 'flex-end' }]}>
                <Text style={styles.tagText}>{isArabic ? 'الأعلى استهلاكاً 🔥' : 'Top Spend 🔥'}</Text>
              </View>
              <Text
                style={[styles.spotlightName, isArabic && { textAlign: 'right' }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {isArabic ? (topCategory.category.nameAr || topCategory.category.name) : topCategory.category.name}
              </Text>
            </View>
          </View>

          <View style={[styles.spotlightLeft, isArabic && { alignItems: 'flex-start' }]}>
            <Text
              style={[styles.spotlightAmount, { color: topCategory.category.color }]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {formatAmount(topCategory.total)} {currency.symbol}
            </Text>
            <Text style={styles.spotlightPercent}>
              {Math.round(topCategory.percentage)}% {isArabic ? 'من الصرف' : 'of spending'}
            </Text>
          </View>
        </View>
      )}

      {/* Visual Bar Charts */}
      <View style={styles.barsContainer}>
        {topCategories.map((item) => {
          return (
            <View key={item.category.id} style={styles.barItem}>
              <View style={[styles.barHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.barRightInfo, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.miniDot, { backgroundColor: item.category.color }]} />
                  <Text style={styles.barName} numberOfLines={1}>
                    {item.category.name}
                  </Text>
                </View>

                <View style={[styles.barLeftInfo, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.barAmount}>
                    {formatAmount(item.total)} {currency.symbol}
                  </Text>
                  <Text style={styles.barPercent}>
                    ({Math.round(item.percentage)}%)
                  </Text>
                </View>
              </View>

              <View style={[styles.track, isArabic && { flexDirection: 'row-reverse' }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(item.percentage, 4)}%`,
                      backgroundColor: item.category.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  topSpotlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  spotlightRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  spotlightIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
  },
  spotlightName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  spotlightLeft: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  spotlightAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  spotlightPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  barsContainer: {
    gap: 12,
  },
  barItem: {
    gap: 6,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  barLeftInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  barAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  barPercent: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  track: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
