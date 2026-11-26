import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const HelpAndFeaturesModal = ({ visible, onClose, initialTab = 'help' }) => {
  const { isArabic, isDarkMode, themeColors } = useExpense();
  const [activeTab, setActiveTab] = useState(initialTab || 'help'); // 'help' | 'features'

  const helpSteps = isArabic
    ? [
        {
          step: '1',
          icon: 'bank-outline',
          color: '#2563EB',
          bg: '#EFF6FF',
          title: 'إعداد أرصدتك وبنوكك لأول مرة',
          desc: 'من شاشة «الإعدادات» اختر «تعديل أرصدة البداية» لتحديد الكاش والرصيد البنكي الذي تبدأ به، ومن «إضافة وحذف البنوك والكروت» يمكنك إضافة أو حذف أي كارت ديبيت أو كريديت (جاري، توفير، ميزة، ائتمان).',
        },
        {
          step: '2',
          icon: 'minus-circle-outline',
          color: '#DC2626',
          bg: '#FEF2F2',
          title: 'تسجيل المصروفات والوارد وسداد الكروت',
          desc: 'اضغط على الزر الدائري «تسجيل مصروف» لإضافة مصروف يدوياً أو عبر المساعد الصوتي الذكي بالعامية المصرية (مثل: "150 جنيه بنزين كاش") مع مهلة استماع مريحة. يمكنك أيضاً تسجيل الوارد، التحويل بين الحسابات، أو سداد كروت الائتمان.',
        },
        {
          step: '3',
          icon: 'card-bulleted-outline',
          color: '#065F46',
          bg: '#ECFDF5',
          title: 'فهم بطاقة الرصيد الرئيسية والتنبيهات البصرية',
          desc: 'المستطيل العلوي يعرض «صافي الرصيد المتواجد» مقسوماً على 1000 بعلامة K (يومض 20 مرة إذا قل عن 15K)، وأسفله «ديون الكروت» بالأحمر (تومض 20 مرة إذا تجاوزت 3500)، وبجانبهما «نسبة الاستهلاك» (تومض 20 مرة إذا تجاوزت 75%).',
        },
        {
          step: '4',
          icon: 'calendar-sync',
          color: '#1D4ED8',
          bg: '#EEF2FF',
          title: 'إغلاق الشهر وفتح شهر جديد بمرونة',
          desc: 'إغلاق الشهر غير مرتبط بيوم 1 ميلادي — يمكنك الإغلاق بعد 25 أو 30 أو 37 يوماً حسب موعد راتبك من زر «ترحيل وفتح شهر جديد». يتم حفظ معاملات الشهر السابق في الأرشيف، وترحيل المتبقي، والاحتفاظ بتاريخ الاستحقاق الفعلي (25 من الشهر) لكل كارت ائتمان.',
        },
        {
          step: '5',
          icon: 'certificate-outline',
          color: '#D97706',
          bg: '#FFFBEB',
          title: 'الشهادات والودائع البنكية',
          desc: 'من «الإعدادات ← الشهادات والودائع» أضف شهاداتك بقيمتها ونسبة فائدتها (ثابتة أو متغيرة) ودورية العائد (يومي أو كل 1 / 3 / 6 / 12 شهراً)، ليُضاف العائد تلقائياً للوارد في موعده مع إشعار فوري.',
        },
        {
          step: '6',
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          bg: '#F0FDFA',
          title: 'تنبيهات الفواتير المتكررة وأهداف الادخار',
          desc: 'من شريط الأزرار أعلى الصفحة الرئيسية:\n• «فواتير متكررة 📅»: سجّل التزاماتك الشهرية الثابتة (إنترنت، كهرباء، إيجار، أقساط) بقيمتها ويوم استحقاقها لتذكيرك بها وتسجيلها بضغطة زر واحدة.\n• «أهداف الادخار 🎯»: أنشئ هدفاً مالياً (سفر، شراء جهاز، طوارئ) وحدد المبلغ المستهدف، ثم أضف مدخراتك دورياً لمتابعة نسبة الإنجاز لحظياً.',
        },
        {
          step: '7',
          icon: 'shield-check-outline',
          color: '#7C3AED',
          bg: '#F5F3FF',
          title: 'الأمان والنسخ الاحتياطي والتصفير',
          desc: 'يمكنك تفعيل قفل البصمة والرقم السري، إخفاء الأرصدة بزر العين، حفظ نسخة احتياطية (.json) أو تصدير إكسيل (.xlsx)، وتفعيل/إيقاف التنبيه اليومي الساعة 11 مساءً، أو استخدام «مسح جميع البيانات» للبدء من الصفر لأي مستخدم جديد.',
        },
      ]
    : [
        {
          step: '1',
          icon: 'bank-outline',
          color: '#2563EB',
          bg: '#EFF6FF',
          title: 'Set Up Starting Balances & Bank Cards',
          desc: 'Open Settings → Edit Current Cycle Balances to enter your starting Cash & Bank balance. Use Add & Delete Primary Banks to create or remove Debit/Credit cards (Current, Savings, Meeza, Credit).',
        },
        {
          step: '2',
          icon: 'minus-circle-outline',
          color: '#DC2626',
          bg: '#FEF2F2',
          title: 'Log Expenses, Income, Transfers & Card Payments',
          desc: 'Tap the circular Add Expense button to log manually or with the Smart Voice Assistant. You can also record Income, internal Transfers, or Credit Card payments.',
        },
        {
          step: '3',
          icon: 'card-bulleted-outline',
          color: '#065F46',
          bg: '#ECFDF5',
          title: 'Understand the Main Balance Card Alerts',
          desc: 'The top beige box shows Gross Available in K (blinks 20 times if < 15K), Card Debts in red (blinks 20 times if > 3,500), and Monthly Consumption % (blinks 20 times if > 75%).',
        },
        {
          step: '4',
          icon: 'calendar-sync',
          color: '#1D4ED8',
          bg: '#EEF2FF',
          title: 'Flexible Salary-Cycle Rollover',
          desc: 'Closing/opening a month is NOT tied to calendar day 1 — roll over after 25, 30, or 37 days whenever your salary arrives. Past transactions are archived, remaining balances carry over, and each credit card keeps its true 25th due date.',
        },
        {
          step: '5',
          icon: 'certificate-outline',
          color: '#D97706',
          bg: '#FFFBEB',
          title: 'Bank Certificates & Deposits',
          desc: 'In Settings → Certificates & Deposits, add fixed or variable rate CDs/deposits with daily or 1/3/6/12-month yields. Interest is automatically credited to Income with a notification.',
        },
        {
          step: '6',
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          bg: '#F0FDFA',
          title: 'Recurring Bills Alerts & Savings Goals',
          desc: 'From the top action bar on the Home screen:\n• "Recurring 📅": Add fixed monthly bills (internet, utilities, rent, installments) with due day & amount for reminders and one-tap logging.\n• "Savings 🎯": Create a savings target (travel, purchase, emergency fund), deposit funds anytime, and track your completion progress.',
        },
        {
          step: '7',
          icon: 'shield-check-outline',
          color: '#7C3AED',
          bg: '#F5F3FF',
          title: 'Security, Backups & Fresh Reset',
          desc: 'Enable Fingerprint/PIN lock, hide balances with the eye icon, export to Excel (.xlsx) or JSON backup, toggle the daily 11:00 PM reminder, or use Clear All Data to reset to zero for a new user.',
        },
      ];

  const allFeatures = isArabic
    ? [
        {
          icon: 'microphone-outline',
          color: '#7C3AED',
          title: 'المساعد الصوتي الذكي بالعامية المصرية',
          desc: 'إدخال المصروفات بجملة واحدة أو خطوة بخطوة مع مهلة استماع ممتدة، بالإضافة إلى الاستعلام الصوتي الفوري عن مصروف اليوم وأمس.',
        },
        {
          icon: 'credit-card-multiple-outline',
          color: '#1D4ED8',
          title: 'إدارة كاملة للبنوك والكروت الأساسية',
          desc: 'دعم كروت الديبيت والكريديت مع تحديد نوع الحساب (جاري، توفير، ميزة، ائتمان)، عرض شريط بطاقات تفاعلي، وإمكانية إضافة وحذف أي كارت بما فيها الكروت الأساسية.',
        },
        {
          icon: 'certificate-outline',
          color: '#D97706',
          title: 'الشهادات والودائع البنكية بعائد تلقائي',
          desc: 'تسجيل الشهادات والودائع بقيمتها، تاريخ الانتهاء، نسبة الفائدة (ثابتة أو متغيرة)، ودورية الصرف (يومي أو كل 1/3/6/12 شهراً) مع إضافة العائد تلقائياً للوارد وإشعار فوري.',
        },
        {
          icon: 'calendar-sync',
          color: '#059669',
          title: 'دورة شهرية مرنة وأرشيف شهور كامل',
          desc: 'إغلاق وفتح الشهر في أي يوم حسب نزول الراتب (25–37 يوماً) مع ترحيل الأرصدة، حفظ السجلات في أرشيف الشهور، والاحتفاظ الدقيق بمواعيد استحقاق كروت الائتمان (25 من الشهر).',
        },
        {
          icon: 'bell-ring-outline',
          color: '#DC2626',
          title: 'نظام تنبيهات وإشعارات ذكي',
          desc: 'تذكير يومي الساعة 11 مساءً لتسجيل المصروفات، تنبيهات سداد الكروت أيام 20–25، تنبيهات ميزانيات البنود، ووميض تنبيهي 20 مرة للأرصدة الحرجة.',
        },
        {
          icon: 'file-excel-box',
          color: '#15803D',
          title: 'شيت إكسيل وتصدير ونسخ احتياطي',
          desc: 'إدخال سريع بنمط شيت إكسيل، تصدير كافة السجلات لملف إكسيل حقيقي (.xlsx)، وحفظ/مشاركة/استعادة نسخة احتياطية كاملة (.json).',
        },
        {
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          title: 'تنبيهات الفواتير المتكررة وأهداف الادخار',
          desc: 'إدارة الفواتير والالتزامات الشهرية الثابتة مع تنبيهات المواعيد والتسجيل بضغطة زر، بالإضافة إلى إنشاء أهداف ادخار مالية ومتابعة نسبة التقدم نحو كل هدف.',
        },
        {
          icon: 'chart-donut',
          color: '#0284C7',
          title: 'تحليلات ورؤى مالية لحظية',
          desc: 'معدل الصرف اليومي، كم يوماً يكفي الرصيد، وأعلى بنود الإنفاق برسوم بيانية واضحة.',
        },
        {
          icon: 'fingerprint',
          color: '#4338CA',
          title: 'أمان وخصوصية 100% بدون إنترنت',
          desc: 'قفل بالبصمة والرقم السري مع قفل تلقائي بعد دقيقة، زر إخفاء الأرصدة، إرفاق صور الفواتير بالكاميرا، خانة ملاحظات طوارئ «درج الشرابات»، وعمل كامل بدون إنترنت.',
        },
        {
          icon: 'palette-outline',
          color: '#B45309',
          title: 'تخصيص كامل للواجهة',
          desc: 'وضع ليلي ومريح للعين، 4 ثيمات ألوان، تبديل فوري بين العربية والإنجليزية، وشريط أزرار متحرك قابل للتثبيت من الإعدادات.',
        },
      ]
    : [
        {
          icon: 'microphone-outline',
          color: '#7C3AED',
          title: 'Smart Egyptian Arabic & English Voice Assistant',
          desc: 'One-shot or step-by-step voice expense entry with generous listening grace periods, plus instant voice queries for Today & Yesterday.',
        },
        {
          icon: 'credit-card-multiple-outline',
          color: '#1D4ED8',
          title: 'Full Primary Banks & Cards Management',
          desc: 'Create or delete Debit & Credit cards (Current, Savings, Meeza, Credit) including built-in cards, with an interactive bank cards carousel.',
        },
        {
          icon: 'certificate-outline',
          color: '#D97706',
          title: 'Bank Certificates & Deposits with Auto-Yield',
          desc: 'Track principal, maturity date, fixed/variable interest rate, and daily or 1/3/6/12-month payouts — automatically credited to Income with notifications.',
        },
        {
          icon: 'calendar-sync',
          color: '#059669',
          title: 'Flexible Salary Cycle & Months Archive',
          desc: 'Close and open months anytime based on salary date (25–37 days), archive past logs, and preserve exact 25th credit card due dates.',
        },
        {
          icon: 'bell-ring-outline',
          color: '#DC2626',
          title: 'Smart Reminders & Visual Blink Alerts',
          desc: 'Daily 11:00 PM logging reminder, 20th–25th card due reminders, category budget alerts, and 20x blink alerts for low balance / high debt / >75% spend.',
        },
        {
          icon: 'file-excel-box',
          color: '#15803D',
          title: 'Excel Sheet Entry, .xlsx Export & JSON Backup',
          desc: 'Batch spreadsheet-style entry, true Excel (.xlsx) export, and full offline backup & restore (.json).',
        },
        {
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          title: 'Recurring Bills Alerts & Savings Goals',
          desc: 'Manage fixed monthly obligations with due-day alerts and one-tap logging, plus create financial savings goals with live progress tracking.',
        },
        {
          icon: 'chart-donut',
          color: '#0284C7',
          title: 'Real-Time Financial Analytics',
          desc: 'Daily burn rate, days money lasts, and top spending breakdown charts.',
        },
        {
          icon: 'fingerprint',
          color: '#4338CA',
          title: '100% Offline Privacy & Biometric Security',
          desc: 'Fingerprint & PIN lock with 1-min auto-lock, hide-balances eye toggle, receipt camera capture, subtle "cookie jar" notes, and zero cloud dependency.',
        },
        {
          icon: 'palette-outline',
          color: '#B45309',
          title: 'Rich UI Customization',
          desc: 'Dark/Light mode, 4 color palettes, instant AR/EN toggle, and auto-scrolling action bar with lock toggle in Settings.',
        },
      ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, isDarkMode && { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { borderBottomColor: themeColors.border }]}>
            <View style={{ width: 34 }} />
            <Text style={[styles.title, isDarkMode && { color: themeColors.textPrimary }]}>
              {isArabic ? 'المساعدة ومميزات التطبيق ❓✨' : 'Help & App Features ❓✨'}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, isDarkMode && { backgroundColor: themeColors.surfaceSecondary }]}>
              <MaterialCommunityIcons name="close" size={22} color={isDarkMode ? themeColors.textPrimary : COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 2 Tabs: Quick Help vs All Features */}
          <View style={[styles.tabsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'help' && { backgroundColor: themeColors.primaryDark, borderColor: themeColors.primaryDark },
              ]}
              onPress={() => setActiveTab('help')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={16}
                color={activeTab === 'help' ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'help' && styles.tabTextActive]}>
                {isArabic ? 'دليل الاستخدام (Help)' : 'Quick Help Guide'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'features' && { backgroundColor: '#D97706', borderColor: '#B45309' },
              ]}
              onPress={() => setActiveTab('features')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="star-four-points-outline"
                size={16}
                color={activeTab === 'features' ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'features' && styles.tabTextActive]}>
                {isArabic ? 'كل مميزات التطبيق ✨' : 'All App Features ✨'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {activeTab === 'help' ? (
              <>
                <View style={[styles.introBanner, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                  <Text style={[styles.introText, isArabic && { textAlign: 'right' }, isDarkMode && { color: '#E2E8F0' }]}>
                    {isArabic
                      ? 'مرحباً بك في تطبيق مصروفي (U3Xpnss) 👋\nإليك 7 خطوات سريعة لتبدأ استخدام التطبيق بكل سهولة:'
                      : 'Welcome to Masrofy (U3Xpnss) 👋\nHere are 7 quick steps to get started smoothly:'}
                  </Text>
                </View>

                {helpSteps.map((item) => (
                  <View
                    key={item.step}
                    style={[
                      styles.stepCard,
                      isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border },
                    ]}
                  >
                    <View style={[styles.stepHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.stepBadge, { backgroundColor: item.bg }]}>
                        <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text
                        style={[
                          styles.stepTitle,
                          { color: isDarkMode ? themeColors.textPrimary : item.color },
                          isArabic && { textAlign: 'right' },
                        ]}
                      >
                        {item.step}. {item.title}
                      </Text>
                    </View>
                    <Text style={[styles.stepDesc, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textSecondary }]}>
                      {item.desc}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={[styles.introBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.introText, { color: '#92400E' }, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? '✨ جميع إمكانيات ومميزات تطبيق مصروفي (U3Xpnss) في مكان واحد:'
                      : '✨ Complete overview of all Masrofy (U3Xpnss) capabilities:'}
                  </Text>
                </View>

                {allFeatures.map((feat, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.featureCard,
                      isArabic && { flexDirection: 'row-reverse' },
                      isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border },
                    ]}
                  >
                    <View style={[styles.featureIconBox, { backgroundColor: feat.color + '18' }]}>
                      <MaterialCommunityIcons name={feat.icon} size={22} color={feat.color} />
                    </View>
                    <View style={[{ flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.featureTitle, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textPrimary }]}>
                        {feat.title}
                      </Text>
                      <Text style={[styles.featureDesc, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textSecondary }]}>
                        {feat.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: themeColors.primaryDark }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>{isArabic ? 'فهمت، إغلاق 👍' : 'Got it, Close 👍'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: 15.5, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { padding: 6, borderRadius: 12, backgroundColor: COLORS.surfaceSecondary },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  body: { padding: 16, paddingBottom: 30 },
  introBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  introText: { fontSize: 12.5, fontWeight: '700', color: '#065F46', lineHeight: 19 },
  stepCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 6,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { flex: 1, fontSize: 13.5, fontWeight: '800' },
  stepDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 19 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 9,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 13.5, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 3 },
  featureDesc: { fontSize: 11.5, color: COLORS.textSecondary, lineHeight: 18 },
  doneBtn: {
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
