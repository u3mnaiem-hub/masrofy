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
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const ManageBanksModal = ({ visible, onClose }) => {
  const {
    customAccounts,
    addCustomAccount,
    deleteCustomAccount,
    currency,
    formatAmount,
    isArabic,
  } = useExpense();

  const [accountType, setAccountType] = useState('credit'); // 'credit' | 'debit'
  const [bankName, setBankName] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [carryOver, setCarryOver] = useState('');

  const handleAdd = async () => {
    const cleanName = bankName.trim();
    if (!cleanName) {
      Alert.alert(
        isArabic ? 'أدخل اسم البنك' : 'Enter Bank Name',
        isArabic
          ? 'يرجى كتابة اسم البنك أو البطاقة (مثل CIB، الأهلي، QNB...).'
          : 'Please enter the bank or card name (e.g., CIB, NBE, QNB, HSBC...).'
      );
      return;
    }

    await addCustomAccount({
      bankName: cleanName,
      accountType,
      startingBalance: accountType === 'debit' ? parseFloat(startingBalance) || 0 : 0,
      carryOverDueThisMonth: accountType === 'credit' ? parseFloat(carryOver) || 0 : 0,
    });

    setBankName('');
    setStartingBalance('');
    setCarryOver('');
  };

  const handleDelete = (acc) => {
    Alert.alert(
      isArabic ? 'حذف البطاقة / البنك' : 'Delete Bank / Card',
      isArabic
        ? `هل تريد حذف "${acc.bankName}" من قائمة البطاقات؟`
        : `Remove "${acc.bankName}" from your cards list?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomAccount(acc.id),
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
              {isArabic ? 'إدارة البنوك والكروت الجديدة 🏦' : 'Manage Banks & Cards 🏦'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Card Type Selector */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'نوع البطاقة المراد إضافتها' : 'Select Card / Account Type'}
            </Text>
            <View style={[styles.typeRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  accountType === 'credit' && styles.typeBtnCreditActive,
                  isArabic && { flexDirection: 'row-reverse' },
                ]}
                onPress={() => setAccountType('credit')}
              >
                <MaterialCommunityIcons
                  name="credit-card-clock-outline"
                  size={18}
                  color={accountType === 'credit' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    accountType === 'credit' && styles.typeBtnTextActive,
                  ]}
                >
                  {isArabic ? 'كارت ائتمان (Credit Card)' : 'Credit Card (CC)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  accountType === 'debit' && styles.typeBtnDebitActive,
                  isArabic && { flexDirection: 'row-reverse' },
                ]}
                onPress={() => setAccountType('debit')}
              >
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={18}
                  color={accountType === 'debit' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    accountType === 'debit' && styles.typeBtnTextActive,
                  ]}
                >
                  {isArabic ? 'DC / حساب بنكي' : 'DC / Bank Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bank Name Input */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'اسم البنك / البطاقة (بأي اسم تريده)' : 'Bank / Card Name (Custom Name)'}
            </Text>
            <TextInput
              style={[styles.textInput, isArabic && { textAlign: 'right' }]}
              value={bankName}
              onChangeText={setBankName}
              placeholder={
                isArabic
                  ? 'مثال: بنك CIB، البنك الأهلي، QNB، HSBC...'
                  : 'e.g. CIB, NBE, QNB, HSBC, Banque Misr...'
              }
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Optional Starting Balance or Carry-over */}
            {accountType === 'debit' ? (
              <>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? `الرصيد الافتتاحي المتاح بالبطاقة (${currency.symbol})`
                    : `Starting Available Balance (${currency.symbol})`}
                </Text>
                <TextInput
                  style={[styles.textInput, isArabic && { textAlign: 'right' }]}
                  value={startingBalance}
                  onChangeText={setStartingBalance}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
              </>
            ) : (
              <>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? `مديونية سابقة مستحقة يوم 25 هذا الشهر (اختياري - ${currency.symbol})`
                    : `Prior Unpaid Balance Due 25th This Month (Optional - ${currency.symbol})`}
                </Text>
                <TextInput
                  style={[styles.textInput, isArabic && { textAlign: 'right' }]}
                  value={carryOver}
                  onChangeText={setCarryOver}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={[styles.hintText, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? '💡 أي مشتريات جديدة بهذا الكارت ستُحسب تلقائياً بفترة سماح وتستحق يوم 25 من الشهر التالي.'
                    : '💡 New purchases on this Credit Card automatically get a grace period until the 25th of the following month.'}
                </Text>
              </>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {isArabic ? 'إضافة البنك / البطاقة الآن' : 'Add Bank / Card Now'}
              </Text>
            </TouchableOpacity>

            {/* Existing Default & Custom Cards List */}
            <Text style={[styles.sectionTitle, isArabic && { textAlign: 'right' }]}>
              {isArabic
                ? `البطاقات والبنوك المضافة (${customAccounts.length})`
                : `Your Custom Banks & Cards (${customAccounts.length})`}
            </Text>

            {customAccounts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  {isArabic
                    ? 'لم تقم بإضافة كروت إضافية بعد (الافتراضي: كاش، بطاقة بنكية، البنك العربي، كريدي أجريكول).'
                    : 'No custom banks added yet (Default: Cash, Debit Card, Arab Bank, Crédit Agricole).'}
                </Text>
              </View>
            ) : (
              customAccounts.map((acc) => {
                const isCredit = acc.accountType === 'credit';
                return (
                  <View
                    key={acc.id}
                    style={[styles.cardItem, isArabic && { flexDirection: 'row-reverse' }]}
                  >
                    <View
                      style={[
                        styles.cardBadge,
                        { backgroundColor: isCredit ? '#FEF3C7' : '#DBEAFE' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isCredit ? 'credit-card-clock-outline' : 'credit-card-outline'}
                        size={20}
                        color={isCredit ? '#D97706' : '#2563EB'}
                      />
                    </View>
                    <View style={[{ flex: 1, marginHorizontal: 10 }, isArabic && { alignItems: 'flex-end' }]}>
                      <Text style={styles.cardItemTitle}>{acc.bankName}</Text>
                      <Text style={styles.cardItemSub}>
                        {isCredit
                          ? isArabic
                            ? `بطاقة ائتمان (Credit Card) • مرحل: ${formatAmount(acc.carryOverDueThisMonth)} ${currency.symbol}`
                            : `Credit Card (CC) • Carry-over: ${formatAmount(acc.carryOverDueThisMonth)} ${currency.symbol}`
                          : isArabic
                          ? `DC / حساب بنكي • رصيد بداية: ${formatAmount(acc.startingBalance)} ${currency.symbol}`
                          : `DC / Bank Account • Start: ${formatAmount(acc.startingBalance)} ${currency.symbol}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(acc)}
                      style={styles.deleteBtn}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
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
    fontWeight: '800',
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnCreditActive: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  typeBtnDebitActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: 6,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 18,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  emptyBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  cardBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardItemSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
});
