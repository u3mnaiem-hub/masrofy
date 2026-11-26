import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { EXPENSE_CATEGORIES } from '../constants/categories';

export const ManageCategoriesModal = ({ visible, onClose }) => {
  const {
    allExpenseCategories,
    addCustomCategory,
    deleteCategory,
    restoreAllCategories,
    isArabic,
    isDarkMode,
    themeColors,
  } = useExpense();

  const insets = useSafeAreaInsets();
  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [selectedIcon, setSelectedIcon] = useState('tag-outline');

  const COLOR_OPTIONS = [
    '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
    '#3B82F6', '#10B981', '#6366F1', '#EF4444',
    '#059669', '#D97706', '#7C3AED', '#0284C7',
  ];

  const ICON_OPTIONS = [
    'tag-outline', 'cart-outline', 'silverware-fork-knife', 'gas-station',
    'medical-bag', 'bus', 'home-outline', 'cellphone',
    'gift-outline', 'school-outline', 'dumbbell', 'hammer-wrench',
    'airplane', 'paw', 'coffee-outline', 'book-open-outline',
  ];

  const categories = allExpenseCategories && allExpenseCategories.length > 0
    ? allExpenseCategories
    : EXPENSE_CATEGORIES;

  const handleCreateCategory = async () => {
    const clean = (newCatName || '').trim();
    if (!clean) {
      Alert.alert(isArabic ? 'تنبيه' : 'Alert', isArabic ? 'يرجى كتابة اسم البند' : 'Please enter category name');
      return;
    }

    await addCustomCategory({
      name: clean,
      nameAr: clean,
      icon: selectedIcon,
      color: selectedColor,
      bgColor: selectedColor + '20',
    });

    setNewCatName('');
    setNewCatModalVisible(false);
    Alert.alert(
      isArabic ? 'تم بنجاح 🎉' : 'Success 🎉',
      isArabic ? `تمت إضافة بند «${clean}» إلى قائمة المصروفات بنجاح.` : `Category "${clean}" added successfully.`
    );
  };

  const handleDelete = (cat) => {
    const catName = isArabic ? (cat.nameAr || cat.name) : cat.name;
    Alert.alert(
      isArabic ? 'حذف البند نهائياً 🗑️' : 'Delete Category 🗑️',
      isArabic
        ? `هل أنت متأكد من حذف بند «${catName}» نهائياً من كافة شاشات المصروفات؟`
        : `Are you sure you want to delete "${catName}" permanently?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، حذف البند' : 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            Alert.alert(
              isArabic ? 'تم الحذف' : 'Deleted',
              isArabic ? `تم حذف بند «${catName}» بنجاح وإخفاؤه من التطبيق.` : `Category "${catName}" has been removed.`
            );
          },
        },
      ]
    );
  };

  const handleRestoreDefaults = () => {
    Alert.alert(
      isArabic ? 'استرجاع البنود الأصلية 🔄' : 'Restore Default Categories 🔄',
      isArabic
        ? 'هل تريد استعادة كافة بنود المصروفات الأساسية المحذوفة للوضع الافتراضي؟'
        : 'Restore all deleted built-in categories to their default state?',
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، استرجاع الكل' : 'Yes, Restore All',
          onPress: async () => {
            if (restoreAllCategories) {
              await restoreAllCategories();
            }
            Alert.alert(
              isArabic ? 'تمت الاستعادة 🎉' : 'Restored 🎉',
              isArabic ? 'تمت استعادة كافة البنود الأساسية المحذوفة بنجاح.' : 'Default categories restored successfully.'
            );
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            isDarkMode && { backgroundColor: themeColors.surface },
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, isDarkMode && { backgroundColor: '#1E1E1E' }]}>
              <MaterialCommunityIcons name="close" size={22} color={isDarkMode ? '#FFFFFF' : COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
              <Text
                style={[styles.headerTitle, isDarkMode && { color: themeColors.textPrimary }]}
                numberOfLines={2}
              >
                {isArabic ? 'إدارة وحذف بنود المصروفات 🏷️' : 'Manage & Delete Categories 🏷️'}
              </Text>
              <Text style={[styles.headerSub, isDarkMode && { color: themeColors.textSecondary }]}>
                {isArabic ? `إجمالي البنود المفعلة: ${categories.length}` : `Active Categories: ${categories.length}`}
              </Text>
            </View>
            <View style={{ width: 34 }} />
          </View>

          {/* Action Row: Add New & Restore */}
          <View style={[styles.topActionsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              style={[styles.addBtn, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={() => setNewCatModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus-circle" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {isArabic ? 'إضافة بند جديد' : 'Add Category'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.restoreBtn,
                isArabic && { flexDirection: 'row-reverse' },
                isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' },
              ]}
              onPress={handleRestoreDefaults}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="restore" size={16} color={isDarkMode ? '#E2E8F0' : '#334155'} />
              <Text style={[styles.restoreBtnText, isDarkMode && { color: '#E2E8F0' }]}>
                {isArabic ? 'استعادة الافتراضي' : 'Restore Defaults'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories List */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={[styles.scrollList, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {categories.map((cat, idx) => {
              const catName = isArabic ? (cat.nameAr || cat.name) : cat.name;
              return (
                <View
                  key={cat.id || idx}
                  style={[styles.categoryRow, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: '#1E1E1E', borderColor: '#27272A' }]}
                >
                  <View style={[styles.catInfoLeft, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.catIconBox, { backgroundColor: cat.color || '#6366F1' }]}>
                      <MaterialCommunityIcons name={cat.icon || 'tag'} size={18} color="#FFFFFF" />
                    </View>
                    <View style={[styles.catTextWrap, isArabic && { alignItems: 'flex-end' }]}>
                      <Text
                        style={[
                          styles.catNameText,
                          isDarkMode && { color: '#FFFFFF' },
                          isArabic && { textAlign: 'right' },
                        ]}
                      >
                        {catName}
                      </Text>
                      <Text style={[styles.catSubText, isArabic && { textAlign: 'right' }]}>
                        {cat.isCustom ? (isArabic ? 'بند مخصص' : 'Custom') : (isArabic ? 'بند أساسي' : 'Built-in')}
                      </Text>
                    </View>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={[styles.deleteBtn, isArabic && { flexDirection: 'row-reverse' }]}
                    onPress={() => handleDelete(cat)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>
                      {isArabic ? 'حذف' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* New Category Modal */}
          <Modal
            visible={newCatModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setNewCatModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.innerOverlay, { paddingBottom: Math.max(insets.bottom, 20) }]}
            >
              <ScrollView
                style={{ width: '100%', maxWidth: 390 }}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
              <View style={[styles.newCatCard, isDarkMode && { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
                <View style={[styles.newCatHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                  <MaterialCommunityIcons name="tag-plus" size={24} color="#059669" />
                  <Text style={styles.newCatTitle}>
                    {isArabic ? 'إضافة بند مصروفات جديد 🏷️' : 'Add New Category 🏷️'}
                  </Text>
                </View>

                {/* Name Input */}
                <Text style={[styles.fieldLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'اسم البند الجديد:' : 'Category Name:'}
                </Text>
                <TextInput
                  style={[styles.nameInput, isArabic && { textAlign: 'right' }]}
                  placeholder={isArabic ? 'مثال: صيانة سيارة، رحلات، دروس...' : 'e.g. Travel, Gym, Courses'}
                  placeholderTextColor={COLORS.textMuted}
                  value={newCatName}
                  onChangeText={setNewCatName}
                  autoFocus={true}
                />

                {/* Color Selector */}
                <Text style={[styles.fieldLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'اختر لون البند:' : 'Choose Color:'}
                </Text>
                <View style={styles.colorsRow}>
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        selectedColor === c && styles.selectedColorCircle,
                      ]}
                      onPress={() => setSelectedColor(c)}
                    >
                      {selectedColor === c && (
                        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Icon Selector */}
                <Text style={[styles.fieldLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'اختر أيقونة البند:' : 'Choose Icon:'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconsRow}>
                  {ICON_OPTIONS.map((ico) => (
                    <TouchableOpacity
                      key={ico}
                      style={[
                        styles.iconOption,
                        selectedIcon === ico && { borderColor: selectedColor, backgroundColor: selectedColor + '20' },
                      ]}
                      onPress={() => setSelectedIcon(ico)}
                    >
                      <MaterialCommunityIcons
                        name={ico}
                        size={20}
                        color={selectedIcon === ico ? selectedColor : '#64748B'}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Action Buttons */}
                <View style={[styles.modalActionsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelModalBtn]}
                    onPress={() => setNewCatModalVisible(false)}
                  >
                    <Text style={styles.cancelModalText}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.saveModalBtn]}
                    onPress={handleCreateCategory}
                  >
                    <Text style={styles.saveModalText}>{isArabic ? 'حفظ البند' : 'Save Category'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  headerSub: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  topActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 11,
    minHeight: 42,
    borderRadius: 12,
    gap: 5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
    textAlign: 'center',
    flexShrink: 1,
  },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 11,
    minHeight: 42,
    borderRadius: 12,
    gap: 5,
  },
  restoreBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  scrollList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 30,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  catInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catTextWrap: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },
  catNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  catSubText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 66,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  // Inner Modal
  innerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  newCatCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  newCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  newCatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorCircle: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  iconsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: '#F8FAFC',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelModalBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelModalText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  saveModalBtn: {
    backgroundColor: '#059669',
  },
  saveModalText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
