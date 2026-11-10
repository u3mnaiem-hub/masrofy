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
import { CURRENCIES } from '../constants/currencies';
import { useExpense } from '../context/ExpenseContext';

export const SetBudgetModal = ({ visible, onClose }) => {
  const {
    balances,
    updateStartBalances,
    updateCycleStartDate,
    updateCycleEndDate,
    startNewMonthCycle,
    currency,
    setCurrency,
    formatAmount,
    isArabic,
  } = useExpense();

  const [cshInput, setCshInput] = useState('14500');
  const [dcInput, setDcInput] = useState('16930');
  const [cycleDateInput, setCycleDateInput] = useState('2026-10-22');
  const [cycleEndInput, setCycleEndInput] = useState('2026-11-22');
  const [extraDcDeposit, setExtraDcDeposit] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  useEffect(() => {
    if (visible) {
      setCshInput((balances?.startCsh ?? 14500).toString());
      setDcInput((balances?.startDc ?? 16930).toString());
      setCycleDateInput(balances?.cycleStartDate || '2026-10-22');
      setCycleEndInput(balances?.cycleEndDate || '2026-11-22');
      setExtraDcDeposit('');
      setSelectedCurrency(currency);
    }
  }, [visible, balances, currency]);

  const payDays = [22, 23, 24, 25, 26];

  const handleSelectPayDay = (day) => {
    const parts = (cycleDateInput || '2026-10-22').split('-');
    const yearMonth = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '2026-10';
    const paddedDay = day < 10 ? `0${day}` : `${day}`;
    const newStart = `${yearMonth}-${paddedDay}`;
    setCycleDateInput(newStart);

    // Also update Cycle End Date to same day next month automatically
    try {
      let y = parseInt(parts[0], 10) || 2026;
      let m = (parseInt(parts[1], 10) || 10) + 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      setCycleEndInput(`${y}-${String(m).padStart(2, '0')}-${paddedDay}`);
    } catch {}
  };

  const totalPreview = (parseFloat(cshInput) || 0) + (parseFloat(dcInput) || 0);

  const handleSave = async () => {
    const cshVal = parseFloat(cshInput);
    const dcVal = parseFloat(dcInput);
    if (isNaN(cshVal) || cshVal < 0 || isNaN(dcVal) || dcVal < 0) {
      Alert.alert(
        isArabic ? 'إدخال غير صحيح' : 'Invalid Input',
        isArabic ? 'يرجى إدخال أرصدة بداية صحيحة.' : 'Please enter valid starting balances.'
      );
      return;
    }

    await updateStartBalances({ csh: cshVal, dc: dcVal });
    if (cycleDateInput && cycleDateInput.trim()) {
      await updateCycleStartDate(cycleDateInput.trim());
    }
    if (cycleEndInput && cycleEndInput.trim()) {
      await updateCycleEndDate(cycleEndInput.trim());
    }
    if (setCurrency) {
      await setCurrency(selectedCurrency);
    }
    onClose();
  };

  const handleStartNewMonth = () => {
    const targetStart = (cycleEndInput || balances?.cycleEndDate || new Date().toISOString().split('T')[0]).trim();
    let targetEnd = '';
    try {
      const [y, m, d] = targetStart.split('-').map(Number);
      let nextM = (m || 1) + 1;
      let nextY = y || 2026;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      targetEnd = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d || 22).padStart(2, '0')}`;
    } catch {
      targetEnd = '2026-12-22';
    }

    const extraDc = parseFloat(extraDcDeposit) || 0;
    const nextCash = Math.max(0, Math.round(balances?.availCsh || 0));
    const nextDc = Math.max(0, Math.round((balances?.availDc || 0) + extraDc));
    const nextCcTotal = Math.max(0, Math.round(balances?.totalCcDebt || 0));

    Alert.alert(
      isArabic ? 'بدء شهر جديد تلقائياً 🗓️' : 'Start New Month Automatically 🗓️',
      isArabic
        ? `سيقوم البرنامج تلقائياً بترحيل الأرصدة التالية للشهر الجديد (${targetStart} إلى ${targetEnd}):\n\n` +
          `💵 الكاش المتاح للشهر الجديد: ${formatAmount(nextCash)} ${selectedCurrency.symbol}\n` +
          `🏦 DC / حساب بنكي للشهر الجديد: ${formatAmount(nextDc)} ${selectedCurrency.symbol}\n` +
          `💳 إجمالي المستحق المرحل على الكروت: ${formatAmount(nextCcTotal)} ${selectedCurrency.symbol}\n` +
          `   • البنك العربي: ${formatAmount(balances?.ccArDebt || 0)} ${selectedCurrency.symbol}\n` +
          `   • كريدي أجريكول: ${formatAmount(balances?.ccCaDebt || 0)} ${selectedCurrency.symbol}\n\n` +
          `هل تريد تأكيد فتح الشهر الجديد الآن؟`
        : `The app will automatically roll over the following balances to the new month (${targetStart} to ${targetEnd}):\n\n` +
          `💵 New Available Cash: ${formatAmount(nextCash)} ${selectedCurrency.symbol}\n` +
          `🏦 New DC / Bank Account: ${formatAmount(nextDc)} ${selectedCurrency.symbol}\n` +
          `💳 Carried-over Credit Card Dues: ${formatAmount(nextCcTotal)} ${selectedCurrency.symbol}\n` +
          `   • Arab Bank: ${formatAmount(balances?.ccArDebt || 0)} ${selectedCurrency.symbol}\n` +
          `   • Crédit Agricole: ${formatAmount(balances?.ccCaDebt || 0)} ${selectedCurrency.symbol}\n\n` +
          `Start new month now?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، ابدأ شهر جديد' : 'Yes, Start New Month',
          onPress: async () => {
            await startNewMonthCycle({
              newCycleStartDate: targetStart,
              newCycleEndDate: targetEnd,
              extraDcDeposit: extraDc,
            });
            onClose();
            Alert.alert(
              isArabic ? 'تم فتح شهر جديد بنجاح 🎉' : 'New Month Started 🎉',
              isArabic
                ? `تم نقل الكاش المتبقي (${formatAmount(nextCash)} ${selectedCurrency.symbol}) وإجمالي مستحقات الكروت (${formatAmount(nextCcTotal)} ${selectedCurrency.symbol}) للشهر الجديد.`
                : `Remaining Cash (${formatAmount(nextCash)} ${selectedCurrency.symbol}) and Credit Card dues (${formatAmount(nextCcTotal)} ${selectedCurrency.symbol}) have been carried over.`
            );
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={{ width: 36 }} />
            <Text style={styles.title}>
              {isArabic ? 'تعديل يدوي للشهر الجديد وأرصدة البداية' : 'Manual Edit for New Month & Balances'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* NEW MONTH ROLLOVER CARD ("شهر جديد") */}
            <View style={styles.newMonthCard}>
              <View style={[styles.newMonthHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <MaterialCommunityIcons name="calendar-refresh" size={22} color="#1E40AF" />
                <Text style={[styles.newMonthTitle, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? 'إقفال الدورة الحالية وبدء شهر جديد تلقائياً'
                    : 'Close Current Cycle & Start New Month'}
                </Text>
              </View>
              <Text style={[styles.newMonthDesc, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `ينقل أوتوماتيكياً الكاش المتبقي (${formatAmount(balances?.availCsh || 0)} ${selectedCurrency.symbol}) وبطاقة DC (${formatAmount(balances?.availDc || 0)} ${selectedCurrency.symbol}) وإجمالي المستحق على الكروت (${formatAmount(balances?.totalCcDebt || 0)} ${selectedCurrency.symbol}) للشهر الجديد.`
                  : `Automatically transfers remaining Cash (${formatAmount(balances?.availCsh || 0)} ${selectedCurrency.symbol}), DC (${formatAmount(balances?.availDc || 0)} ${selectedCurrency.symbol}), and Total Credit Card Dues (${formatAmount(balances?.totalCcDebt || 0)} ${selectedCurrency.symbol}) to the new month.`}
              </Text>

              <Text style={[styles.sublabel, { marginTop: 6 }, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? 'إضافة راتب / إيداع جديد على حساب DC للشهر الجديد (اختياري):'
                  : 'Optional New Salary / Deposit to add to DC for New Month:'}
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: '#FFFFFF', marginBottom: 10 }]}>
                <TextInput
                  style={[styles.input, { fontSize: 16 }]}
                  value={extraDcDeposit}
                  onChangeText={setExtraDcDeposit}
                  keyboardType="numeric"
                  placeholder={isArabic ? '0 (اختياري)' : '0 (Optional)'}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.newMonthBtn, isArabic && { flexDirection: 'row-reverse' }]}
                onPress={handleStartNewMonth}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="calendar-plus" size={20} color="#FFFFFF" />
                <Text style={styles.newMonthBtnText}>
                  {isArabic ? 'شهر جديد (ترحيل الكاش ومستحقات الكروت)' : 'New Month (Roll Over Cash & CC Dues)'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Auto Total Banner */}
            <View style={styles.totalBanner}>
              <Text style={styles.totalBannerLabel}>
                {isArabic ? 'إجمالي رأس مال البداية (يُحسب تلقائياً)' : 'Total Starting Capital (Auto-Calculated)'}
              </Text>
              <Text style={styles.totalBannerVal}>
                {formatAmount(totalPreview)} {selectedCurrency.symbol}
              </Text>
            </View>

            {/* Starting Cash & DC / Bank Account */}
            <View style={[styles.rowInputs, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={styles.halfInputBox}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'كاش متاح (Available Cash)' : 'Available Cash'}
                </Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={cshInput}
                    onChangeText={setCshInput}
                    keyboardType="numeric"
                    placeholder="14500"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.halfInputBox}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'DC / حساب بنكي' : 'DC / Bank Account'}
                </Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={dcInput}
                    onChangeText={setDcInput}
                    keyboardType="numeric"
                    placeholder="16930"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Cycle Start Date & Cycle End Date (On-Demand) */}
            <View style={[styles.rowInputs, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={styles.halfInputBox}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'بداية الدورة (Start Date)' : 'Cycle Start Date'}
                </Text>
                <View style={styles.inputWrap}>
                  <MaterialCommunityIcons name="calendar-start" size={18} color={COLORS.primaryDark} />
                  <TextInput
                    style={[styles.input, { fontSize: 15, minWidth: 85 }]}
                    value={cycleDateInput}
                    onChangeText={setCycleDateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.halfInputBox}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'نهاية الدورة (Cycle End Date)' : 'Cycle End Date'}
                </Text>
                <View style={styles.inputWrap}>
                  <MaterialCommunityIcons name="calendar-end" size={18} color="#2563EB" />
                  <TextInput
                    style={[styles.input, { fontSize: 15, minWidth: 85 }]}
                    value={cycleEndInput}
                    onChangeText={setCycleEndInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.sublabel, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'اختيار سريع ليوم بداية ونهاية الدورة:' : 'Quick Select Cycle Day:'}
            </Text>
            <View style={[styles.presetsRow, isArabic && { flexDirection: 'row-reverse' }]}>
              {payDays.map((d) => {
                const isSelected = cycleDateInput.endsWith(`-${d}`) || cycleDateInput.endsWith(`-0${d}`);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleSelectPayDay(d)}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                      {isArabic ? `يوم ${d}` : `Day ${d}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Select Currency */}
            <Text style={[styles.label, { marginTop: 16 }, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'العملة المفضلة' : 'Preferred Currency'}
            </Text>
            <View style={[styles.currenciesWrap, isArabic && { flexDirection: 'row-reverse' }]}>
              {CURRENCIES.map((curr) => {
                const isSelected = selectedCurrency.code === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyCard,
                      isSelected && styles.currencyCardActive,
                    ]}
                    onPress={() => setSelectedCurrency(curr)}
                  >
                    <Text style={styles.currSymbolBadge}>{curr.symbol}</Text>
                    <Text style={styles.currName}>{curr.name}</Text>
                    <Text style={styles.currCountry}>{curr.country}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {isArabic ? 'حفظ تعديلات الدورة' : 'Save Cycle Settings'}
              </Text>
            </TouchableOpacity>
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
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  body: {
    padding: 20,
  },
  newMonthCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  newMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  newMonthTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    flex: 1,
  },
  newMonthDesc: {
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 17,
  },
  newMonthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
  },
  newMonthBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  totalBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  totalBannerLabel: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalBannerVal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  halfInputBox: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'left',
  },
  sublabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textAlign: 'left',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    marginBottom: 12,
    gap: 6,
  },
  input: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minWidth: 80,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
  },
  presetChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  currenciesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  currencyCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  currencyCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  currSymbolBadge: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  currName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  currCountry: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});
