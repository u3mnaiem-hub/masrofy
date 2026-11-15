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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const SmartFeaturesModal = ({ visible, onClose, initialTab = 'recurring' }) => {
  const {
    isArabic,
    isDarkMode,
    themeColors,
    currency,
    formatAmount,
    recurringBills,
    addRecurringBill,
    deleteRecurringBill,
    applyRecurringBillNow,
    savingsGoals,
    addSavingsGoal,
    depositToSavingsGoal,
    deleteSavingsGoal,
    allPaymentMethods,
  } = useExpense();

  const [tab, setTab] = useState(initialTab === 'savings' ? 'savings' : 'recurring');

  useEffect(() => {
    if (visible) {
      setTab(initialTab === 'savings' ? 'savings' : 'recurring');
    }
  }, [visible, initialTab]);

  // Recurring Bill state
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billPm, setBillPm] = useState('csh');

  // Savings Goal state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [depositAmounts, setDepositAmounts] = useState({});

  const handleAddBill = async () => {
    if (!billTitle.trim() || !(parseFloat(billAmount) > 0)) {
      Alert.alert(
        isArabic ? 'تنبيه' : 'Alert',
        isArabic ? 'يرجى إدخال اسم الفاتورة وقيمتها' : 'Please enter bill title and amount'
      );
      return;
    }
    await addRecurringBill({
      title: billTitle,
      amount: parseFloat(billAmount),
      paymentMethod: billPm,
    });
    setBillTitle('');
    setBillAmount('');
  };

  const handleAddGoal = async () => {
    if (!goalTitle.trim() || !(parseFloat(goalTarget) > 0)) {
      Alert.alert(
        isArabic ? 'تنبيه' : 'Alert',
        isArabic ? 'يرجى إدخال اسم الهدف والمبلغ المستهدف' : 'Please enter goal title and target amount'
      );
      return;
    }
    await addSavingsGoal({
      title: goalTitle,
      targetAmount: parseFloat(goalTarget),
      savedAmount: parseFloat(goalSaved) || 0,
    });
    setGoalTitle('');
    setGoalTarget('');
    setGoalSaved('');
  };

  const curMonth = new Date().toISOString().slice(0, 7);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, isDarkMode && { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.title, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'الفواتير المتكررة وأهداف الادخار ✨' : 'Recurring Bills & Savings Goals ✨'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={isDarkMode ? themeColors.textPrimary : COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs (Only Recurring & Savings — Theme & Lock moved to Settings) */}
          <View style={[styles.tabsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {[
              { id: 'recurring', label: isArabic ? 'فواتير متكررة 📅' : 'Recurring Bills 📅' },
              { id: 'savings', label: isArabic ? 'أهداف الادخار 🎯' : 'Savings Goals 🎯' },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[
                    styles.tabBtn,
                    active && { backgroundColor: themeColors.primary },
                  ]}
                >
                  <Text style={[styles.tabText, active && { color: '#FFFFFF', fontWeight: '800' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 34 }}>
            {tab === 'recurring' && (
              <View>
                {/* Comprehensive Explanation Box for Recurring Bills */}
                <View
                  style={[
                    styles.guideBox,
                    {
                      backgroundColor: isDarkMode ? themeColors.surfaceSecondary : (themeColors.primaryUltraLight || '#ECFDF5'),
                      borderColor: themeColors.primary,
                    },
                  ]}
                >
                  <View style={[styles.guideHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={themeColors.primaryDark} />
                    <Text style={[styles.guideTitle, { color: isDarkMode ? themeColors.primary : themeColors.primaryDark }, isArabic && { textAlign: 'right' }]}>
                      {isArabic ? '📖 ما هو مفهوم الفواتير المتكررة وكيف تستخدمه؟' : '📖 What are Recurring Bills & How to Use Them?'}
                    </Text>
                  </View>
                  <Text style={[styles.guideBodyText, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? '• المفهوم: الفواتير المتكررة هي التزاماتك المالية الثابتة التي تدفعها بشكل دوري كل شهر بنفس القيمة تقريباً (مثل: إيجار السكن، فاتورة الإنترنت المنزلي، باقة الموبايل، اشتراك الجيم أو النادي، الأقساط الشهرية، أو مصاريف المدارس).\n' +
                        '• الفائدة: بدلاً من إعادة كتابة اسم الفاتورة وقيمتها ووسيلة الدفع يدوياً كل شهر، تحفظها هنا مرة واحدة فقط كقالب جاهز.\n' +
                        '• طريقة الاستخدام خطوة بخطوة:\n' +
                        '  1️⃣ أدخل اسم الفاتورة ومبلغها الشهري واختر وسيلة الدفع (كاش، حساب بنكي DC، أو كارت ائتمان) ثم اضغط «إضافة للمصاريف المتكررة».\n' +
                        '  2️⃣ عند سداد الفاتورة في أي شهر، اضغط فقط على زر «تسجيل الصرف الآن ⚡» بجانبها.\n' +
                        '  3️⃣ سيقوم التطبيق تلقائياً بإضافتها في معاملات الشهر الحالي وخصمها من رصيدك، ويتحول الزر إلى «تم هذا الشهر ✓» باللون الأخضر لتعرف ما تم سداده وما لم يُسدد بعد!'
                      : '• Concept: Recurring bills are fixed monthly obligations (e.g., Rent, Home Internet, Mobile Plan, Gym, Installments).\n' +
                        '• Benefit: Save them once as templates instead of typing them manually every month.\n' +
                        '• How to Use:\n' +
                        '  1️⃣ Enter the bill name, monthly amount, and payment method, then tap "Add Recurring Bill".\n' +
                        '  2️⃣ Whenever you pay the bill each month, simply tap "Record Now ⚡".\n' +
                        '  3️⃣ It automatically logs the expense into your current month transactions and marks it as "Paid ✓" for this month!'}
                  </Text>
                </View>

                <View style={[styles.formCard, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                  <TextInput
                    style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                    placeholder={isArabic ? 'اسم الفاتورة (مثال: إيجار، نت منزلي، جيم)' : 'Bill Name (e.g. Rent, Internet)'}
                    placeholderTextColor={COLORS.textMuted}
                    value={billTitle}
                    onChangeText={setBillTitle}
                  />
                  <TextInput
                    style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                    placeholder={isArabic ? 'المبلغ الشهري' : 'Monthly Amount'}
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={billAmount}
                    onChangeText={setBillAmount}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6 }}>
                    {(allPaymentMethods || []).map((pm) => (
                      <TouchableOpacity
                        key={pm.id}
                        onPress={() => setBillPm(pm.id)}
                        style={[
                          styles.pmChip,
                          billPm === pm.id && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                        ]}
                      >
                        <Text style={[styles.pmChipText, billPm === pm.id && { color: '#FFFFFF' }]}>
                          {isArabic ? pm.shortNameAr || pm.nameAr : pm.shortName || pm.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]} onPress={handleAddBill}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      {isArabic ? 'إضافة للمصاريف المتكررة' : 'Add Recurring Bill'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {recurringBills.map((b) => {
                  const isPaidThisMonth = b.lastPaidMonth === curMonth;
                  return (
                    <View key={b.id} style={[styles.itemCard, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                      <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                        <Text style={[styles.itemTitle, isDarkMode && { color: themeColors.textPrimary }]}>{b.title}</Text>
                        <Text style={{ fontSize: 12, color: themeColors.primary, fontWeight: '800' }}>
                          {formatAmount(b.amount, { ignorePrivacy: true })} {currency.symbol}
                        </Text>
                      </View>
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.recordNowBtn,
                            { backgroundColor: isPaidThisMonth ? '#059669' : themeColors.primaryDark },
                          ]}
                          onPress={async () => {
                            await applyRecurringBillNow(b);
                            Alert.alert(
                              isArabic ? 'تم التسجيل ⚡' : 'Recorded ⚡',
                              isArabic ? `تم تسجيل مصروف "${b.title}" في معاملات هذا الشهر.` : `Recorded "${b.title}" in this month's transactions.`
                            );
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                            {isPaidThisMonth ? (isArabic ? 'تم هذا الشهر ✓' : 'Paid ✓') : (isArabic ? 'تسجيل الصرف الآن ⚡' : 'Record Now ⚡')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteRecurringBill(b.id)}>
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {tab === 'savings' && (
              <View>
                {/* Comprehensive Explanation Box for Savings Goals */}
                <View
                  style={[
                    styles.guideBox,
                    {
                      backgroundColor: isDarkMode ? themeColors.surfaceSecondary : '#FFFBEB',
                      borderColor: '#D97706',
                    },
                  ]}
                >
                  <View style={[styles.guideHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <MaterialCommunityIcons name="piggy-bank-outline" size={20} color="#D97706" />
                    <Text style={[styles.guideTitle, { color: '#B45309' }, isArabic && { textAlign: 'right' }]}>
                      {isArabic ? '📖 كيف تستخدم أوبشن أهداف الادخار (الحصالة الذكية)؟' : '📖 How to Use Savings Goals (Smart Piggy Bank)?'}
                    </Text>
                  </View>
                  <Text style={[styles.guideBodyText, isDarkMode && { color: themeColors.textPrimary }, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? '• المفهوم: أهداف الادخار هي «حصالة ذكية مستقلة» تساعدك على التخطيط وتجميع مبالغ مالية لأهدافك المستقبلية (مثل: شراء هاتف أو لابتوب، مصاريف سفر، صندوق طوارئ، أو شراء ذهب) دون الخلط بينها وبين مصاريفك اليومية.\n' +
                        '• طريقة الاستخدام خطوة بخطوة:\n' +
                        '  1️⃣ إنشاء الهدف: اكتب اسم الهدف (مثال: شراء لابتوب)، وحدد «المبلغ المستهدف الكلي» (مثلاً: 25,000)، وإذا كان لديك مبلغ مدخر مسبقاً اكتبه في خانة «المدخر حالياً» ثم اضغط «إنشاء هدف ادخار جديد 🎯».\n' +
                        '  2️⃣ متابعة التقدم: سيظهر لك كارت خاص بالهدف يعرض المبلغ الذي جمعته، النسبة المئوية المنجزة (%)، والمبلغ المتبقي مع شريط تقدم بصري.\n' +
                        '  3️⃣ تغذية الحصالة (+ إيداع): في كل مرة توفر فيها مبلغاً جديداً لهذا الهدف، اكتب المبلغ في خانة «مبلغ الإيداع +» داخل كارت الهدف واضغط «+ إيداع» ليتم إضافته فوراً وتحديث نسبة إنجازك حتى تصل إلى 100%!'
                      : '• Concept: Savings Goals act as a Smart Piggy Bank to help you accumulate funds for future targets (e.g., Laptop, Travel, Emergency Fund).\n' +
                        '• How to Use:\n' +
                        '  1️⃣ Create a Goal: Enter the goal name, total target amount, and any initial saved amount, then tap "Create Savings Goal 🎯".\n' +
                        '  2️⃣ Track Progress: View your saved amount, completion percentage (%), remaining amount, and progress bar.\n' +
                        '  3️⃣ Deposit Anytime: Whenever you set aside more money, type the amount in "Add amount +" on the goal card and tap "+ Deposit" to update your progress!'}
                  </Text>
                </View>

                <View style={[styles.formCard, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                  <TextInput
                    style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                    placeholder={isArabic ? 'اسم الهدف (مثال: شراء لابتوب، سفر، طوارئ)' : 'Goal Name'}
                    placeholderTextColor={COLORS.textMuted}
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                  />
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                      placeholder={isArabic ? 'المبلغ المستهدف' : 'Target Amount'}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                      placeholder={isArabic ? 'المدخر حالياً (اختياري)' : 'Saved so far'}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={goalSaved}
                      onChangeText={setGoalSaved}
                    />
                  </View>
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]} onPress={handleAddGoal}>
                    <MaterialCommunityIcons name="piggy-bank-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      {isArabic ? 'إنشاء هدف ادخار جديد 🎯' : 'Create Savings Goal 🎯'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {savingsGoals.map((g) => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;
                  const rem = Math.max(0, g.targetAmount - g.savedAmount);
                  return (
                    <View key={g.id} style={[styles.goalCard, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.itemTitle, isDarkMode && { color: themeColors.textPrimary }]}>🎯 {g.title}</Text>
                        <TouchableOpacity onPress={() => deleteSavingsGoal(g.id)}>
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 12, color: themeColors.primary, fontWeight: '800', marginTop: 4, textAlign: isArabic ? 'right' : 'left' }}>
                        {isArabic
                          ? `تم ادخار ${formatAmount(g.savedAmount, { ignorePrivacy: true })} من ${formatAmount(g.targetAmount, { ignorePrivacy: true })} ${currency.symbol} (${pct}%) • متبقي ${formatAmount(rem, { ignorePrivacy: true })}`
                          : `Saved ${formatAmount(g.savedAmount, { ignorePrivacy: true })} of ${formatAmount(g.targetAmount, { ignorePrivacy: true })} ${currency.symbol} (${pct}%)`}
                      </Text>
                      <View style={{ height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, marginVertical: 8, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: themeColors.primary }} />
                      </View>
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }}>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0, paddingVertical: 6 }, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                          placeholder={isArabic ? 'مبلغ الإيداع +' : 'Add amount +'}
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="numeric"
                          value={depositAmounts[g.id] || ''}
                          onChangeText={(v) => setDepositAmounts((prev) => ({ ...prev, [g.id]: v }))}
                        />
                        <TouchableOpacity
                          style={[styles.recordNowBtn, { backgroundColor: themeColors.primary, paddingVertical: 9 }]}
                          onPress={async () => {
                            const val = parseFloat(depositAmounts[g.id]);
                            if (val > 0) {
                              await depositToSavingsGoal(g.id, val);
                              setDepositAmounts((prev) => ({ ...prev, [g.id]: '' }));
                            }
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>
                            {isArabic ? '+ إيداع' : '+ Deposit'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  guideBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  guideBodyText: {
    fontSize: 11.5,
    lineHeight: 18,
    color: '#334155',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  pmChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  pmChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  goalCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordNowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
