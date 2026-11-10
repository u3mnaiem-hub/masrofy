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

const addOneMonth = (dateStr) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    let nm = (m || 1) + 1;
    let ny = y || 2026;
    if (nm > 12) {
      nm = 1;
      ny += 1;
    }
    return `${ny}-${String(nm).padStart(2, '0')}-${String(d || 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
};

const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test((s || '').trim()) && !isNaN(new Date(s).getTime());

export const RolloverModal = ({ visible, onClose }) => {
  const { balances, startNewMonthCycle, currency, formatAmount, isArabic, transactions } = useExpense();

  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [extraDc, setExtraDc] = useState('');
  const [extraCash, setExtraCash] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      const s = balances?.cycleEndDate || new Date().toISOString().split('T')[0];
      setNewStart(s);
      setNewEnd(addOneMonth(s));
      setExtraDc('');
      setExtraCash('');
      setBusy(false);
    }
  }, [visible]);

  const onChangeStart = (v) => {
    setNewStart(v);
    if (isValidDate(v)) setNewEnd(addOneMonth(v.trim()));
  };

  const sym = currency.symbol;
  const nextCash = Math.max(0, Math.round((balances?.availCsh || 0) + (parseFloat(extraCash) || 0)));
  const nextDc = Math.max(0, Math.round((balances?.availDc || 0) + (parseFloat(extraDc) || 0)));
  const customDebits = balances?.customDebitCardsSummary || [];
  const customCredits = balances?.customCreditCardsSummary || [];

  const confirm = () => {
    if (!isValidDate(newStart)) {
      Alert.alert(
        isArabic ? 'تاريخ غير صحيح' : 'Invalid date',
        isArabic ? 'اكتب تاريخ بداية الشهر الجديد بصيغة YYYY-MM-DD' : 'Enter the new month start date as YYYY-MM-DD'
      );
      return;
    }
    if (newEnd && !isValidDate(newEnd)) {
      Alert.alert(isArabic ? 'تاريخ غير صحيح' : 'Invalid date', isArabic ? 'تاريخ نهاية الدورة غير صحيح' : 'Cycle end date is invalid');
      return;
    }
    Alert.alert(
      isArabic ? 'تأكيد الترحيل وفتح شهر جديد' : 'Confirm rollover & open new month',
      isArabic
        ? `سيتم حفظ ${transactions.length} معاملة من الشهر الحالي في أرشيف الشهور (History File)، ثم تصفير السجل وبدء شهر جديد من ${newStart.trim()}.\n\nهل تريد المتابعة؟`
        : `${transactions.length} transactions of the current month will be saved to the Months Archive (History File), then the log is cleared and a new month starts on ${newStart.trim()}.\n\nContinue?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، رحّل وافتح شهر جديد' : 'Yes, roll over',
          onPress: async () => {
            setBusy(true);
            const res = await startNewMonthCycle({
              newCycleStartDate: newStart.trim(),
              newCycleEndDate: (newEnd || '').trim(),
              extraDcDeposit: parseFloat(extraDc) || 0,
              extraCashDeposit: parseFloat(extraCash) || 0,
            });
            setBusy(false);
            onClose();
            Alert.alert(
              isArabic ? 'تم فتح الشهر الجديد 🎉' : 'New month opened 🎉',
              isArabic
                ? `الدورة: ${res.newCycleStartDate} ← ${res.newCycleEndDate}\n💵 كاش بداية: ${formatAmount(res.newStartCsh)} ${sym}\n🏦 DC / حساب بنكي بداية: ${formatAmount(res.newStartDc)} ${sym}\n💳 مستحق مرحل: البنك العربي ${formatAmount(res.newCarryOvers.cc_ar)} • كريدي أجريكول ${formatAmount(res.newCarryOvers.cc_ca)} ${sym}\n\n📁 الشهر السابق محفوظ في «أرشيف الشهور».`
                : `Cycle: ${res.newCycleStartDate} → ${res.newCycleEndDate}\n💵 Starting cash: ${formatAmount(res.newStartCsh)} ${sym}\n🏦 Starting DC: ${formatAmount(res.newStartDc)} ${sym}\n💳 Carried CC dues: Arab Bank ${formatAmount(res.newCarryOvers.cc_ar)} • Crédit Agricole ${formatAmount(res.newCarryOvers.cc_ca)} ${sym}\n\n📁 Previous month saved in "Months Archive".`
            );
          },
        },
      ]
    );
  };

  const Row = ({ label, from, to, color }) => (
    <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
      <Text style={[styles.rowLabel, isArabic && { textAlign: 'right' }]}>{label}</Text>
      <Text style={[styles.rowVal, { color: color || COLORS.textPrimary }]}>
        {from !== undefined ? `${formatAmount(from)} ➜ ` : ''}
        {formatAmount(to)} {sym}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={{ width: 36 }} />
            <Text style={styles.title}>{isArabic ? 'ترحيل وفتح شهر جديد 🗓️' : 'Roll Over & Open New Month 🗓️'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Step 1: new month dates */}
            <Text style={[styles.section, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '1) تواريخ الشهر الجديد' : '1) New month dates'}
            </Text>
            <View style={[styles.dateRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'بداية الشهر الجديد' : 'New month start'}
                </Text>
                <TextInput style={styles.input} value={newStart} onChangeText={onChangeStart} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'نهاية الدورة' : 'Cycle end'}
                </Text>
                <TextInput style={styles.input} value={newEnd} onChangeText={setNewEnd} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            {/* Step 2: what gets carried over */}
            <Text style={[styles.section, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '2) أرصدة البداية الجديدة (من المتبقي)' : '2) New starting balances (from what is left)'}
            </Text>
            <View style={styles.card}>
              <Row label={isArabic ? '💵 كاش متاح' : '💵 Available Cash'} to={nextCash} color="#059669" />
              <Row label={isArabic ? '🏦 DC / حساب بنكي' : '🏦 DC / Bank Account'} to={nextDc} color="#2563EB" />
              {customDebits.map((d) => (
                <Row key={d.id} label={`🏦 ${d.bankName} (DC)`} to={Math.max(0, Math.round(d.avail))} color="#2563EB" />
              ))}
            </View>

            <View style={[styles.dateRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '+ إيداع/راتب على DC (اختياري)' : '+ Salary/deposit to DC (optional)'}
                </Text>
                <TextInput style={styles.input} value={extraDc} onChangeText={setExtraDc} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '+ كاش إضافي (اختياري)' : '+ Extra cash (optional)'}
                </Text>
                <TextInput style={styles.input} value={extraCash} onChangeText={setExtraCash} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            {/* Step 3: unpaid credit cards */}
            <Text style={[styles.section, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '3) غير المسدد من الكروت ➜ يُضاف للمستحق' : '3) Unpaid credit cards ➜ added to dues'}
            </Text>
            <View style={[styles.card, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Row label={isArabic ? '💳 البنك العربي (CC AR)' : '💳 Arab Bank (CC AR)'} to={Math.round(balances?.ccArDebt || 0)} color="#DC2626" />
              <Row label={isArabic ? '💳 كريدي أجريكول (CC CA)' : '💳 Crédit Agricole (CC CA)'} to={Math.round(balances?.ccCaDebt || 0)} color="#D97706" />
              {customCredits.map((c) => (
                <Row key={c.id} label={`💳 ${c.bankName} (CC)`} to={Math.round(c.totalDebt)} color="#D97706" />
              ))}
              <View style={styles.divider} />
              <Row label={isArabic ? 'إجمالي المستحق المرحل' : 'Total carried dues'} to={Math.round(balances?.totalCcDebt || 0)} color="#991B1B" />
            </View>

            {/* Step 4: archive */}
            <View style={[styles.archiveNote, isArabic && { flexDirection: 'row-reverse' }]}>
              <MaterialCommunityIcons name="archive-arrow-down-outline" size={20} color="#4338CA" />
              <Text style={[styles.archiveText, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `4) سجل الشهر الحالي (${transactions.length} معاملة) وملخصه هيتحفظوا في «أرشيف الشهور» وتقدر تفتحهم في أي وقت من شاشة السجل.`
                  : `4) This month's log (${transactions.length} transactions) and its summary are saved to the "Months Archive", viewable anytime from the History tab.`}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, busy && { opacity: 0.6 }, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={confirm}
              disabled={busy}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="calendar-arrow-right" size={20} color="#FFFFFF" />
              <Text style={styles.confirmText}>{isArabic ? 'ترحيل وفتح شهر جديد' : 'Roll Over & Open New Month'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  content: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { padding: 6, borderRadius: 12, backgroundColor: COLORS.surfaceSecondary },
  body: { padding: 18, paddingBottom: 30 },
  section: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginTop: 6, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  card: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 14, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  rowVal: { fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#FDE68A', marginVertical: 6 },
  archiveNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#C7D2FE', marginBottom: 14 },
  archiveText: { flex: 1, fontSize: 11, color: '#3730A3', fontWeight: '600', lineHeight: 17 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 14 },
  confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
