import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getCategoryById, getPaymentMethodById } from '../constants/categories';
import { useExpense, getGracePeriodStats } from '../context/ExpenseContext';

export const TransactionItem = ({ item }) => {
  const {
    deleteTransaction,
    currency,
    formatAmount,
    language,
    isArabic,
    getAccountById,
    isCreditCardMethod,
    settleCreditCardTransaction,
    unsettleCreditCardTransaction,
    isDarkMode,
    themeColors,
  } = useExpense();
  const category = getCategoryById(item.categoryId, language);
  const isIncome = item.type === 'income';

  const payment = getAccountById ? getAccountById(item.paymentMethod) : getPaymentMethodById(item.paymentMethod, language);
  const isSwitch = item.type === 'switch' || item.categoryId === 'switch';
  const isCcPaid = item.type === 'cc_pyd' || item.categoryId === 'cc_pyd';
  const isCcPurchase = !isIncome && !isSwitch && !isCcPaid && (isCreditCardMethod ? isCreditCardMethod(item.paymentMethod) : (item.paymentMethod === 'cc_ar' || item.paymentMethod === 'cc_ca'));
  const grace = isCcPurchase ? getGracePeriodStats(item.date, item.dueDate) : null;

  let paymentLabel = payment?.displayName || item.paymentMethod;
  if (isCcPaid) {
    const targetAcc = getAccountById && item.targetCard ? getAccountById(item.targetCard) : null;
    const targetName = targetAcc
      ? targetAcc.displayName
      : item.targetCard === 'cc_ca'
      ? (isArabic ? 'أجريكول (CC CA)' : 'Crédit Agricole')
      : (isArabic ? 'العربي (CC AR)' : 'Arab Bank');
    paymentLabel = `${payment?.displayShort || paymentLabel} ➡️ ${targetName}`;
  } else if (isSwitch) {
    const toAcc = getAccountById && item.toAccount ? getAccountById(item.toAccount) : null;
    const toName = toAcc
      ? toAcc.displayShort
      : item.toAccount === 'csh'
      ? (isArabic ? 'كاش متاح' : 'Cash')
      : (isArabic ? 'DC / بنك' : 'DC Bank');
    paymentLabel = `${payment?.displayShort || paymentLabel} ➡️ ${toName}`;
  }

  const handleSettlePress = () => {
    const cardObj = getAccountById ? getAccountById(item.paymentMethod) : null;
    const cardName = cardObj?.displayName || item.paymentMethod;
    const txTitle = item.note || category.displayName;

    Alert.alert(
      isArabic ? 'سداد معاملة كارت الائتمان 💳' : 'Settle Credit Card Transaction 💳',
      isArabic
        ? `المعاملة: ${txTitle}\nالقيمة: ${formatAmount(item.amount)} ${currency.symbol}\nالكارت: ${cardName}\n\nاختر الحساب المراد خصم مبلغ السداد منه:`
        : `Transaction: ${txTitle}\nAmount: ${formatAmount(item.amount)} ${currency.symbol}\nCard: ${cardName}\n\nSelect source account:`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'خصم من البنك (DC) 🏦' : 'Pay from DC Bank 🏦',
          onPress: async () => {
            if (settleCreditCardTransaction) {
              await settleCreditCardTransaction(item, 'dc');
              Alert.alert(
                isArabic ? 'تم السداد بنجاح 🎉' : 'Settled Successfully 🎉',
                isArabic
                  ? `تم تسجيل سداد بقيمة ${formatAmount(item.amount)} ${currency.symbol} مخصومة من البنك (DC) وتخفيض مديونية البطاقة فورياً.`
                  : `Payment of ${formatAmount(item.amount)} ${currency.symbol} recorded from DC Bank.`
              );
            }
          },
        },
        {
          text: isArabic ? 'خصم من الكاش (Cash) 💵' : 'Pay from Cash 💵',
          onPress: async () => {
            if (settleCreditCardTransaction) {
              await settleCreditCardTransaction(item, 'csh');
              Alert.alert(
                isArabic ? 'تم السداد بنجاح 🎉' : 'Settled Successfully 🎉',
                isArabic
                  ? `تم تسجيل سداد بقيمة ${formatAmount(item.amount)} ${currency.symbol} مخصومة من الكاش وتخفيض مديونية البطاقة فورياً.`
                  : `Payment of ${formatAmount(item.amount)} ${currency.symbol} recorded from Cash.`
              );
            }
          },
        },
      ]
    );
  };

  const handleUnsettlePress = () => {
    Alert.alert(
      isArabic ? 'معاملة مسددة ✓' : 'Settled Transaction ✓',
      isArabic
        ? `هذه المعاملة مسددة بالفعل بقيمة ${formatAmount(item.amount)} ${currency.symbol}.\nهل ترغب في إلغاء سدادها وإعادتها كمديونية مستحقة؟`
        : `This transaction is already settled. Would you like to revert its settlement?`,
      [
        { text: isArabic ? 'إغلاق' : 'Close', style: 'cancel' },
        {
          text: isArabic ? 'إلغاء السداد ↩️' : 'Revert Settlement ↩️',
          style: 'destructive',
          onPress: async () => {
            if (unsettleCreditCardTransaction) {
              await unsettleCreditCardTransaction(item);
              Alert.alert(
                isArabic ? 'تم الإلغاء' : 'Reverted',
                isArabic ? 'تم إلغاء سداد المعاملة وإعادتها كمستحق في الكارت.' : 'Settlement has been reverted.'
              );
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      isArabic ? 'حذف المعاملة' : 'Delete Transaction',
      isArabic
        ? `هل أنت متأكد من حذف هذه المعاملة (${category.displayName} - ${formatAmount(item.amount)} ${currency.symbol})؟`
        : `Are you sure you want to delete this transaction (${category.displayName} - ${formatAmount(item.amount)} ${currency.symbol})?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(item.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      {/* Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
        <MaterialCommunityIcons name={category.icon} size={18} color={category.color} />
      </View>

      {/* Main Details (Flexible middle column, never overlaps) */}
      <View style={[styles.detailsContainer, isArabic ? { alignItems: 'flex-end', marginRight: 10 } : { alignItems: 'flex-start', marginLeft: 10 }]}>
        <Text style={[styles.categoryName, isDarkMode && { color: themeColors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.8}>
          {category.displayName}
        </Text>

        {item.note ? (
          <Text style={[styles.noteText, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.8}>
            {item.note}
          </Text>
        ) : null}

        <View style={[styles.metaRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.dateText, isDarkMode && { color: themeColors.textMuted }]}>{item.date}</Text>
          <View style={[styles.dot, isDarkMode && { backgroundColor: themeColors.border }]} />
          <Text style={[styles.paymentMethodText, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.75}>{paymentLabel}</Text>
        </View>

        {grace && (
          <Text style={styles.graceText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.75}>
            {isArabic
              ? `سداد ${grace.dueDate} (${grace.remainingGraceDays} يوم متبقي)`
              : `Due ${grace.dueDate} (${grace.remainingGraceDays}d left)`}
          </Text>
        )}

        {isCcPurchase && (
          <View style={[styles.settleActionRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {item.isPaid ? (
              <TouchableOpacity
                style={[styles.settledBadge, isArabic && { flexDirection: 'row-reverse' }]}
                onPress={handleUnsettlePress}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="check-circle" size={12} color="#15803D" />
                <Text style={styles.settledBadgeText}>
                  {isArabic ? 'مسددة ✓' : 'Settled ✓'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.settleButton, isArabic && { flexDirection: 'row-reverse' }]}
                onPress={handleSettlePress}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="credit-card-check-outline" size={13} color="#1D4ED8" />
                <Text style={styles.settleButtonText}>
                  {isArabic ? 'سداد المعاملة 💳' : 'Settle 💳'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Amount and delete button (clean, dedicated column with zero overlapping) */}
      <View style={[styles.rightCol, isArabic ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
        <View style={[styles.amountRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <Text
            style={[
              styles.amountText,
              { color: isIncome ? COLORS.incomeDark : COLORS.expense },
            ]}
          >
            {isIncome ? '+' : '-'} {formatAmount(item.amount)}
          </Text>
          <Text style={styles.currencySymbol}>{currency.symbol}</Text>
        </View>

        {/* Delete button: separated with a clean touch circle */}
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteButton}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={15} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: '100%',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  noteText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  dateText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  paymentMethodText: {
    fontSize: 9.5,
    color: COLORS.primaryDark,
    fontWeight: '600',
    flexShrink: 1,
  },
  graceText: {
    fontSize: 9,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
  rightCol: {
    justifyContent: 'center',
    minWidth: 70,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  amountText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  currencySymbol: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  settleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  settleButtonText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  settledBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
});
