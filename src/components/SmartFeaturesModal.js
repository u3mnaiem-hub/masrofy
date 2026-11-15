import React, { useState } from 'react';
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
import { COLORS, COLOR_PALETTES } from '../constants/theme';
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
    colorPalette,
    setColorPalette,
    appPin,
    setOrUpdateAppPin,
    allPaymentMethods,
  } = useExpense();

  const [tab, setTab] = useState(initialTab);

  // Recurring Bill state
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billPm, setBillPm] = useState('csh');

  // Savings Goal state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [depositAmounts, setDepositAmounts] = useState({});

  // PIN state
  const [pinInput, setPinInput] = useState(appPin || '');

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

  const handleSavePin = async () => {
    const clean = (pinInput || '').trim();
    if (clean && clean.length < 4) {
      Alert.alert(
        isArabic ? 'تنبيه' : 'Alert',
        isArabic ? 'الرقم السري يجب أن يتكون من 4 أرقام' : 'PIN must be 4 digits'
      );
      return;
    }
    await setOrUpdateAppPin(clean);
    Alert.alert(
      isArabic ? 'تم الحفظ 🔒' : 'Saved 🔒',
      clean
        ? (isArabic ? 'تم تفعيل قفل التطبيق بالرقم السري بنجاح.' : 'App PIN lock enabled.')
        : (isArabic ? 'تم إلغاء قفل التطبيق.' : 'App PIN lock disabled.')
    );
  };

  const curMonth = new Date().toISOString().slice(0, 7);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, isDarkMode && { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.title, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'المميزات الذكية والتخصيص ✨' : 'Smart Features & Customization ✨'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={isDarkMode ? themeColors.textPrimary : COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={[styles.tabsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {[
              { id: 'recurring', label: isArabic ? 'فواتير متكررة 📅' : 'Recurring 📅' },
              { id: 'savings', label: isArabic ? 'أهداف الادخار 🎯' : 'Savings 🎯' },
              { id: 'themes', label: isArabic ? 'الثيم والقفل 🔒' : 'Theme & Lock 🔒' },
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

          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }}>
            {tab === 'recurring' && (
              <View>
                <Text style={[styles.secDesc, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? 'سجل مصروفاتك الشهرية الثابتة (إيجار، اشتراكات، أقساط) واضغط "تسجيل الآن" لإضافتها في ثانية واحدة.'
                    : 'Save monthly recurring bills and record them with one tap.'}
                </Text>

                <View style={[styles.formCard, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                  <TextInput
                    style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
                    placeholder={isArabic ? 'اسم الفاتورة (مثال: إيجار، نت، جيم)' : 'Bill Name (e.g. Rent, Internet)'}
                    placeholderTextColor={COLORS.textMuted}
                    value={billTitle}
                    onChangeText={setBillTitle}
                  />
                  <TextInput
                    style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
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
                            { backgroundColor: isPaidThisMonth ? '#059669' : '#2563EB' },
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
                <Text style={[styles.secDesc, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? 'حدد أهدافك المالية وتابع نسبة إنجازك خطوة بخطوة في الحصالة الذكية.'
                    : 'Set financial savings goals and track your progress.'}
                </Text>

                <View style={[styles.formCard, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}>
                  <TextInput
                    style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
                    placeholder={isArabic ? 'اسم الهدف (مثال: شراء لابتوب، سفر، طوارئ)' : 'Goal Name'}
                    placeholderTextColor={COLORS.textMuted}
                    value={goalTitle}
                    onChangeText={setGoalTitle}
                  />
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
                      placeholder={isArabic ? 'المبلغ المستهدف' : 'Target Amount'}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      value={goalTarget}
                      onChangeText={setGoalTarget}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
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
                          style={[styles.input, { flex: 1, marginBottom: 0, paddingVertical: 6 }, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
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

            {tab === 'themes' && (
              <View>
                <Text style={[styles.secTitle, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary }]}>
                  {isArabic ? '🎨 اختيار ثيم ألوان التطبيق' : '🎨 Choose App Color Theme'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 }}>
                  {Object.values(COLOR_PALETTES).map((pal) => {
                    const selected = colorPalette === pal.id;
                    return (
                      <TouchableOpacity
                        key={pal.id}
                        onPress={() => setColorPalette(pal.id)}
                        style={{
                          width: '47%',
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: selected ? pal.primary : '#CBD5E1',
                          backgroundColor: pal.primaryUltraLight,
                          flexDirection: isArabic ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: pal.primary }} />
                        <Text style={{ fontWeight: '800', fontSize: 12.5, color: '#0F172A', flex: 1, textAlign: isArabic ? 'right' : 'left' }}>
                          {isArabic ? pal.nameAr : pal.nameEn}
                        </Text>
                        {selected && <MaterialCommunityIcons name="check-circle" size={18} color={pal.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 14 }} />

                <Text style={[styles.secTitle, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary }]}>
                  {isArabic ? '🔒 قفل التطبيق برقم سري (PIN)' : '🔒 App PIN Security Lock'}
                </Text>
                <Text style={[styles.secDesc, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? 'احمِ بياناتك المالية برقم سري من 4 أرقام يُطلب عند فتح التطبيق. اتركه فارغاً لإلغاء القفل.'
                    : 'Protect your financial data with a 4-digit PIN on startup. Leave blank to disable.'}
                </Text>
                <TextInput
                  style={[styles.input, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary, borderColor: themeColors.border }]}
                  placeholder={isArabic ? 'أدخل 4 أرقام (مثال: 1234)' : 'Enter 4-digit PIN'}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={pinInput}
                  onChangeText={setPinInput}
                />
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: themeColors.primary }]} onPress={handleSavePin}>
                    <MaterialCommunityIcons name="lock-check-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      {isArabic ? 'حفظ إعدادات القفل' : 'Save PIN Lock'}
                    </Text>
                  </TouchableOpacity>
                  {appPin ? (
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: '#DC2626', paddingHorizontal: 14 }]}
                      onPress={async () => {
                        setPinInput('');
                        await setOrUpdateAppPin('');
                        Alert.alert(isArabic ? 'تم الإلغاء' : 'Disabled', isArabic ? 'تم إلغاء الرقم السري' : 'PIN disabled');
                      }}
                    >
                      <Text style={styles.primaryBtnText}>{isArabic ? 'إلغاء القفل' : 'Disable'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
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
    maxHeight: '88%',
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
    fontSize: 16,
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
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  secTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  secDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
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
