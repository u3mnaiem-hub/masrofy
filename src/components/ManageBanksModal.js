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

const LINKED_ACCOUNT_TYPES = [
  { id: 'current', labelAr: 'جاري', labelEn: 'Current', icon: 'bank-outline' },
  { id: 'savings', labelAr: 'توفير', labelEn: 'Savings', icon: 'piggy-bank-outline' },
  { id: 'meeza', labelAr: 'ميزة', labelEn: 'Meeza', icon: 'card-account-details-outline' },
  { id: 'credit', labelAr: 'ائتمان', labelEn: 'Credit', icon: 'credit-card-clock-outline' },
];

export const ManageBanksModal = ({ visible, onClose }) => {
  const {
    customAccounts,
    deletedAccountIds,
    balances,
    addCustomAccount,
    deleteCustomAccount,
    deleteBuiltInAccount,
    restoreBuiltInAccounts,
    currency,
    formatAmount,
    isArabic,
  } = useExpense();

  const [accountType, setAccountType] = useState('debit'); // 'debit' | 'credit'
  const [linkedAccountType, setLinkedAccountType] = useState('current'); // 'current' | 'savings' | 'meeza' | 'credit'
  const [bankName, setBankName] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [carryOver, setCarryOver] = useState('');

  const handleSelectCardType = (type) => {
    setAccountType(type);
    if (type === 'credit') {
      setLinkedAccountType('credit');
    } else if (linkedAccountType === 'credit') {
      setLinkedAccountType('current');
    }
  };

  const handleAdd = async () => {
    const cleanName = bankName.trim();
    if (!cleanName) {
      Alert.alert(
        isArabic ? 'أدخل اسم البنك' : 'Enter Bank Name',
        isArabic
          ? 'يرجى كتابة اسم البنك أو البطاقة (مثل CIB، الأهلي، بنك مصر، QNB...).'
          : 'Please enter the bank or card name (e.g., CIB, NBE, Banque Misr, QNB...).'
      );
      return;
    }

    await addCustomAccount({
      bankName: cleanName,
      accountType,
      linkedAccountType,
      startingBalance: accountType === 'debit' ? parseFloat(startingBalance) || 0 : 0,
      carryOverDueThisMonth: accountType === 'credit' ? parseFloat(carryOver) || 0 : 0,
    });

    setBankName('');
    setStartingBalance('');
    setCarryOver('');
  };

  const handleDeleteCustom = (acc) => {
    Alert.alert(
      isArabic ? 'حذف البطاقة / البنك' : 'Delete Bank / Card',
      isArabic
        ? `هل تريد حذف "${acc.bankName}" من قائمة البطاقات الأساسية؟`
        : `Remove "${acc.bankName}" from your primary cards list?`,
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

  const handleDeleteBuiltIn = (card) => {
    Alert.alert(
      isArabic ? 'حذف كارت بنكي أساسي' : 'Delete Primary Bank Card',
      isArabic
        ? `هل تريد حذف "${card.title}" نهائياً من الشاشة الرئيسية وطرق الدفع؟ (يمكنك استعادته لاحقاً من نفس الشاشة)`
        : `Remove "${card.title}" from the home screen and payment methods? (You can restore it anytime here)`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، حذف' : 'Yes, Delete',
          style: 'destructive',
          onPress: () => deleteBuiltInAccount(card.id),
        },
      ]
    );
  };

  const getLinkedLabel = (key) => {
    const found = LINKED_ACCOUNT_TYPES.find((t) => t.id === key);
    if (!found) return isArabic ? 'جاري' : 'Current';
    return isArabic ? found.labelAr : found.labelEn;
  };

  // Active built-in bank cards (excluding Cash wallet which stays as cash pocket)
  const builtInBankCards = [
    {
      id: 'dc',
      title: isArabic ? 'DC / حساب بنكي (أساسي)' : 'DC / Bank Account (Default)',
      isCredit: false,
      linkedLabel: isArabic ? 'جاري' : 'Current',
      subText: isArabic
        ? `ديبيت • جاري • رصيد متاح: ${formatAmount(balances?.availDc || 0)} ${currency.symbol}`
        : `Debit • Current • Avail: ${formatAmount(balances?.availDc || 0)} ${currency.symbol}`,
    },
    {
      id: 'cc_ar',
      title: isArabic ? 'البنك العربي (CC AR)' : 'Arab Bank (CC AR)',
      isCredit: true,
      linkedLabel: isArabic ? 'ائتمان' : 'Credit',
      subText: isArabic
        ? `كريديت • ائتمان • مديونية: ${formatAmount(balances?.ccArDebt || 0)} ${currency.symbol}`
        : `Credit • Debt: ${formatAmount(balances?.ccArDebt || 0)} ${currency.symbol}`,
    },
    {
      id: 'cc_ca',
      title: isArabic ? 'كريدي أجريكول (CC CA)' : 'Crédit Agricole (CC CA)',
      isCredit: true,
      linkedLabel: isArabic ? 'ائتمان' : 'Credit',
      subText: isArabic
        ? `كريديت • ائتمان • مديونية: ${formatAmount(balances?.ccCaDebt || 0)} ${currency.symbol}`
        : `Credit • Debt: ${formatAmount(balances?.ccCaDebt || 0)} ${currency.symbol}`,
    },
  ].filter((c) => !(deletedAccountIds || []).includes(c.id));

  const totalCardsCount = builtInBankCards.length + (customAccounts || []).length;

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
              {isArabic ? 'إدارة البنوك والكروت الأساسية 🏦' : 'Manage Banks & Primary Cards 🏦'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* 1. Card Type Selector: Debit vs Credit */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '1. نوع الكارت (ديبيت أو كريديت)' : '1. Card Type (Debit or Credit)'}
            </Text>
            <View style={[styles.typeRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  accountType === 'debit' && styles.typeBtnDebitActive,
                  isArabic && { flexDirection: 'row-reverse' },
                ]}
                onPress={() => handleSelectCardType('debit')}
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
                  {isArabic ? 'ديبيت (Debit)' : 'Debit Card'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  accountType === 'credit' && styles.typeBtnCreditActive,
                  isArabic && { flexDirection: 'row-reverse' },
                ]}
                onPress={() => handleSelectCardType('credit')}
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
                  {isArabic ? 'كريديت (Credit)' : 'Credit Card'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Linked Account Type: Current, Savings, Meeza, Credit */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '2. نوع الحساب المربوط بالكارت' : '2. Linked Account Type'}
            </Text>
            <View style={[styles.linkedRow, isArabic && { flexDirection: 'row-reverse' }]}>
              {LINKED_ACCOUNT_TYPES.map((lt) => {
                const isActive = linkedAccountType === lt.id;
                return (
                  <TouchableOpacity
                    key={lt.id}
                    style={[
                      styles.linkedChip,
                      isActive && styles.linkedChipActive,
                      isArabic && { flexDirection: 'row-reverse' },
                    ]}
                    onPress={() => setLinkedAccountType(lt.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={lt.icon}
                      size={14}
                      color={isActive ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text style={[styles.linkedChipText, isActive && styles.linkedChipTextActive]}>
                      {isArabic ? lt.labelAr : lt.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Bank Name Input */}
            <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
              {isArabic ? '3. اسم البنك الذي ينتمي إليه الكارت' : '3. Bank Name'}
            </Text>
            <TextInput
              style={[styles.textInput, isArabic && { textAlign: 'right' }]}
              value={bankName}
              onChangeText={setBankName}
              placeholder={
                isArabic
                  ? 'مثال: بنك CIB، البنك الأهلي، بنك مصر، QNB، HSBC...'
                  : 'e.g. CIB, NBE, Banque Misr, QNB, HSBC...'
              }
              placeholderTextColor={COLORS.textMuted}
            />

            {/* 4. Starting Balance or Carry-over */}
            {accountType === 'debit' ? (
              <>
                <Text style={[styles.label, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? `4. الرصيد الافتتاحي المتاح (${currency.symbol})`
                    : `4. Starting Available Balance (${currency.symbol})`}
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
                    ? `4. مديونية حالية مستحقة (اختياري - ${currency.symbol})`
                    : `4. Current Unpaid Balance Due (Optional - ${currency.symbol})`}
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
                    ? '💡 سيظهر هذا الكارت كبطاقة أساسية في الشاشة الرئيسية وطرق الدفع، ومشترياته تستحق يوم 25 من الشهر الميلادي التالي.'
                    : '💡 This card will appear as a primary bank card on the Home screen and payment methods, due on the 25th of the following calendar month.'}
                </Text>
              </>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {isArabic ? 'إضافة الكارت كحساب أساسي الآن' : 'Add Primary Bank Card Now'}
              </Text>
            </TouchableOpacity>

            {/* All Active Primary Bank Cards (Built-in + User-Added) */}
            <View style={[styles.sectionHeaderRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.sectionTitle, isArabic && { textAlign: 'right' }]}>
                {isArabic
                  ? `الكروت والبنوك الأساسية (${totalCardsCount})`
                  : `Active Primary Bank Cards (${totalCardsCount})`}
              </Text>
              {(deletedAccountIds || []).length > 0 && (
                <TouchableOpacity onPress={restoreBuiltInAccounts} style={styles.restoreBtn}>
                  <Text style={styles.restoreBtnText}>
                    {isArabic ? 'استعادة الافتراضي ↺' : 'Restore Defaults ↺'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {builtInBankCards.map((card) => (
              <View
                key={card.id}
                style={[styles.cardItem, isArabic && { flexDirection: 'row-reverse' }]}
              >
                <View
                  style={[
                    styles.cardBadge,
                    { backgroundColor: card.isCredit ? '#FEF3C7' : '#DBEAFE' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={card.isCredit ? 'credit-card-clock-outline' : 'credit-card-outline'}
                    size={20}
                    color={card.isCredit ? '#D97706' : '#2563EB'}
                  />
                </View>
                <View style={[{ flex: 1, marginHorizontal: 10 }, isArabic && { alignItems: 'flex-end' }]}>
                  <Text style={styles.cardItemTitle}>{card.title}</Text>
                  <Text style={styles.cardItemSub}>{card.subText}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteBuiltIn(card)}
                  style={styles.deleteBtn}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            {(customAccounts || []).map((acc) => {
              const isCredit = acc.accountType === 'credit';
              const linkedLbl = getLinkedLabel(acc.linkedAccountType || (isCredit ? 'credit' : 'current'));
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
                          ? `كريديت • ${linkedLbl} • مرحل: ${formatAmount((acc.carryOverDueThisMonth || 0) + (acc.carryOverDueNextMonth || 0))} ${currency.symbol}`
                          : `Credit • ${linkedLbl} • Due: ${formatAmount((acc.carryOverDueThisMonth || 0) + (acc.carryOverDueNextMonth || 0))} ${currency.symbol}`
                        : isArabic
                        ? `ديبيت • ${linkedLbl} • رصيد بداية: ${formatAmount(acc.startingBalance)} ${currency.symbol}`
                        : `Debit • ${linkedLbl} • Start: ${formatAmount(acc.startingBalance)} ${currency.symbol}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCustom(acc)}
                    style={styles.deleteBtn}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {totalCardsCount === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  {isArabic
                    ? 'لا توجد كروت بنكية مفعلة حالياً. أضف كارتاً جديداً بالأعلى أو استعد الكروت الافتراضية.'
                    : 'No active bank cards right now. Add a new card above or restore defaults.'}
                </Text>
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
    fontSize: 15.5,
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
    paddingBottom: 32,
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
    marginBottom: 6,
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
  linkedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 6,
  },
  linkedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkedChipActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  linkedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  linkedChipTextActive: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  restoreBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  restoreBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
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
    fontSize: 13.5,
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
