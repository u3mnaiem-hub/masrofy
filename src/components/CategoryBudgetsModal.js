import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { useExpense } from '../context/ExpenseContext';

export const CategoryBudgetsModal = ({ visible, onClose }) => {
  const {
    categoryBudgets,
    setCategoryBudget,
    budgetStatus,
    monthTransactions,
    currency,
    formatAmount,
    isArabic,
  } = useExpense();

  const [inputs, setInputs] = useState({});
  const [editingCatId, setEditingCatId] = useState(null);

  useEffect(() => {
    if (visible) {
      const initInputs = {};
      EXPENSE_CATEGORIES.forEach((cat) => {
        initInputs[cat.id] = categoryBudgets?.[cat.id] ? String(categoryBudgets[cat.id]) : '';
      });
      setInputs(initInputs);
      setEditingCatId(null);
    }
  }, [visible, categoryBudgets]);

  // Calculate spending per category in current month
  const spentPerCat = {};
  (monthTransactions || []).forEach((t) => {
    if (t.type === 'expense' && t.categoryId !== 'switch' && t.categoryId !== 'cc_pyd') {
      const amt = parseFloat(t.amount) || 0;
      spentPerCat[t.categoryId] = (spentPerCat[t.categoryId] || 0) + amt;
    }
  });

  const handleSaveCategoryLimit = async (catId) => {
    const rawVal = (inputs[catId] || '').trim();
    const val = parseFloat(rawVal) || 0;
    await setCategoryBudget(catId, val);
    setEditingCatId(null);
  };

  const handleClearLimit = async (catId) => {
    setInputs((prev) => ({ ...prev, [catId]: '' }));
    await setCategoryBudget(catId, 0);
    setEditingCatId(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.headerTitle}>
              {isArabic ? 'ميزانيات البنود وتنبيهات التجاوز 🎯' : 'Category Budgets & Alerts 🎯'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isArabic
                ? 'حدد حداً أقصى لكل بند؛ وسينبهك التطبيق فور اقتراب أو تجاوز الحد'
                : 'Set limits per category to receive instant overspending alerts'}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Info Card */}
          <View style={[styles.infoCard, isArabic && { alignItems: 'flex-end' }]}>
            <View style={[styles.infoCardRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#D97706" />
              <Text style={styles.infoCardTitle}>
                {isArabic ? 'كيف يعمل تنبيه تجاوز البنود؟' : 'How do category alerts work?'}
              </Text>
            </View>
            <Text style={[styles.infoCardText, isArabic && { textAlign: 'right' }]}>
              {isArabic
                ? '• عند وصول استهلاك البند إلى 80% من الحد المحدد، يظهر تنبيه أصفر للتحذير.\n• عند تجاوز الـ 100% يظهر إشعار وتنبيه فوري أثناء تسجيل المعاملة لمنع الإفراط في الصرف.'
                : '• At 80% of category limit, a yellow warning is triggered.\n• At 100%+ spent, an instant red alert warns you upon logging any new expense.'}
            </Text>
          </View>

          {/* Categories List */}
          {EXPENSE_CATEGORIES.map((cat) => {
            const spent = spentPerCat[cat.id] || 0;
            const limit = parseFloat(categoryBudgets?.[cat.id]) || 0;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isEditing = editingCatId === cat.id;

            let badgeColor = '#10B981'; // Green (Safe)
            let badgeBg = '#D1FAE5';
            let badgeText = isArabic ? 'آمن' : 'Safe';
            if (limit > 0) {
              if (pct >= 100) {
                badgeColor = '#EF4444'; // Red (Exceeded)
                badgeBg = '#FEE2E2';
                badgeText = isArabic ? `تم التجاوز (${pct}%)` : `Exceeded (${pct}%)`;
              } else if (pct >= 80) {
                badgeColor = '#F59E0B'; // Yellow (Near limit)
                badgeBg = '#FEF3C7';
                badgeText = isArabic ? `قارب على النفاد (${pct}%)` : `Near limit (${pct}%)`;
              } else {
                badgeText = `${pct}%`;
              }
            }

            return (
              <View key={cat.id} style={[styles.categoryCard, SHADOWS.small]}>
                <View style={[styles.cardTopRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.categoryMeta, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.iconCircle, { backgroundColor: cat.bgColor }]}>
                      <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <View style={isArabic ? { alignItems: 'flex-end' } : undefined}>
                      <Text style={styles.categoryName}>
                        {isArabic ? cat.nameAr : cat.name}
                      </Text>
                      <Text style={styles.spentText}>
                        {isArabic
                          ? `المنصرف هذا الشهر: ${formatAmount(spent)} ${currency.symbol}`
                          : `Spent this month: ${formatAmount(spent)} ${currency.symbol}`}
                      </Text>
                    </View>
                  </View>

                  {limit > 0 && (
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar (if limit is configured) */}
                {limit > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: badgeColor,
                          },
                        ]}
                      />
                    </View>
                    <View style={[styles.progressLabels, isArabic && { flexDirection: 'row-reverse' }]}>
                      <Text style={styles.progressSub}>
                        {isArabic
                          ? `الحد: ${formatAmount(limit)} ${currency.symbol}`
                          : `Limit: ${formatAmount(limit)} ${currency.symbol}`}
                      </Text>
                      <Text style={[styles.progressSub, { color: limit - spent < 0 ? '#EF4444' : '#10B981' }]}>
                        {limit - spent >= 0
                          ? isArabic ? `متبقي: ${formatAmount(limit - spent)}` : `Left: ${formatAmount(limit - spent)}`
                          : isArabic ? `عجز: ${formatAmount(spent - limit)}` : `Over by: ${formatAmount(spent - limit)}`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Edit / Input Row */}
                {isEditing ? (
                  <View style={[styles.editRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <TextInput
                      style={[styles.limitInput, isArabic && { textAlign: 'right' }]}
                      keyboardType="numeric"
                      placeholder={isArabic ? 'اكتب الحد الأقصى (مثلاً: 2500)' : 'Enter monthly limit (e.g. 2500)'}
                      value={inputs[cat.id]}
                      onChangeText={(v) => setInputs((prev) => ({ ...prev, [cat.id]: v }))}
                      autoFocus={true}
                    />
                    <TouchableOpacity
                      style={styles.saveLimitBtn}
                      onPress={() => handleSaveCategoryLimit(cat.id)}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.saveLimitBtnText}>{isArabic ? 'حفظ' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelLimitBtn}
                      onPress={() => setEditingCatId(null)}
                    >
                      <Text style={styles.cancelLimitBtnText}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
                    </TouchableOpacity>
                    {limit > 0 && (
                      <TouchableOpacity
                        style={styles.deleteLimitBtn}
                        onPress={() => handleClearLimit(cat.id)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={[styles.actionRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[styles.setLimitBtn, limit > 0 && styles.setLimitBtnActive]}
                      onPress={() => setEditingCatId(cat.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={limit > 0 ? 'pencil-outline' : 'plus-circle-outline'}
                        size={16}
                        color={limit > 0 ? '#1D4ED8' : '#4B5563'}
                      />
                      <Text style={[styles.setLimitBtnText, limit > 0 && { color: '#1D4ED8' }]}>
                        {limit > 0
                          ? isArabic ? 'تعديل الحد الأقصى' : 'Edit Limit'
                          : isArabic ? '+ وضع حد أقصى وتنبيه لهذا البند' : '+ Set Budget Limit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  infoCardText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  spentText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  setLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  setLimitBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  setLimitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  limitInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  saveLimitBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveLimitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelLimitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  cancelLimitBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteLimitBtn: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
});
