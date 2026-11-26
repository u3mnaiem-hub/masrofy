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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

const MONTHLY_INTERVALS = [1, 3, 6, 12];

export const CertificatesModal = ({ visible, onClose }) => {
  const {
    certificates,
    addCertificate,
    deleteCertificate,
    creditCertificateInterestNow,
    computeCertificatePeriodicYield,
    allPaymentMethods,
    currency,
    formatAmount,
    isArabic,
  } = useExpense();

  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState('certificate'); // 'certificate' | 'deposit'
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [rateType, setRateType] = useState('fixed'); // 'fixed' | 'variable'
  const [frequency, setFrequency] = useState('monthly'); // 'daily' | 'monthly'
  const [monthlyInterval, setMonthlyInterval] = useState(1); // 1 | 3 | 6 | 12
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [targetAccount, setTargetAccount] = useState('dc');

  const depositTargets = (allPaymentMethods || []).filter(
    (p) => p.accountType === 'cash' || p.accountType === 'debit'
  );

  const previewYield = computeCertificatePeriodicYield({
    principal: parseFloat(principal) || 0,
    interestRate: parseFloat(interestRate) || 0,
    frequency,
    monthlyInterval,
  });

  const handleAdd = async () => {
    const cleanName = name.trim();
    const numVal = parseFloat(principal);
    const numRate = parseFloat(interestRate);

    if (!cleanName) {
      Alert.alert(
        isArabic ? 'بيانات ناقصة' : 'Missing Name',
        isArabic ? 'يرجى إدخال اسم الشهادة أو الوديعة والبنك.' : 'Please enter the certificate/deposit name.'
      );
      return;
    }
    if (!numVal || numVal <= 0) {
      Alert.alert(
        isArabic ? 'قيمة غير صحيحة' : 'Invalid Amount',
        isArabic ? 'يرجى إدخال قيمة الشهادة أو الوديعة.' : 'Please enter a valid principal amount.'
      );
      return;
    }
    if (!numRate || numRate <= 0) {
      Alert.alert(
        isArabic ? 'نسبة فائدة غير صحيحة' : 'Invalid Rate',
        isArabic ? 'يرجى إدخال نسبة الفائدة السنوية (مثال: 20).' : 'Please enter a valid annual interest rate (e.g. 20).'
      );
      return;
    }

    const validTarget =
      depositTargets.find((t) => t.id === targetAccount)?.id ||
      depositTargets[0]?.id ||
      'csh';

    await addCertificate({
      kind,
      name: cleanName,
      principal: numVal,
      endDate: endDate.trim(),
      interestRate: numRate,
      rateType,
      frequency,
      monthlyInterval: frequency === 'daily' ? 0 : monthlyInterval,
      payoutDate: payoutDate.trim() || new Date().toISOString().split('T')[0],
      targetAccount: validTarget,
    });

    setName('');
    setPrincipal('');
    setInterestRate('');
    setEndDate('');
    Alert.alert(
      isArabic ? 'تمت الإضافة بنجاح ✅' : 'Added Successfully ✅',
      isArabic
        ? 'سيتم احتساب العائد وإضافته تلقائياً إلى الوارد مع إرسال إشعار في تاريخ صرف الفائدة.'
        : 'Interest will be automatically credited to Income with a notification on the payout date.'
    );
  };

  const handleDelete = (cert) => {
    Alert.alert(
      isArabic ? 'حذف الشهادة / الوديعة' : 'Delete Certificate / Deposit',
      isArabic
        ? `هل تريد حذف "${cert.name}"؟`
        : `Delete "${cert.name}"?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => deleteCertificate(cert.id),
        },
      ]
    );
  };

  const handleCreditNow = (cert) => {
    const amt = computeCertificatePeriodicYield(cert);
    Alert.alert(
      isArabic ? 'صرف العائد الآن للوارد 💰' : 'Credit Interest Now 💰',
      isArabic
        ? `سيتم إضافة عائد "${cert.name}" بمبلغ ${formatAmount(amt)} ${currency.symbol} إلى الوارد فوراً مع إشعار. متابعة؟`
        : `Add ${formatAmount(amt)} ${currency.symbol} from "${cert.name}" to Income now?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، أضف للوارد' : 'Yes, Credit Now',
          onPress: async () => {
            await creditCertificateInterestNow(cert.id);
          },
        },
      ]
    );
  };

  const formatFreqLabel = (cert) => {
    if (cert.frequency === 'daily') return isArabic ? 'عائد يومي' : 'Daily Yield';
    const m = cert.monthlyInterval || 1;
    if (isArabic) {
      if (m === 1) return 'عائد شهري (كل شهر)';
      if (m === 3) return 'عائد ربع سنوي (كل 3 شهور)';
      if (m === 6) return 'عائد نصف سنوي (كل 6 شهور)';
      if (m === 12) return 'عائد سنوي (كل 12 شهر)';
      return `كل ${m} شهور`;
    }
    return `Every ${m} mo`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={{ width: 36 }} />
            <Text style={styles.title}>
              {isArabic ? 'الشهادات والودائع البنكية 🏦' : 'Certificates & Deposits 🏦'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Kind: Certificate vs Deposit */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '1. النوع' : '1. Type'}
            </Text>
            <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, kind === 'certificate' && styles.toggleBtnActive]}
                onPress={() => setKind('certificate')}
              >
                <Text style={[styles.toggleBtnText, kind === 'certificate' && styles.toggleBtnTextActive]}>
                  {isArabic ? '📜 شهادة ادخار' : '📜 Certificate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, kind === 'deposit' && styles.toggleBtnActive]}
                onPress={() => setKind('deposit')}
              >
                <Text style={[styles.toggleBtnText, kind === 'deposit' && styles.toggleBtnTextActive]}>
                  {isArabic ? '🏛️ وديعة بنكية' : '🏛️ Deposit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '2. اسم الشهادة / الوديعة والبنك' : '2. Name & Bank'}
            </Text>
            <TextInput
              style={[styles.input, isArabic && { textAlign: 'right' }]}
              value={name}
              onChangeText={setName}
              placeholder={isArabic ? 'مثال: شهادة بلاتينية - البنك الأهلي' : 'e.g. Platinum CD - NBE'}
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Principal & Rate */}
            <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? `3. القيمة (${currency.symbol})` : `3. Principal (${currency.symbol})`}
                </Text>
                <TextInput
                  style={[styles.input, isArabic && { textAlign: 'right' }]}
                  value={principal}
                  onChangeText={setPrincipal}
                  keyboardType="numeric"
                  placeholder="100000"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '4. نسبة الفائدة (%)' : '4. Interest Rate (%)'}
                </Text>
                <TextInput
                  style={[styles.input, isArabic && { textAlign: 'right' }]}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  keyboardType="numeric"
                  placeholder="21.5"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Fixed vs Variable */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '5. نوع الفائدة (ثابتة أم متغيرة)' : '5. Rate Type (Fixed or Variable)'}
            </Text>
            <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, rateType === 'fixed' && styles.toggleBtnBlueActive]}
                onPress={() => setRateType('fixed')}
              >
                <Text style={[styles.toggleBtnText, rateType === 'fixed' && styles.toggleBtnTextActive]}>
                  {isArabic ? '🔒 ثابتة (Fixed)' : '🔒 Fixed'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, rateType === 'variable' && styles.toggleBtnBlueActive]}
                onPress={() => setRateType('variable')}
              >
                <Text style={[styles.toggleBtnText, rateType === 'variable' && styles.toggleBtnTextActive]}>
                  {isArabic ? '📈 متغيرة (Variable)' : '📈 Variable'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payout Frequency: Daily vs Monthly (1, 3, 6, 12) */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '6. دورية صرف العائد' : '6. Payout Frequency'}
            </Text>
            <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.toggleBtn, frequency === 'daily' && styles.toggleBtnActive]}
                onPress={() => setFrequency('daily')}
              >
                <Text style={[styles.toggleBtnText, frequency === 'daily' && styles.toggleBtnTextActive]}>
                  {isArabic ? '☀️ يومي' : '☀️ Daily'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, frequency === 'monthly' && styles.toggleBtnActive]}
                onPress={() => setFrequency('monthly')}
              >
                <Text style={[styles.toggleBtnText, frequency === 'monthly' && styles.toggleBtnTextActive]}>
                  {isArabic ? '🗓️ شهري / دوري' : '🗓️ Monthly / Periodic'}
                </Text>
              </TouchableOpacity>
            </View>

            {frequency === 'monthly' && (
              <>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'اختر دورية الصرف بالشهور (1 أو 3 أو 6 أو 12)' : 'Select Monthly Interval (1, 3, 6, or 12 months)'}
                </Text>
                <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
                  {MONTHLY_INTERVALS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.intervalChip,
                        monthlyInterval === m && styles.intervalChipActive,
                      ]}
                      onPress={() => setMonthlyInterval(m)}
                    >
                      <Text
                        style={[
                          styles.intervalChipText,
                          monthlyInterval === m && styles.intervalChipTextActive,
                        ]}
                      >
                        {isArabic ? `${m} ${m === 1 ? 'شهر' : m <= 10 ? 'شهور' : 'شهر'}` : `${m}M`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Dates: Payout Date & Maturity End Date */}
            <View style={[styles.row, isArabic && { flexDirection: 'row-reverse' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '7. تاريخ صرف الفائدة' : '7. Payout Date'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center' }]}
                  value={payoutDate}
                  onChangeText={setPayoutDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '8. تاريخ الانتهاء' : '8. Maturity Date'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center' }]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2029-11-25"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Target Account for Auto-Credit */}
            {depositTargets.length > 0 && (
              <>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '9. الحساب الذي يُضاف إليه العائد تلقائياً' : '9. Auto-Credit Target Account'}
                </Text>
                <View style={[styles.targetsWrap, isArabic && { flexDirection: 'row-reverse' }]}>
                  {depositTargets.map((acc) => {
                    const active = targetAccount === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.targetChip, active && styles.targetChipActive]}
                        onPress={() => setTargetAccount(acc.id)}
                      >
                        <Text style={[styles.targetChipText, active && styles.targetChipTextActive]}>
                          {isArabic ? (acc.shortNameAr || acc.nameAr) : (acc.shortName || acc.name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Live Yield Preview */}
            {previewYield > 0 && (
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>
                  {isArabic
                    ? `💰 العائد المتوقع في كل صرف: ${formatAmount(previewYield)} ${currency.symbol} (يُضاف تلقائياً للوارد مع إشعار)`
                    : `💰 Expected yield per payout: ${formatAmount(previewYield)} ${currency.symbol} (auto-credited to Income)`}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {isArabic ? 'حفظ الشهادة / الوديعة' : 'Save Certificate / Deposit'}
              </Text>
            </TouchableOpacity>

            {/* Existing Certificates & Deposits */}
            <Text style={[styles.sectionTitle, isArabic && { textAlign: 'right' }]}>
              {isArabic
                ? `الشهادات والودائع المسجلة (${(certificates || []).length})`
                : `Saved Certificates & Deposits (${(certificates || []).length})`}
            </Text>

            {(certificates || []).length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  {isArabic
                    ? 'لم تضف أي شهادات أو ودائع بعد. أضف شهادتك بالأعلى ليتم إضافة العائد تلقائياً إلى الوارد مع إشعار في موعده.'
                    : 'No certificates or deposits added yet. Add one above to automatically credit yields to Income.'}
                </Text>
              </View>
            ) : (
              (certificates || []).map((cert) => {
                const yieldVal = computeCertificatePeriodicYield(cert);
                return (
                  <View key={cert.id} style={styles.certCard}>
                    <View style={[styles.certTopRow, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                        <Text style={styles.certTitle}>
                          {cert.kind === 'deposit' ? '🏛️ ' : '📜 '}
                          {cert.name}
                        </Text>
                        <Text style={styles.certMeta}>
                          {isArabic
                            ? `القيمة: ${formatAmount(cert.principal)} ${currency.symbol} • فائدة ${cert.interestRate}% (${cert.rateType === 'variable' ? 'متغيرة' : 'ثابتة'})`
                            : `Principal: ${formatAmount(cert.principal)} ${currency.symbol} • ${cert.interestRate}% (${cert.rateType})`}
                        </Text>
                        <Text style={styles.certMeta}>
                          {formatFreqLabel(cert)} • {isArabic ? `الصرف: ${cert.payoutDate || '-'}` : `Payout: ${cert.payoutDate || '-'}`}
                          {cert.endDate ? ` • ${isArabic ? `ينتهي: ${cert.endDate}` : `Ends: ${cert.endDate}`}` : ''}
                        </Text>
                        <Text style={styles.certYield}>
                          {isArabic
                            ? `العائد الدوري: ${formatAmount(yieldVal)} ${currency.symbol}`
                            : `Periodic Yield: ${formatAmount(yieldVal)} ${currency.symbol}`}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(cert)} style={styles.deleteBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.creditNowBtn}
                      onPress={() => handleCreditNow(cert)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="cash-plus" size={16} color="#065F46" />
                      <Text style={styles.creditNowText}>
                        {isArabic ? 'صرف العائد الآن وإضافته للوارد' : 'Credit Interest to Income Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  content: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: 15.5, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { padding: 6, borderRadius: 12, backgroundColor: COLORS.surfaceSecondary },
  body: { padding: 18, paddingBottom: 34 },
  label: { fontSize: 11.5, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, marginBottom: 5 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSecondary,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#059669', borderColor: '#047857' },
  toggleBtnBlueActive: { backgroundColor: '#1D4ED8', borderColor: '#1E40AF' },
  toggleBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  toggleBtnTextActive: { color: '#FFFFFF' },
  intervalChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  intervalChipActive: { backgroundColor: '#D97706', borderColor: '#B45309' },
  intervalChipText: { fontSize: 11.5, fontWeight: '800', color: COLORS.textSecondary },
  intervalChipTextActive: { color: '#FFFFFF' },
  targetsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  targetChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  targetChipActive: { backgroundColor: '#065F46', borderColor: '#047857' },
  targetChipText: { fontSize: 11.5, fontWeight: '700', color: COLORS.textSecondary },
  targetChipTextActive: { color: '#FFFFFF' },
  previewBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  previewText: { fontSize: 12, fontWeight: '800', color: '#065F46', textAlign: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 18,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  emptyBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  certCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  certTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  certTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  certMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  certYield: { fontSize: 12, fontWeight: '800', color: '#065F46', marginTop: 4 },
  deleteBtn: { padding: 6 },
  creditNowBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 10,
    paddingVertical: 7,
  },
  creditNowText: { fontSize: 11.5, fontWeight: '800', color: '#065F46' },
});
