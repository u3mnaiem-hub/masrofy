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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const HelpAndFeaturesModal = ({ visible, onClose, initialTab = 'help' }) => {
  const { isArabic, isDarkMode, themeColors } = useExpense();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(initialTab || 'help'); // 'help' | 'features'

  const helpSteps = isArabic
    ? [
        {
          step: '1',
          icon: 'bank-outline',
          color: '#2563EB',
          bg: '#EFF6FF',
          title: 'إعداد أرصدتك وحساباتك (بدون أي أرقام سرية)',
          desc: 'من شاشة «الإعدادات» اختر «تعديل أرصدة البداية» لتحديد رصيد الكاش والحساب البنكي الذي تبدأ به، ومن «إدارة البنوك والكروت» أضف أسماء حساباتك وكروتك (جاري، توفير، ميزة، ائتمان) لمتابعتها فقط — التطبيق لا يطلب أبداً رقم بطاقة أو رقم حساب أو أي بيانات سرية.',
        },
        {
          step: '2',
          icon: 'minus-circle-outline',
          color: '#DC2626',
          bg: '#FEF2F2',
          title: 'تسجيل المصروفات والوارد وسداد الكروت',
          desc: 'اضغط على الزر الدائري «تسجيل مصروف» لإضافة مصروفك يدوياً أو باستخدام المساعد الصوتي الذكي بالعامية المصرية (مثل: "150 جنيه بنزين كاش"). كما يمكنك تسجيل الدخل الوارد، التحويل بين حساباتك، أو سداد كروت الائتمان بسهولة.',
        },
        {
          step: '3',
          icon: 'card-bulleted-outline',
          color: '#065F46',
          bg: '#ECFDF5',
          title: 'متابعة بطاقة الرصيد والتنبيهات الذكية',
          desc: 'تعرض البطاقة الرئيسية «إجمالي الرصيد المتاح» بشكل واضح، وأسفله «مديونية الكروت» باللون الأحمر، وبجانبهما «نسبة الاستهلاك الشهري». عند انخفاض الرصيد أو ارتفاع المديونية أو الاستهلاك، تومض الأرقام تلقائياً لتنبيهك.',
        },
        {
          step: '4',
          icon: 'calendar-sync',
          color: '#1D4ED8',
          bg: '#EEF2FF',
          title: 'إغلاق الشهر حسب راتبك وأرشيف الشهور',
          desc: 'دورتك المالية مرنة وغير مرتبطة ببداية الشهر الميلادي — يمكنك إغلاق الشهر وبدء دورة جديدة في أي يوم يناسب موعد راتبك عبر «ترحيل وفتح شهر جديد». تُحفظ معاملات الشهر السابق في «أرشيف الشهور» مع إمكانية تعديل التواريخ أو المعاملات في أي وقت والاحتفاظ بمواعيد استحقاق كروت الائتمان بدقة.',
        },
        {
          step: '5',
          icon: 'certificate-outline',
          color: '#D97706',
          bg: '#FFFBEB',
          title: 'الشهادات والودائع البنكية',
          desc: 'من «الإعدادات ← الشهادات والودائع» أضف شهاداتك وودائعك بقيمتها ونسبة عائدها (ثابتة أو متغيرة) ودورية الصرف (يومي أو كل 1 / 3 / 6 / 12 شهراً)، ليُضاف العائد تلقائياً إلى دخلك في موعده مع إشعار فوري.',
        },
        {
          step: '6',
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          bg: '#F0FDFA',
          title: 'الفواتير المتكررة وأهداف الادخار',
          desc: 'من شريط الاختصارات أعلى الصفحة الرئيسية:\n• «فواتير متكررة 📅»: سجّل التزاماتك الشهرية الثابتة (إنترنت، كهرباء، إيجار، أقساط) بقيمتها ويوم استحقاقها لتذكيرك بها وتسجيلها بضغطة زر واحدة.\n• «أهداف الادخار 🎯»: أنشئ هدفاً مالياً (سفر، شراء جهاز، طوارئ) وحدد المبلغ المستهدف، ثم أضف مدخراتك دورياً لمتابعة نسبة الإنجاز لحظياً.',
        },
        {
          step: '7',
          icon: 'shield-check-outline',
          color: '#7C3AED',
          bg: '#F5F3FF',
          title: 'الأمان والخصوصية والنسخ الاحتياطي',
          desc: 'من «الإعدادات ← تأمين وقفل التطبيق» يمكنك تفعيل البصمة وتعيين رمز PIN أو كلمة سر خاصة بالتطبيق مستقلة عن قفل الهاتف مع قفل تلقائي لحماية بياناتك. كما يمكنك إخفاء الأرصدة بضغطة زر، استخدام خانة «درج الشرابات» لملاحظات الطوارئ، تفعيل التذكير اليومي الساعة 11 مساءً، حفظ نسخة احتياطية (.json)، التصدير لإكسيل (.xlsx)، أو مسح البيانات للبدء من جديد.',
        },
      ]
    : [
        {
          step: '1',
          icon: 'bank-outline',
          color: '#2563EB',
          bg: '#EFF6FF',
          title: 'Set Up Your Balances & Cards (No Sensitive Data)',
          desc: 'Go to Settings → Edit Starting Balances to enter your initial Cash & Bank amounts, and use Manage Banks & Cards to add labels for your accounts (Current, Savings, Meeza, Credit). The app NEVER asks for card numbers, account numbers, PINs, or confidential banking info.',
        },
        {
          step: '2',
          icon: 'minus-circle-outline',
          color: '#DC2626',
          bg: '#FEF2F2',
          title: 'Log Expenses, Income & Card Payments',
          desc: 'Tap the circular Add Expense button to log manually or with the Smart Voice Assistant. You can also record Income, Transfers between your accounts, or Credit Card payments.',
        },
        {
          step: '3',
          icon: 'card-bulleted-outline',
          color: '#065F46',
          bg: '#ECFDF5',
          title: 'Track Your Balance Card & Visual Alerts',
          desc: 'The main card displays your Gross Available balance, Card Debts in red, and Monthly Consumption %. Whenever your balance drops low or debt/spending rises high, the numbers flash to alert you.',
        },
        {
          step: '4',
          icon: 'calendar-sync',
          color: '#1D4ED8',
          bg: '#EEF2FF',
          title: 'Flexible Salary Cycle & Months Archive',
          desc: 'Your budget cycle is not tied to the 1st of the month — close and open a new cycle anytime your salary arrives via Rollover & New Month. Past cycles are saved in Months Archive where you can still edit dates or transactions anytime while keeping credit card due dates accurate.',
        },
        {
          step: '5',
          icon: 'certificate-outline',
          color: '#D97706',
          bg: '#FFFBEB',
          title: 'Bank Certificates & Deposits',
          desc: 'In Settings → Certificates & Deposits, add fixed or variable rate CDs/deposits with daily or 1/3/6/12-month payouts. Interest is automatically credited to your Income on schedule with an instant notification.',
        },
        {
          step: '6',
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          bg: '#F0FDFA',
          title: 'Recurring Bills & Savings Goals',
          desc: 'From the top shortcuts bar on the Home screen:\n• "Recurring 📅": Add fixed monthly bills (internet, utilities, rent, installments) with due day & amount for reminders and one-tap logging.\n• "Savings 🎯": Create a savings goal (travel, purchase, emergency fund), add deposits anytime, and track your completion progress live.',
        },
        {
          step: '7',
          icon: 'shield-check-outline',
          color: '#7C3AED',
          bg: '#F5F3FF',
          title: 'Security, Privacy & Backups',
          desc: 'Enable Fingerprint lock and set an independent app PIN or password separate from your phone lock, with auto-lock protection. Hide balances with the eye icon, keep emergency notes in "cookie jar", toggle the daily 11:00 PM reminder, export to Excel (.xlsx) or JSON backup, or reset data anytime.',
        },
      ];

  const allFeatures = isArabic
    ? [
        {
          icon: 'microphone-outline',
          color: '#7C3AED',
          title: 'المساعد الصوتي الذكي بالعامية المصرية',
          desc: 'سجّل مصروفاتك بصوتك بجملة واحدة أو خطوة بخطوة بكل أريحية، واسأل التطبيق صوتياً عن مصروفات اليوم أو الأمس لتحصل على الإجابة فوراً.',
        },
        {
          icon: 'credit-card-multiple-outline',
          color: '#1D4ED8',
          title: 'إدارة متكاملة للبنوك والكروت',
          desc: 'أضف وعدّل واحذف حساباتك البنكية وكروت الديبيت والكريديت (جاري، توفير، ميزة، ائتمان)، مع عرض تفاعلي أنيق لبطاقاتك وإمكانية إخفائها أو إظهارها بضغطة زر.',
        },
        {
          icon: 'certificate-outline',
          color: '#D97706',
          title: 'الشهادات والودائع البنكية بعائد تلقائي',
          desc: 'تابع شهاداتك وودائعك بقيمتها وتاريخ استحقاقها ونسبة الفائدة (ثابتة أو متغيرة) ودورية الصرف (يومي أو كل 1/3/6/12 شهراً) مع إضافة العائد تلقائياً للوارد وإشعار فوري.',
        },
        {
          icon: 'calendar-sync',
          color: '#059669',
          title: 'دورة شهرية مرنة وأرشيف شهور قابل للتعديل',
          desc: 'أغلق الشهر وافتح دورة جديدة في أي يوم حسب موعد راتبك مع ترحيل الأرصدة تلقائياً، وحافظ على مواعيد استحقاق كروت الائتمان بدقة، مع إمكانية تعديل تواريخ ومعاملات أي شهر مؤرشف وتصديره لإكسيل.',
        },
        {
          icon: 'bell-ring-outline',
          color: '#DC2626',
          title: 'نظام تنبيهات وإشعارات ذكي',
          desc: 'تذكير يومي الساعة 11 مساءً لتسجيل مصروفاتك، تنبيهات قبل مواعيد سداد كروت الائتمان، تنبيهات عند اقتراب تجاوز ميزانية أي بند، ووميض تنبيهي للأرصدة الحرجة.',
        },
        {
          icon: 'file-excel-box',
          color: '#15803D',
          title: 'إدخال سريع كإكسيل وتصدير ونسخ احتياطي',
          desc: 'أدخل عدة معاملات دفعة واحدة بنمط شيت إكسيل، وصدّر سجلاتك لملف إكسيل (.xlsx)، واحفظ أو استعد نسخة احتياطية كاملة (.json) في أي وقت.',
        },
        {
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          title: 'الفواتير المتكررة وأهداف الادخار',
          desc: 'نظّم فواتيرك والتزاماتك الشهرية الثابتة مع تنبيهات المواعيد والتسجيل بضغطة زر، وأنشئ أهداف ادخار لمتابعة تقدمك المالي نحو كل هدف.',
        },
        {
          icon: 'chart-donut',
          color: '#0284C7',
          title: 'تحليلات ورؤى مالية لحظية',
          desc: 'اعرف معدل صرفك اليومي، وكم يوماً يكفي رصيدك الحالي، وأكثر البنود استهلاكاً عبر رسوم بيانية واضحة وبسيطة.',
        },
        {
          icon: 'fingerprint',
          color: '#4338CA',
          title: 'أمان وخصوصية 100% بدون إنترنت',
          desc: 'قفل بالبصمة مع إمكانية تعيين رمز PIN أو كلمة سر خاصة بالتطبيق مستقلة عن قفل الهاتف، قفل تلقائي، إخفاء الأرصدة، تصوير وحفظ الفواتير، خانة «درج الشرابات» السرية، وحفظ كامل لبياناتك على جهازك بدون إنترنت.',
        },
        {
          icon: 'palette-outline',
          color: '#B45309',
          title: 'تخصيص مريح وأنيق للواجهة',
          desc: 'وضع نهاري أنيق ووضع ليلي داكن مريح للعين، 4 ثيمات ألوان جذابة، تبديل فوري بين العربية والإنجليزية، وشريط اختصارات متحرك يمكنك تثبيته من الإعدادات.',
        },
      ]
    : [
        {
          icon: 'microphone-outline',
          color: '#7C3AED',
          title: 'Smart Voice Assistant (Arabic & English)',
          desc: 'Log expenses naturally in one sentence or step-by-step, and ask for today’s or yesterday’s spending to hear instant answers.',
        },
        {
          icon: 'credit-card-multiple-outline',
          color: '#1D4ED8',
          title: 'Complete Banks & Cards Management',
          desc: 'Add, edit, or delete Debit & Credit cards (Current, Savings, Meeza, Credit) with an interactive card carousel and one-tap hide/show.',
        },
        {
          icon: 'certificate-outline',
          color: '#D97706',
          title: 'Bank Certificates & Deposits with Auto-Yield',
          desc: 'Track principal, maturity date, fixed/variable interest rates, and daily or 1/3/6/12-month payouts — automatically credited to Income with notifications.',
        },
        {
          icon: 'calendar-sync',
          color: '#059669',
          title: 'Flexible Salary Cycle & Editable Archive',
          desc: 'Start a new budget cycle on any day that matches your salary, keep credit card due dates accurate, and edit dates or transactions in archived months anytime.',
        },
        {
          icon: 'bell-ring-outline',
          color: '#DC2626',
          title: 'Smart Reminders & Visual Alerts',
          desc: 'Daily 11:00 PM logging reminder, credit card due date alerts, category budget warnings, and visual flashing alerts for low balance or high debt.',
        },
        {
          icon: 'file-excel-box',
          color: '#15803D',
          title: 'Spreadsheet Entry, Excel Export & Backup',
          desc: 'Enter multiple transactions quickly in a sheet view, export to Excel (.xlsx), and save or restore full offline backups (.json).',
        },
        {
          icon: 'calendar-refresh-outline',
          color: '#0D9488',
          title: 'Recurring Bills & Savings Goals',
          desc: 'Manage fixed monthly obligations with due-day alerts and one-tap logging, plus create savings goals with live progress tracking.',
        },
        {
          icon: 'chart-donut',
          color: '#0284C7',
          title: 'Real-Time Financial Analytics',
          desc: 'See your daily burn rate, how many days your balance will last, and your top spending categories with clear charts.',
        },
        {
          icon: 'fingerprint',
          color: '#4338CA',
          title: '100% Offline Privacy & Strong Security',
          desc: 'Fingerprint lock plus an independent app PIN or password separate from your phone lock, auto-lock, hide-balances toggle, receipt photo capture, "cookie jar" emergency notes, and full offline privacy.',
        },
        {
          icon: 'palette-outline',
          color: '#B45309',
          title: 'Rich & Comfortable UI Customization',
          desc: 'Elegant Light Mode and eye-friendly Dark Mode, 4 color themes, instant Arabic/English switch, and a smooth shortcuts bar you can lock in place from Settings.',
        },
      ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, isDarkMode && { backgroundColor: themeColors.surface }, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}>
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

                {/* Important Purpose & Privacy Guarantee Box */}
                <View
                  style={[
                    styles.disclaimerBox,
                    isDarkMode && { backgroundColor: '#0F2922', borderColor: '#10B981' },
                  ]}
                >
                  <Text style={[styles.disclaimerTitle, isArabic && { textAlign: 'right' }, isDarkMode && { color: '#6EE7B7' }]}>
                    {isArabic
                      ? '🛡️ توضيح هام عن التطبيق وأمان بياناتك:'
                      : '🛡️ Important Notice About This App & Your Security:'}
                  </Text>
                  <Text style={[styles.disclaimerText, isArabic && { textAlign: 'right' }, isDarkMode && { color: '#D1FAE5' }]}>
                    {isArabic
                      ? '• مصروفي هو أداة شخصية لمتابعة مصروفاتك الشهرية واستحقاقات بطاقات الائتمان أولاً بأول، لتحديد المتبقي من السيولة المالية المتاحة لشهرك المالي، ومعرفة أكثر ما تنفق عليه أموالك، وتحذيرك مبكراً لتفادي غرامات تأخير سداد بطاقات المشتريات.\n• التطبيق لا يتصل بالإنترنت ولا يقوم بالدفع أو التحويل نيابةً عنك — فهو ليس تطبيقاً بنكياً ولا مثل إنستاباي.\n• نؤكد مراراً أن التطبيق لا يطلب أبداً إدخال أرقام البطاقات، ولا أرقام الحسابات، ولا الأرقام السرية (PIN/CVV/OTP)، ولا أي بيانات بنكية لا يجوز الإفصاح عنها.'
                      : '• Masrofy is a personal tracker for your monthly expenses and credit card dues — helping you see your remaining available liquidity for your fiscal month, discover your top spending areas, and get timely reminders to avoid credit card late-payment penalties.\n• It works 100% offline and NEVER makes payments or transfers on your behalf — it is NOT a banking or payment app like InstaPay.\n• We strictly emphasize: this app NEVER asks for card numbers, bank account numbers, PINs/CVV/OTPs, or any confidential banking credentials.'}
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
  disclaimerBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9A3412',
    marginBottom: 5,
  },
  disclaimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C2D12',
    lineHeight: 19.5,
  },
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
