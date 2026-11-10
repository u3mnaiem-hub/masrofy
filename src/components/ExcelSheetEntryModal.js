import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { EXPENSE_CATEGORIES } from '../constants/categories';

export const ExcelSheetEntryModal = ({ visible, onClose }) => {
  const {
    isArabic,
    currency,
    formatAmount,
    allPaymentMethods,
    addTransactionsBatch,
  } = useExpense();

  const todayStr = new Date().toISOString().split('T')[0];

  const createEmptyRow = (customDate = null) => ({
    id: 'row_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    date: customDate || todayStr,
    note: '',
    amount: '',
    paymentMethod: 'csh',
    categoryId: 'food',
  });

  // Pre-populate with 15 full rows ready for direct entry just like an Excel worksheet
  const generateInitialRows = () => {
    const list = [];
    for (let i = 0; i < 15; i++) {
      list.push(createEmptyRow());
    }
    return list;
  };

  const [rows, setRows] = useState(generateInitialRows);
  const [isSaving, setIsSaving] = useState(false);

  const categoriesList = EXPENSE_CATEGORIES.map((c) => ({
    id: c.id,
    label: isArabic ? c.nameAr || c.name : c.name,
    color: c.color,
  }));

  const updateRow = (rowId, field, val) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: val } : r))
    );
  };

  const addExtraRows = (count = 5) => {
    const newOnes = [];
    for (let i = 0; i < count; i++) {
      newOnes.push(createEmptyRow());
    }
    setRows((prev) => [...prev, ...newOnes]);
  };

  const clearEntireSheet = () => {
    setRows(generateInitialRows());
  };

  const cyclePaymentMethod = (rowId, currentPm) => {
    const list = allPaymentMethods || [];
    const idx = list.findIndex((p) => p.id === currentPm);
    const nextIdx = (idx + 1) % list.length;
    updateRow(rowId, 'paymentMethod', list[nextIdx]?.id || 'csh');
  };

  const cycleCategory = (rowId, currentCatId) => {
    const idx = categoriesList.findIndex((c) => c.id === currentCatId);
    const nextIdx = (idx + 1) % categoriesList.length;
    updateRow(rowId, 'categoryId', categoriesList[nextIdx]?.id || 'food');
  };

  const totalAmount = rows.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  const validRows = rows.filter((r) => parseFloat(r.amount) > 0);

  const handleSaveAll = async () => {
    if (validRows.length === 0) {
      Alert.alert(
        isArabic ? 'تنبيه' : 'Alert',
        isArabic
          ? 'اكتب مبالغ في الصفوف أولاً لحفظها.'
          : 'Please enter amounts in the rows before saving.'
      );
      return;
    }

    try {
      setIsSaving(true);
      await addTransactionsBatch(validRows);
      Alert.alert(
        isArabic ? 'تم الحفظ في الحسابات بنجاح' : 'Saved Successfully',
        isArabic
          ? `تم حفظ ${validRows.length} مصروفات بإجمالي ${formatAmount(totalAmount)} ${currency.symbol} تلقائياً.`
          : `Saved ${validRows.length} expenses totaling ${formatAmount(totalAmount)} ${currency.symbol}.`
      );
      clearEntireSheet();
      onClose();
    } catch (e) {
      Alert.alert(isArabic ? 'خطأ' : 'Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.titleGroup, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={styles.excelIconBox}>
              <MaterialCommunityIcons name="file-excel-box" size={24} color="#107C41" />
            </View>
            <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
              <Text style={styles.title}>
                {isArabic ? 'جدول إكسيل لإدخال المصروفات' : 'Excel Expenses Worksheet'}
              </Text>
              <Text style={styles.subtitle}>
                {isArabic
                  ? 'صفوف مفتوحة جاهزة للكتابة مباشرة كما في شيت الإكسيل'
                  : 'Open spreadsheet rows ready for fast data entry'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Action Header Banner */}
        <View style={[styles.sheetTopControls, isArabic && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.sheetInfoText}>
            {isArabic
              ? `📋 ${rows.length} صف متاح • المكتمل: ${validRows.length}`
              : `📋 ${rows.length} rows • Filled: ${validRows.length}`}
          </Text>
          <View style={[styles.topBtnsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={clearEntireSheet}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtnText}>{isArabic ? 'مسح الشيت' : 'Clear'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreRowsBtn}
              onPress={() => addExtraRows(5)}
              activeOpacity={0.7}
            >
              <Text style={styles.moreRowsText}>{isArabic ? '+ 5 صفوف' : '+ 5 Rows'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Excel Spreadsheet Table */}
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={true}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              {/* Table Header Row */}
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.thCell, { width: 34 }]}>#</Text>
                <Text style={[styles.thCell, { width: 92 }]}>{isArabic ? 'التاريخ' : 'Date'}</Text>
                <Text style={[styles.thCell, { width: 140 }]}>{isArabic ? 'البيان / الوصف' : 'Note'}</Text>
                <Text style={[styles.thCell, { width: 85 }]}>{isArabic ? 'المبلغ' : 'Amount'}</Text>
                <Text style={[styles.thCell, { width: 105 }]}>{isArabic ? 'وسيلة الدفع' : 'Payment'}</Text>
                <Text style={[styles.thCell, { width: 110 }]}>{isArabic ? 'البند' : 'Category'}</Text>
              </View>

              {/* 15+ Data Rows */}
              {rows.map((row, idx) => {
                const currentPm =
                  allPaymentMethods.find((p) => p.id === row.paymentMethod) || {
                    nameAr: 'كاش',
                    name: 'Cash',
                  };
                const currentCat =
                  categoriesList.find((c) => c.id === row.categoryId) || {
                    label: 'طعام وبقالة',
                    color: '#F59E0B',
                  };
                const isRowFilled = parseFloat(row.amount) > 0;

                return (
                  <View
                    key={row.id}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 && styles.tableRowAlt,
                      isRowFilled && styles.tableRowFilled,
                    ]}
                  >
                    {/* Index */}
                    <Text style={[styles.tdCell, styles.indexCell, { width: 34 }]}>
                      {idx + 1}
                    </Text>

                    {/* Date */}
                    <View style={[{ width: 92 }, styles.inputCellWrap]}>
                      <TextInput
                        style={styles.cellInput}
                        value={row.date}
                        onChangeText={(t) => updateRow(row.id, 'date', t)}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    {/* Note */}
                    <View style={[{ width: 140 }, styles.inputCellWrap]}>
                      <TextInput
                        style={[styles.cellInput, { textAlign: isArabic ? 'right' : 'left' }]}
                        value={row.note}
                        onChangeText={(t) => updateRow(row.id, 'note', t)}
                        placeholder={isArabic ? 'اكتب المصروف...' : 'Description...'}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    {/* Amount */}
                    <View style={[{ width: 85 }, styles.inputCellWrap]}>
                      <TextInput
                        style={[styles.cellInput, styles.amountInput]}
                        value={row.amount}
                        onChangeText={(t) => updateRow(row.id, 'amount', t)}
                        placeholder="0"
                        placeholderTextColor="#94A3B8"
                        keyboardType="decimal-pad"
                      />
                    </View>

                    {/* Payment Method Toggle Button */}
                    <TouchableOpacity
                      style={[{ width: 105 }, styles.clickableCellWrap]}
                      onPress={() => cyclePaymentMethod(row.id, row.paymentMethod)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {isArabic ? currentPm.nameAr || currentPm.name : currentPm.name} ▾
                      </Text>
                    </TouchableOpacity>

                    {/* Category Toggle Button */}
                    <TouchableOpacity
                      style={[{ width: 110 }, styles.clickableCellWrap]}
                      onPress={() => cycleCategory(row.id, row.categoryId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.badgeText, { color: currentCat.color || '#334155' }]} numberOfLines={1}>
                        {currentCat.label} ▾
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Bottom Sticky Action Bar */}
        <View style={[styles.bottomBar, isArabic && { flexDirection: 'row-reverse' }]}>
          <View style={isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
            <Text style={styles.bottomSubText}>
              {isArabic
                ? `${validRows.length} مصروفات جاهزة للحفظ`
                : `${validRows.length} filled expenses`}
            </Text>
            <Text style={styles.bottomTotalText}>
              {formatAmount(totalAmount)} {currency.symbol}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isArabic && { flexDirection: 'row-reverse' }]}
            onPress={handleSaveAll}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="content-save-check" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>
              {isArabic ? 'حفظ الكل في الحسابات' : 'Save All to Accounts'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  excelIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  sheetTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  sheetInfoText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
  },
  topBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  moreRowsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#107C41',
  },
  moreRowsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetScroll: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    height: 38,
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableRowFilled: {
    backgroundColor: '#F0FDF4',
  },
  tableHeaderRow: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 2,
    borderBottomColor: '#94A3B8',
    height: 34,
  },
  thCell: {
    paddingHorizontal: 4,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  tdCell: {
    paddingHorizontal: 4,
    fontSize: 10.5,
    color: '#0F172A',
  },
  indexCell: {
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '700',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  inputCellWrap: {
    paddingHorizontal: 2,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
  },
  cellInput: {
    fontSize: 11,
    color: '#0F172A',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  amountInput: {
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
  },
  clickableCellWrap: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginVertical: 2,
    marginHorizontal: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 28,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#334155',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomSubText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomTotalText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#107C41',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
