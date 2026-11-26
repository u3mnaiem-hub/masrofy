import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  AccessibilityInfo,
  AppState,
  Image,
} from 'react-native';

const MEEZA_CARD_IMAGE = require('../../assets/meeza-card.jpg');
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, NEON_GLOW } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import {
  BUDGET_BLINK_THRESHOLD_PERCENT,
  BUDGET_BLINK_DURATION_MS,
  shouldBlinkBudgetPercentage,
  isBudgetPercentageAboveThreshold,
} from '../utils/smartVoiceFlow';

export const BalanceCard = ({ onOpenAddExpense, onOpenAddIncome, onOpenExcelSheet, onOpenPayCc, viewTrigger = 0 }) => {
  const { balances, currency, formatAmount, isArabic, isDarkMode, isBalancesHidden, deletedAccountIds, themeColors } = useExpense();
  const [showPlasticCards, setShowPlasticCards] = useState(true);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [foregroundCycle, setForegroundCycle] = useState(0);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const grossBlinkAnim = useRef(new Animated.Value(1)).current;
  const debtBlinkAnim = useRef(new Animated.Value(1)).current;

  const isDeleted = (id) => (deletedAccountIds || []).includes(id);

  // Format YYYY-MM-25 -> "25/MM" dynamically (never hardcoded to 25/11 or 25/12)
  const formatShortDue = (isoDate, fallback) => {
    if (!isoDate || typeof isoDate !== 'string') return fallback;
    const parts = isoDate.split('-');
    if (parts.length !== 3) return fallback;
    return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
  };
  const thisDueLbl = formatShortDue(balances.currentMonthDueDate, '25/11');
  const nextDueLbl = formatShortDue(balances.nextMonthDueDate, '25/12');

  const formatCardDueSub = (dueThis, dueNext) => {
    if (dueThis > 0 && dueNext > 0) {
      return `${thisDueLbl}: ${formatAmount(dueThis)} • ${nextDueLbl}: ${formatAmount(dueNext)}`;
    }
    if (dueThis > 0) {
      return isArabic ? `مستحق ${thisDueLbl}: ${formatAmount(dueThis)}` : `Due ${thisDueLbl}: ${formatAmount(dueThis)}`;
    }
    if (dueNext > 0) {
      return isArabic ? `مستحق ${nextDueLbl}: ${formatAmount(dueNext)}` : `Due ${nextDueLbl}: ${formatAmount(dueNext)}`;
    }
    return isArabic ? `مستحق ${nextDueLbl}: ${formatAmount(0)}` : `Due ${nextDueLbl}: ${formatAmount(0)}`;
  };

  const LINKED_BADGE_MAP = {
    current: isArabic ? 'ديبيت • جاري' : 'DEBIT • CURRENT',
    savings: isArabic ? 'ديبيت • توفير' : 'DEBIT • SAVINGS',
    meeza: isArabic ? 'ميزة' : 'MEEZA',
    credit: isArabic ? 'كريديت • ائتمان' : 'CREDIT CARD',
  };

  const isMeezaBankCard = (card) =>
    card?.linkedAccountType === 'meeza' || /ميزة|ميزه|meeza/i.test(card?.bankName || '');

  const customDebitPlasticCards = (balances.customDebitCardsSummary || []).map((d) => ({
    id: d.id,
    title: d.bankName,
    typeBadge: LINKED_BADGE_MAP[d.linkedAccountType || 'current'] || 'DEBIT CARD',
    digits: isMeezaBankCard(d) ? '5078 •••• MEEZA' : '4000 •••• BANK',
    amount: d.avail,
    subText: isArabic ? `بداية الشهر: ${formatAmount(d.startBal)}` : `Start: ${formatAmount(d.startBal)}`,
    ratio: d.startBal > 0 ? Math.min(100, Math.max(0, Math.round(((d.startBal - d.avail) / d.startBal) * 100))) : 0,
    bg: '#1E40AF',
    accent: '#93C5FD',
    isCredit: false,
    isMeeza: isMeezaBankCard(d),
  }));

  const customCreditPlasticCards = (balances.customCreditCardsSummary || []).map((c) => ({
    id: c.id,
    title: c.bankName,
    typeBadge: LINKED_BADGE_MAP[c.linkedAccountType || 'credit'] || 'CREDIT CARD',
    digits: isMeezaBankCard(c) ? '5078 •••• MEEZA' : '5200 •••• CARD',
    amount: c.totalDebt,
    subText: formatCardDueSub(c.dueThisMonth, c.dueNextMonth),
    ratio: Math.min(100, Math.round(((c.totalDebt || 0) / 10000) * 100)),
    bg: '#4C1D95',
    accent: '#C4B5FD',
    isCredit: true,
    isMeeza: isMeezaBankCard(c),
  }));

  const bankCardsList = [
    {
      id: 'csh',
      title: isArabic ? 'كاش (Cash)' : 'Cash Wallet',
      typeBadge: isArabic ? 'محفظة جيب جلدية' : 'LEATHER WALLET',
      digits: isArabic ? 'نقدية بالمحفظة' : 'POCKET CASH',
      amount: balances.availCsh,
      subText: isArabic ? `بداية الشهر: ${formatAmount(balances.startCsh)}` : `Start: ${formatAmount(balances.startCsh)}`,
      ratio: balances.startCsh > 0 ? Math.min(100, Math.max(0, Math.round(((balances.startCsh - balances.availCsh) / balances.startCsh) * 100))) : 0,
      bg: '#6B3410',
      accent: '#FBBF24',
      isCredit: false,
      isWallet: true,
    },
    ...(!isDeleted('dc')
      ? [
          {
            id: 'dc',
            title: isArabic ? 'DC / حساب بنكي' : 'DC Bank Account',
            typeBadge: isArabic ? 'ديبيت • جاري' : 'DEBIT CARD',
            digits: '4532 •••• 8821',
            amount: balances.availDc,
            subText: isArabic ? `بداية الشهر: ${formatAmount(balances.startDc)}` : `Start: ${formatAmount(balances.startDc)}`,
            ratio: balances.startDc > 0 ? Math.min(100, Math.max(0, Math.round(((balances.startDc - balances.availDc) / balances.startDc) * 100))) : 0,
            bg: '#1E3A8A',
            accent: '#60A5FA',
            isCredit: false,
          },
        ]
      : []),
    ...(!isDeleted('cc_ar')
      ? [
          {
            id: 'cc_ar',
            title: isArabic ? 'البنك العربي (CC AR)' : 'Arab Bank (CC AR)',
            typeBadge: isArabic ? 'كريديت • ائتمان' : 'CREDIT CARD',
            digits: '5412 •••• 3910',
            amount: balances.ccArDebt,
            subText: formatCardDueSub(balances.ccArDueThisMonth, balances.ccArDueNextMonth),
            ratio: Math.min(100, Math.round(((balances.ccArDebt || 0) / 10000) * 100)),
            bg: '#7DD3FC',
            accent: '#0369A1',
            isLightCard: true,
            isCredit: true,
          },
        ]
      : []),
    ...(!isDeleted('cc_ca')
      ? [
          {
            id: 'cc_ca',
            title: isArabic ? 'كريدي أجريكول (CC CA)' : 'Crédit Agricole',
            typeBadge: isArabic ? 'كريديت • ائتمان' : 'CREDIT CARD',
            digits: '4916 •••• 7742',
            amount: balances.ccCaDebt,
            subText: formatCardDueSub(balances.ccCaDueThisMonth, balances.ccCaDueNextMonth),
            ratio: Math.min(100, Math.round(((balances.ccCaDebt || 0) / 10000) * 100)),
            bg: '#064E3B',
            accent: '#34D399',
            isCredit: true,
          },
        ]
      : []),
    ...customDebitPlasticCards,
    ...customCreditPlasticCards,
  ];

  // Monthly Consumption Percentage calculation (Outflow / Starting Base)
  const totalBase = balances.totalStartedWith > 0 ? balances.totalStartedWith : 1;
  const consumptionPercent = ((balances.totalOutflow / totalBase) * 100).toFixed(1);
  const numConsumption = parseFloat(consumptionPercent) || 0;
  const isHighConsumption = numConsumption > 50;
  const isCriticalConsumption = isBudgetPercentageAboveThreshold(numConsumption); // > BUDGET_BLINK_THRESHOLD_PERCENT (75)
  const canAnimateBlink = shouldBlinkBudgetPercentage(numConsumption, reduceMotionEnabled);

  // Respect system "remove animations" / reduce motion accessibility setting
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotionEnabled(Boolean(enabled));
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotionEnabled(Boolean(enabled));
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  // Re-trigger the 5-second blink when returning to the app / main screen
  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setForegroundCycle((c) => c + 1);
      }
    });
    return () => appStateSub?.remove?.();
  }, []);

  // Smooth blink 20 times when > 75%, then settle to static highlighted state
  useEffect(() => {
    blinkAnim.stopAnimation();
    blinkAnim.setValue(1);

    if (!canAnimateBlink) {
      return;
    }

    const pulseCycle = Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 0.25,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(pulseCycle, { iterations: 20 });
    loop.start(() => {
      blinkAnim.setValue(1);
    });

    return () => {
      loop.stop();
      blinkAnim.setValue(1);
    };
  }, [canAnimateBlink, foregroundCycle, viewTrigger, blinkAnim]);

  // Gross liquid available before credit card debt deductions
  const grossAvailableBeforeCards =
    (balances.availCsh || 0) +
    (balances.availDc || 0) +
    ((balances.customDebitCardsSummary || []).reduce((sum, d) => sum + (d.avail || 0), 0));

  const totalCcDebtValue = balances.totalCcDebt || 0;

  // Format Gross Available divided by 1000, floored to 1 decimal place + "K" (e.g. 15,234 -> 15.2K)
  const formatGrossInK = (val) => {
    if (isBalancesHidden) return '••••';
    const num = Number(val) || 0;
    const flooredK = Math.floor((num / 1000) * 10) / 10;
    return `${flooredK.toFixed(1)}K`;
  };

  // Blink Gross Available 20 times on startup/foreground if < 15,000 (even 14.99k), then stay solid
  const isGrossLow = grossAvailableBeforeCards < 15000;
  useEffect(() => {
    grossBlinkAnim.stopAnimation();
    grossBlinkAnim.setValue(1);
    if (!isGrossLow || reduceMotionEnabled) return;

    const singleBlink = Animated.sequence([
      Animated.timing(grossBlinkAnim, { toValue: 0.15, duration: 280, useNativeDriver: true }),
      Animated.timing(grossBlinkAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]);
    const loop = Animated.loop(singleBlink, { iterations: 20 });
    loop.start(() => {
      grossBlinkAnim.setValue(1);
    });
    return () => {
      loop.stop();
      grossBlinkAnim.setValue(1);
    };
  }, [isGrossLow, reduceMotionEnabled, foregroundCycle, grossBlinkAnim]);

  // Blink Card Debts 20 times on startup/foreground if > 3,500, then stay solid
  const isDebtHigh = totalCcDebtValue > 3500;
  useEffect(() => {
    debtBlinkAnim.stopAnimation();
    debtBlinkAnim.setValue(1);
    if (!isDebtHigh || reduceMotionEnabled) return;

    const singleBlink = Animated.sequence([
      Animated.timing(debtBlinkAnim, { toValue: 0.15, duration: 300, useNativeDriver: true }),
      Animated.timing(debtBlinkAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]);
    const loop = Animated.loop(singleBlink, { iterations: 20 });
    loop.start(() => {
      debtBlinkAnim.setValue(1);
    });
    return () => {
      loop.stop();
      debtBlinkAnim.setValue(1);
    };
  }, [isDebtHigh, reduceMotionEnabled, foregroundCycle, debtBlinkAnim]);

  return (
    <View style={[styles.card, SHADOWS.medium, { borderColor: isDarkMode ? themeColors.border : themeColors.primaryLight, borderWidth: isDarkMode ? 1 : 1.5 }, isDarkMode && { backgroundColor: themeColors.surface }]}>
      {/* 1. TOP SPOTLIGHT: صافي الرصيد المتواجد + ديون الكروت + النسبة المئوية */}
      <View
        style={[
          styles.netContainer,
          isDarkMode && {
            backgroundColor: '#10241C',
            borderColor: 'rgba(60, 232, 142, 0.45)',
            borderWidth: 1.2,
            ...NEON_GLOW.subtle,
          },
          isArabic ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' },
        ]}
      >
        {/* Right column in Arabic: صافي الرصيد المتواجد + ديون الكروت */}
        <View style={[styles.netBalancesCol, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {/* Top Balance: صافي الرصيد المتواجد */}
          <View style={[styles.balanceBlock, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.netLabel, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1}>
              {isArabic ? 'صافي الرصيد المتواجد' : 'Gross Available'}
            </Text>
            <Animated.View style={[styles.balanceValRow, { opacity: grossBlinkAnim }, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text
                style={[styles.balanceValNumber, isDarkMode && { color: themeColors.primary }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {formatGrossInK(grossAvailableBeforeCards)}
              </Text>
              <Text style={[styles.balanceValCurrency, isDarkMode && { color: themeColors.primary }]}> {currency.symbol}</Text>
            </Animated.View>
          </View>

          <View style={[styles.netDividerH, isDarkMode && { backgroundColor: themeColors.border }]} />

          {/* Bottom Balance: ديون الكروت (بالأحمر دائماً بدون تقريب أو قسمة على الألف) */}
          <View style={[styles.balanceBlock, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={[styles.netDebtLabel, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1}>
              {isArabic ? 'ديون الكروت' : 'Card Debts'}
            </Text>
            <Animated.View style={[styles.balanceValRow, { opacity: debtBlinkAnim }, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text
                style={[styles.balanceDebtValNumber, isDarkMode && { color: themeColors.expense }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {formatAmount(totalCcDebtValue)}
              </Text>
              <Text style={[styles.balanceDebtCurrency, isDarkMode && { color: themeColors.expense }]}> {currency.symbol}</Text>
            </Animated.View>
          </View>
        </View>

        {/* Left side: النسبة المئوية للاستهلاك الشهري (Monthly Consumption %) - smooth blink when > 75% */}
        <Animated.View
          style={[
            styles.consumptionBox,
            isDarkMode
              ? {
                  backgroundColor: isHighConsumption ? themeColors.expenseLight : themeColors.primaryLight,
                  borderColor: isHighConsumption ? themeColors.expense : themeColors.primary,
                  borderWidth: isCriticalConsumption ? 1.8 : 1.2,
                }
              : {
                  backgroundColor: isCriticalConsumption ? '#B91C1C' : isHighConsumption ? '#DC2626' : themeColors.primaryDark,
                  borderColor: isCriticalConsumption ? '#FCA5A5' : isHighConsumption ? '#B91C1C' : themeColors.primary,
                  borderWidth: isCriticalConsumption ? 2 : 1,
                },
            isCriticalConsumption && { opacity: blinkAnim },
          ]}
        >
          <MaterialCommunityIcons
            name="chart-pie"
            size={17}
            color={isDarkMode ? (isHighConsumption ? themeColors.expense : themeColors.primary) : '#FFFFFF'}
          />
          <Text
            style={[
              styles.consumptionPercentText,
              { color: isDarkMode ? (isHighConsumption ? themeColors.expense : themeColors.primary) : '#FFFFFF' },
            ]}
          >
            {consumptionPercent}%
          </Text>
          <Text
            style={[
              styles.consumptionLabelText,
              { color: isDarkMode ? themeColors.textSecondary : '#FFFFFF' },
            ]}
            numberOfLines={2}
          >
            {isArabic ? 'نسبة الاستهلاك\nالشهري' : 'Monthly\nConsumption'}
          </Text>
        </Animated.View>
      </View>

      {/* 2. SECTION 2: المبلغ المنصرف (بالأحمر) وجنبه إجمالي البداية (بلون الثيم بنفس الحجم والفونت) */}
      <View style={[styles.spentHeaderContainer, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* المبلغ المنصرف */}
        <View style={[styles.topFigureBlock, isArabic && { alignItems: 'flex-end' }]}>
          <View style={[styles.figureLabelRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons name="arrow-up-circle" size={14} color={isDarkMode ? themeColors.expense : '#C81E1E'} />
            <Text style={[styles.figureLabel, { color: isDarkMode ? themeColors.expense : '#C81E1E' }]}>
              {isArabic ? 'المبلغ المنصرف' : 'Total Spent'}
            </Text>
          </View>
          <View style={[styles.figureNumberRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.figureMainNumber, { color: isDarkMode ? themeColors.expense : '#C81E1E' }]}>
              {formatAmount(balances.totalOutflow)}
            </Text>
            <Text style={[styles.figureCurrency, { color: isDarkMode ? themeColors.expense : '#DC2626' }]}> {currency.symbol}</Text>
          </View>
        </View>

        {/* فاصل وسطي خفيف */}
        <View style={[styles.topVDivider, isDarkMode && { backgroundColor: themeColors.border }]} />

        {/* إجمالي البداية */}
        <View style={[styles.topFigureBlock, isArabic && { alignItems: 'flex-start' }]}>
          <View style={[styles.figureLabelRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons name="wallet-outline" size={14} color={isDarkMode ? themeColors.info : themeColors.primaryDark} />
            <Text style={[styles.figureLabel, { color: isDarkMode ? themeColors.info : themeColors.primaryDark }]}>
              {isArabic ? 'إجمالي البداية' : 'Starting Base'}
            </Text>
          </View>
          <View style={[styles.figureNumberRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.figureMainNumber, { color: isDarkMode ? themeColors.info : themeColors.primaryDark }]}>
              {formatAmount(balances.totalStartedWith)}
            </Text>
            <Text style={[styles.figureCurrency, { color: isDarkMode ? themeColors.info : themeColors.primary }]}> {currency.symbol}</Text>
          </View>
        </View>
      </View>

      {/* Cycle Days Bar */}
      <View style={[styles.cycleSubBar, isArabic && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.directSpentText}>
          {isArabic
            ? `استهلاك مباشر: ${formatAmount(balances.realTotalSpent)} ${currency.symbol}`
            : `Direct Spent: ${formatAmount(balances.realTotalSpent)} ${currency.symbol}`}
        </Text>
        <View style={[styles.cycleBadge, { backgroundColor: themeColors.primaryLight }, isArabic && { flexDirection: 'row-reverse' }]}>
          <MaterialCommunityIcons name="calendar-clock" size={13} color={isDarkMode ? themeColors.primary : themeColors.primaryDark} />
          <Text style={[styles.cycleBadgeText, { color: isDarkMode ? themeColors.primary : themeColors.primaryDark }]}>
            {isArabic
              ? `مر ${balances.daysElapsed} يوم • باقي ${balances.daysLeft}`
              : `${balances.daysElapsed}d passed • ${balances.daysLeft}d left`}
          </Text>
        </View>
      </View>

      {/* 3. Swipeable Real Bank Cards Carousel + 4 Rectangular Blocks */}
      <View style={[styles.carouselToggleRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <Text
          style={[styles.carouselSectionTitle, isArabic && { textAlign: 'right' }, isDarkMode && { color: themeColors.textSecondary }]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {isArabic ? 'البطاقات والأرصدة البنكية 💳' : 'Bank Cards & Wallets 💳'}
        </Text>
        <TouchableOpacity
          style={[styles.carouselToggleBtn, isArabic && { flexDirection: 'row-reverse' }, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}
          onPress={() => setShowPlasticCards((v) => !v)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name={showPlasticCards ? 'view-grid-outline' : 'cards-outline'} size={12} color={themeColors.primary} />
          <Text style={[styles.carouselToggleText, { color: themeColors.primary }]} numberOfLines={1}>
            {showPlasticCards ? (isArabic ? 'إخفاء الكروت' : 'Hide Cards') : (isArabic ? 'عرض الكروت 💳' : 'Show Cards 💳')}
          </Text>
        </TouchableOpacity>
      </View>

      {showPlasticCards && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 10, paddingHorizontal: 2 }}
        >
          {bankCardsList.map((bc) => {
            if (bc.isMeeza) {
              // Real Egyptian Meeza Pyramids Card artwork — absolute-filled Image for exact edge-to-edge fit on Android
              return (
                <TouchableOpacity
                  key={bc.id}
                  activeOpacity={bc.isCredit ? 0.85 : 0.95}
                  onPress={() => bc.isCredit && onOpenPayCc && onOpenPayCc(bc.id)}
                  style={{
                    width: 222,
                    minHeight: 142,
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: isDarkMode ? 'rgba(79, 209, 217, 0.45)' : '#1E3A8A',
                    position: 'relative',
                    backgroundColor: '#4C1D95',
                  }}
                >
                  <Image
                    source={MEEZA_CARD_IMAGE}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="stretch"
                  />
                  {/* Light bright veil so Dark Blue text pops crisply over the full stretched Meeza card */}
                  <View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: 'rgba(255, 255, 255, 0.30)',
                    }}
                  />
                  <View style={{ padding: 12, flex: 1, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="integrated-circuit-chip" size={20} color="#B45309" />
                        <MaterialCommunityIcons name="contactless-payment" size={16} color="#0B2545" />
                      </View>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: '#1E3A8A', fontSize: 9.5, fontWeight: '900' }}>
                          {isArabic ? 'ميزة • Meeza' : 'MEEZA'}
                        </Text>
                      </View>
                    </View>

                    <View>
                      <Text
                        style={{
                          color: '#0B2545',
                          fontSize: 13,
                          fontWeight: '900',
                          marginTop: 6,
                          textAlign: isArabic ? 'right' : 'left',
                          textShadowColor: 'rgba(255,255,255,0.9)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                        numberOfLines={1}
                      >
                        {bc.title}
                      </Text>
                      <Text
                        style={{
                          color: '#1E3A8A',
                          fontSize: 10,
                          fontWeight: '800',
                          letterSpacing: 1,
                          marginTop: 1,
                          textAlign: isArabic ? 'right' : 'left',
                          textShadowColor: 'rgba(255,255,255,0.85)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {bc.digits}
                      </Text>
                    </View>

                    <View>
                      <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                        <Text
                          style={{
                            color: '#0B2545',
                            fontSize: 17.5,
                            fontWeight: '900',
                            textShadowColor: 'rgba(255,255,255,0.95)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
                          }}
                        >
                          {formatAmount(bc.amount)} <Text style={{ fontSize: 11, color: '#1E3A8A', fontWeight: '900' }}>{currency.symbol}</Text>
                        </Text>
                        {bc.isCredit && (
                          <Text style={{ color: '#1E3A8A', fontSize: 10, fontWeight: '900' }}>
                            {isArabic ? 'سداد 💳' : 'Pay 💳'}
                          </Text>
                        )}
                      </View>

                      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 3, marginTop: 5, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.max(5, bc.ratio)}%`, height: '100%', backgroundColor: '#1E3A8A' }} />
                      </View>
                      <Text
                        style={{
                          color: '#0B2545',
                          fontSize: 9.5,
                          fontWeight: '800',
                          marginTop: 4,
                          textAlign: isArabic ? 'right' : 'left',
                          textShadowColor: 'rgba(255,255,255,0.9)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                        numberOfLines={1}
                      >
                        {bc.subText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            if (isDarkMode) {
              // Sary-inspired obsidian glass cards: Emerald for Cash, Cyan-Teal for Debit Bank, Coral-Red for Credit Cards
              const darkAccent = bc.isCredit ? themeColors.expense : bc.isWallet ? themeColors.primary : themeColors.info;
              const darkBg = bc.isCredit ? '#1F1413' : bc.isWallet ? '#10221B' : '#0F1F22';
              const darkBorder = bc.isCredit
                ? 'rgba(242, 113, 88, 0.34)'
                : bc.isWallet
                ? 'rgba(60, 232, 142, 0.34)'
                : 'rgba(79, 209, 217, 0.34)';
              return (
                <TouchableOpacity
                  key={bc.id}
                  activeOpacity={bc.isCredit ? 0.82 : 1}
                  onPress={() => bc.isCredit && onOpenPayCc && onOpenPayCc(bc.id)}
                  style={{
                    width: 215,
                    backgroundColor: darkBg,
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: darkBorder,
                  }}
                >
                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name={bc.isWallet ? 'wallet-bifold' : 'integrated-circuit-chip'} size={19} color={darkAccent} />
                      <MaterialCommunityIcons name={bc.isWallet ? 'cash-multiple' : 'contactless-payment'} size={15} color="#647A76" />
                    </View>
                    <View style={{ backgroundColor: '#131D1B', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: darkBorder }}>
                      <Text style={{ color: darkAccent, fontSize: 9, fontWeight: '800' }}>{bc.typeBadge}</Text>
                    </View>
                  </View>

                  <Text style={{ color: '#F3F7F6', fontSize: 12.5, fontWeight: '800', marginTop: 8, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                    {bc.title}
                  </Text>
                  <Text style={{ color: '#647A76', fontSize: 10, letterSpacing: 1, marginTop: 1, textAlign: isArabic ? 'right' : 'left' }}>
                    {bc.digits}
                  </Text>

                  <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                    <Text style={{ color: darkAccent, fontSize: 17, fontWeight: '900' }}>
                      {formatAmount(bc.amount)} <Text style={{ fontSize: 11, color: '#9BB0AC' }}>{currency.symbol}</Text>
                    </Text>
                    {bc.isCredit && (
                      <Text style={{ color: themeColors.primary, fontSize: 10, fontWeight: '800' }}>
                        {isArabic ? 'سداد 💳' : 'Pay 💳'}
                      </Text>
                    )}
                  </View>

                  <View style={{ height: 4, backgroundColor: '#1B2A27', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(5, bc.ratio)}%`, height: '100%', backgroundColor: darkAccent }} />
                  </View>
                  <Text style={{ color: '#9BB0AC', fontSize: 9.5, marginTop: 4, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                    {bc.subText}
                  </Text>
                </TouchableOpacity>
              );
            }

            if (bc.isWallet) {
              // Leather Pocket Wallet Design for Cash
              return (
                <View
                  key={bc.id}
                  style={{
                    width: 220,
                    backgroundColor: '#5C2D0C',
                    borderRadius: 22,
                    padding: 4,
                    borderWidth: 2,
                    borderColor: '#3E1D06',
                    position: 'relative',
                  }}
                >
                  {/* Peeking Green Banknotes at top of wallet pocket */}
                  <View
                    style={{
                      height: 6,
                      marginHorizontal: 14,
                      backgroundColor: '#15803D',
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      borderWidth: 1,
                      borderColor: '#86EFAC',
                      marginBottom: -2,
                    }}
                  />
                  {/* Inner Stitched Leather Body */}
                  <View
                    style={{
                      backgroundColor: '#7C3A12',
                      borderRadius: 17,
                      padding: 11,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: '#F59E0B',
                    }}
                  >
                    {/* Leather Wallet Clasp / Snap Button on Left/Right edge */}
                    <View
                      style={{
                        position: 'absolute',
                        top: '42%',
                        [isArabic ? 'left' : 'right']: -4,
                        width: 28,
                        height: 24,
                        backgroundColor: '#451A03',
                        borderTopLeftRadius: isArabic ? 4 : 12,
                        borderBottomLeftRadius: isArabic ? 4 : 12,
                        borderTopRightRadius: isArabic ? 12 : 4,
                        borderBottomRightRadius: isArabic ? 12 : 4,
                        borderWidth: 1.5,
                        borderColor: '#D97706',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#FBBF24',
                          borderWidth: 1.5,
                          borderColor: '#78350F',
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MaterialCommunityIcons name="wallet-bifold" size={20} color="#FDE68A" />
                        <MaterialCommunityIcons name="cash-multiple" size={16} color="#86EFAC" />
                      </View>
                      <View style={{ backgroundColor: '#451A03', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#D97706' }}>
                        <Text style={{ color: '#FDE68A', fontSize: 9, fontWeight: '800' }}>{bc.typeBadge}</Text>
                      </View>
                    </View>

                    <Text style={{ color: '#FEF3C7', fontSize: 13, fontWeight: '900', marginTop: 7, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                      {bc.title}
                    </Text>
                    <Text style={{ color: '#FCD34D', fontSize: 9.5, fontWeight: '700', marginTop: 1, textAlign: isArabic ? 'right' : 'left' }}>
                      {bc.digits}
                    </Text>

                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900' }}>
                        {formatAmount(bc.amount)} <Text style={{ fontSize: 11, color: '#FDE68A' }}>{currency.symbol}</Text>
                      </Text>
                    </View>

                    <View style={{ height: 4, backgroundColor: '#451A03', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.max(5, bc.ratio)}%`, height: '100%', backgroundColor: '#FBBF24' }} />
                    </View>
                    <Text style={{ color: '#FDE68A', fontSize: 9.5, marginTop: 4, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                      {bc.subText}
                    </Text>
                  </View>
                </View>
              );
            }

            const titleColor = bc.isLightCard ? '#082F49' : '#F8FAFC';
            const digitsColor = bc.isLightCard ? '#0369A1' : '#94A3B8';
            const amountColor = bc.isLightCard ? '#0C4A6E' : '#FFFFFF';
            const subColor = bc.isLightCard ? '#075985' : '#CBD5E1';
            const barBg = bc.isLightCard ? '#BAE6FD' : '#334155';

            return (
              <TouchableOpacity
                key={bc.id}
                activeOpacity={0.85}
                onPress={() => bc.isCredit && onOpenPayCc && onOpenPayCc(bc.id)}
                style={{
                  width: 215,
                  backgroundColor: bc.bg,
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1.5,
                  borderColor: bc.isLightCard ? '#0284C7' : bc.accent + '55',
                }}
              >
                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="integrated-circuit-chip" size={20} color={bc.isLightCard ? '#D97706' : '#FBBF24'} />
                    <MaterialCommunityIcons name="contactless-payment" size={16} color={bc.isLightCard ? '#0C4A6E' : '#E2E8F0'} />
                  </View>
                  <View style={{ backgroundColor: bc.isLightCard ? '#E0F2FE' : bc.accent + '33', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: bc.accent, fontSize: 9, fontWeight: '800' }}>{bc.typeBadge}</Text>
                  </View>
                </View>

                <Text style={{ color: titleColor, fontSize: 12.5, fontWeight: '800', marginTop: 8, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                  {bc.title}
                </Text>
                <Text style={{ color: digitsColor, fontSize: 10, letterSpacing: 1, marginTop: 1, textAlign: isArabic ? 'right' : 'left' }}>
                  {bc.digits}
                </Text>

                <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                  <Text style={{ color: amountColor, fontSize: 17, fontWeight: '900' }}>
                    {formatAmount(bc.amount)} <Text style={{ fontSize: 11, color: bc.accent }}>{currency.symbol}</Text>
                  </Text>
                  {bc.isCredit && (
                    <Text style={{ color: bc.accent, fontSize: 10, fontWeight: '800' }}>
                      {isArabic ? 'سداد 💳' : 'Pay 💳'}
                    </Text>
                  )}
                </View>

                <View style={{ height: 4, backgroundColor: barBg, borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(5, bc.ratio)}%`, height: '100%', backgroundColor: bc.accent }} />
                </View>
                <Text style={{ color: subColor, fontSize: 9.5, marginTop: 4, textAlign: isArabic ? 'right' : 'left' }} numberOfLines={1}>
                  {bc.subText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.accountsGridContainer}>
        {/* Row 1: كاش و DC بنك جنباً إلى جنب */}
        <View style={[styles.blocksPairRow, isArabic && { flexDirection: 'row-reverse' }]}>
          {/* Block 1: كاش (Cash) */}
          <View style={[styles.accountCard, styles.beigeCard, isDarkMode && styles.darkBeigeCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
            <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text
                style={[styles.accountName, styles.beigeText, isDarkMode && styles.darkBeigeText, isArabic && { textAlign: 'right' }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.75}
              >
                {isArabic ? 'كاش (Cash)' : 'Cash'}
              </Text>
              <MaterialCommunityIcons name="cash" size={15} color={isDarkMode ? '#D9B872' : '#B45309'} />
            </View>
            <Text style={[styles.accountAmount, styles.beigeText, isDarkMode && styles.darkBeigeText]} numberOfLines={1}>
              {formatAmount(balances.availCsh)} {currency.symbol}
            </Text>
            <Text
              style={[styles.accountSub, styles.beigeSubText, isDarkMode && styles.darkBeigeSubText]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.75}
            >
              {isArabic ? `بدأنا بـ ${formatAmount(balances.startCsh)}` : `Start ${formatAmount(balances.startCsh)}`}
            </Text>
          </View>

          {/* Block 2: DC / حساب بنكي */}
          {!isDeleted('dc') && (
            <View style={[styles.accountCard, styles.beigeCard, isDarkMode && styles.darkBeigeCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
              <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
                <Text
                  style={[styles.accountName, styles.beigeText, isDarkMode && styles.darkBeigeText, isArabic && { textAlign: 'right' }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  {isArabic ? 'DC / حساب بنكي' : 'DC / Bank'}
                </Text>
                <MaterialCommunityIcons name="credit-card" size={15} color={isDarkMode ? '#D9B872' : '#B45309'} />
              </View>
              <Text style={[styles.accountAmount, styles.beigeText, isDarkMode && styles.darkBeigeText]} numberOfLines={1}>
                {formatAmount(balances.availDc)} {currency.symbol}
              </Text>
              <Text
                style={[styles.accountSub, styles.beigeSubText, isDarkMode && styles.darkBeigeSubText]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.75}
              >
                {isArabic ? `بدأنا بـ ${formatAmount(balances.startDc)}` : `Start ${formatAmount(balances.startDc)}`}
              </Text>
            </View>
          )}
        </View>

        {/* Row 2: أجريكول والعربي جنباً إلى جنب تحتهما مباشرة */}
        {(!isDeleted('cc_ca') || !isDeleted('cc_ar')) && (
          <View style={[styles.blocksPairRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {/* Block 3: كريدي أجريكول (CC CA) */}
            {!isDeleted('cc_ca') && (
              <TouchableOpacity
                style={[styles.accountCard, styles.greenCaCard, isDarkMode && styles.darkGreenCaCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}
                onPress={() => onOpenPayCc && onOpenPayCc('cc_ca')}
                activeOpacity={0.75}
              >
                <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text
                    style={[styles.accountName, styles.greenCaText, isDarkMode && styles.darkGreenCaText, isArabic && { textAlign: 'right' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                  >
                    {isArabic ? 'أجريكول (CC CA)' : 'Crédit Agricole'}
                  </Text>
                  <View style={[styles.payBadgeRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.payBadgeGreen, isDarkMode && { backgroundColor: '#2E4C3E' }]}>
                      <Text style={[styles.payBadgeGreenText, isDarkMode && { color: '#9EE0BE' }]}>{isArabic ? 'سداد 💳' : 'Pay'}</Text>
                    </View>
                    <MaterialCommunityIcons name="credit-card-outline" size={14} color={isDarkMode ? '#8ED6B3' : '#065F46'} />
                  </View>
                </View>
                <Text style={[styles.accountAmount, styles.greenCaText, isDarkMode && styles.darkGreenCaText]} numberOfLines={1}>
                  {formatAmount(balances.ccCaDebt)} {currency.symbol}
                </Text>
                <Text
                  style={[styles.accountSub, styles.greenCaSubText, isDarkMode && styles.darkGreenCaSubText]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  {formatCardDueSub(balances.ccCaDueThisMonth, balances.ccCaDueNextMonth)}
                </Text>
              </TouchableOpacity>
            )}

            {/* Block 4: البنك العربي (CC AR) */}
            {!isDeleted('cc_ar') && (
              <TouchableOpacity
                style={[styles.accountCard, styles.blueArCard, isDarkMode && styles.darkBlueArCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}
                onPress={() => onOpenPayCc && onOpenPayCc('cc_ar')}
                activeOpacity={0.75}
              >
                <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text
                    style={[styles.accountName, styles.blueArText, isDarkMode && styles.darkBlueArText, isArabic && { textAlign: 'right' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                  >
                    {isArabic ? 'العربي (CC AR)' : 'Arab Bank (CC)'}
                  </Text>
                  <View style={[styles.payBadgeRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.payBadgeBlue, isDarkMode && { backgroundColor: '#314460' }]}>
                      <Text style={[styles.payBadgeBlueText, isDarkMode && { color: '#A5C8F5' }]}>{isArabic ? 'سداد 💳' : 'Pay'}</Text>
                    </View>
                    <MaterialCommunityIcons name="credit-card-clock" size={14} color={isDarkMode ? '#93BCEF' : '#1E40AF'} />
                  </View>
                </View>
                <Text style={[styles.accountAmount, styles.blueArText, isDarkMode && styles.darkBlueArText]} numberOfLines={1}>
                  {formatAmount(balances.ccArDebt)} {currency.symbol}
                </Text>
                <Text
                  style={[styles.accountSub, styles.blueArSubText, isDarkMode && styles.darkBlueArSubText]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.75}
                >
                  {formatCardDueSub(balances.ccArDueThisMonth, balances.ccArDueNextMonth)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Custom Debit Cards Pairs */}
        {(balances.customDebitCardsSummary || []).length > 0 && (
          <View style={[styles.blocksPairRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {(balances.customDebitCardsSummary || []).map((dCard) => (
              <View key={dCard.id} style={[styles.accountCard, styles.blueArCard, isDarkMode && styles.darkBlueArCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.accountName, styles.blueArText, isDarkMode && styles.darkBlueArText, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                    {dCard.bankName}
                  </Text>
                  <MaterialCommunityIcons name="credit-card-outline" size={15} color={isDarkMode ? themeColors.primary : '#1E40AF'} />
                </View>
                <Text style={[styles.accountAmount, styles.blueArText, isDarkMode && { color: themeColors.primary }]} numberOfLines={1}>
                  {formatAmount(dCard.avail)} {currency.symbol}
                </Text>
                <Text style={[styles.accountSub, styles.blueArSubText, isDarkMode && styles.darkBlueArSubText]} numberOfLines={1}>
                  {isArabic ? `بدأنا بـ ${formatAmount(dCard.startBal)}` : `Start ${formatAmount(dCard.startBal)}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Custom Credit Cards Pairs */}
        {(balances.customCreditCardsSummary || []).length > 0 && (
          <View style={[styles.blocksPairRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {(balances.customCreditCardsSummary || []).map((cCard) => (
              <TouchableOpacity
                key={cCard.id}
                style={[styles.accountCard, styles.greenCaCard, isDarkMode && styles.darkGreenCaCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}
                onPress={() => onOpenPayCc && onOpenPayCc(cCard.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.accountName, styles.greenCaText, isDarkMode && styles.darkGreenCaText, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                    {cCard.bankName}
                  </Text>
                  <View style={[styles.payBadgeRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.payBadgeGreen, isDarkMode && { backgroundColor: '#2E4C3E' }]}>
                      <Text style={[styles.payBadgeGreenText, isDarkMode && { color: '#9EE0BE' }]}>{isArabic ? 'سداد 💳' : 'Pay'}</Text>
                    </View>
                    <MaterialCommunityIcons name="credit-card-clock-outline" size={14} color={isDarkMode ? '#8ED6B3' : '#065F46'} />
                  </View>
                </View>
                <Text style={[styles.accountAmount, styles.greenCaText, isDarkMode && styles.darkGreenCaText]} numberOfLines={1}>
                  {formatAmount(cCard.totalDebt)} {currency.symbol}
                </Text>
                <Text style={[styles.accountSub, styles.greenCaSubText, isDarkMode && styles.darkGreenCaSubText]} numberOfLines={1}>
                  {formatCardDueSub(cCard.dueThisMonth, cCard.dueNextMonth)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 4. Burn Rate & Insights Row */}
      <View style={[styles.insightsRow, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={styles.insightItem}>
          <Text style={[styles.insightVal, { color: isDarkMode ? themeColors.expense : '#DC2626' }]}>
            {formatAmount(balances.totalOutflow)}
          </Text>
          <Text style={[styles.insightLbl, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1}>
            {isArabic ? 'المنصرف' : 'Outflow'}
          </Text>
        </View>
        <View style={[styles.insightDivider, isDarkMode && { backgroundColor: themeColors.border }]} />
        <View style={styles.insightItem}>
          <Text style={[styles.insightVal, isDarkMode && { color: themeColors.textPrimary }]}>
            {formatAmount(balances.realTotalSpent)}
          </Text>
          <Text style={[styles.insightLbl, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1}>
            {isArabic ? 'الاستهلاك' : 'Direct'}
          </Text>
        </View>
        <View style={[styles.insightDivider, isDarkMode && { backgroundColor: themeColors.border }]} />
        <View style={styles.insightItem}>
          <Text style={[styles.insightVal, isDarkMode && { color: themeColors.textPrimary }]}>
            {formatAmount(balances.avgPerDay)}
          </Text>
          <Text style={[styles.insightLbl, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1}>
            {isArabic ? 'المتوسط' : 'Daily'}
          </Text>
        </View>
        <View style={[styles.insightDivider, isDarkMode && { backgroundColor: themeColors.border }]} />
        <View style={styles.insightItem}>
          <Text style={[styles.insightVal, { color: isDarkMode ? themeColors.primary : '#059669' }]}>
            {balances.daysMoneyLasts} {isArabic ? 'يوم' : 'd'}
          </Text>
          <Text style={[styles.insightLbl, isDarkMode && { color: themeColors.textSecondary }]} numberOfLines={1}>
            {isArabic ? 'يكفي' : 'Lasts'}
          </Text>
        </View>
      </View>

      {/* 5. Action Buttons: Circular Add Expense + Secondary Actions */}
      <View style={[styles.actionButtonsContainer, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* Circular Add Expense Button */}
        <TouchableOpacity
          style={[
            styles.circularExpenseBtn,
            SHADOWS.medium,
            isDarkMode && { backgroundColor: themeColors.expense, borderColor: 'rgba(255, 92, 101, 0.45)' },
          ]}
          onPress={onOpenAddExpense}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="minus-circle-outline" size={24} color={COLORS.textWhite} />
          <Text style={styles.circularExpenseBtnText} numberOfLines={2}>
            {isArabic ? 'تسجيل\nمصروف' : 'Add\nExpense'}
          </Text>
        </TouchableOpacity>

        {/* Secondary Action Buttons */}
        <View style={styles.secondaryActionsCol}>
          <View style={[styles.actionButtonsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                SHADOWS.small,
                styles.payCcActionBtn,
                isDarkMode
                  ? { backgroundColor: themeColors.surfaceSecondary, borderWidth: 1, borderColor: themeColors.border }
                  : { backgroundColor: themeColors.primaryDark },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => onOpenPayCc && onOpenPayCc('cc_ar')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="credit-card-check" size={15} color={isDarkMode ? themeColors.primary : COLORS.textWhite} />
              <Text style={[styles.actionBtnText, isDarkMode && { color: themeColors.textPrimary }]}>{isArabic ? 'سداد كارت 💳' : 'Pay Card 💳'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                SHADOWS.small,
                styles.incomeActionBtn,
                isDarkMode
                  ? { backgroundColor: themeColors.primary, ...NEON_GLOW.soft }
                  : { backgroundColor: themeColors.primary },
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={onOpenAddIncome}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={15} color={isDarkMode ? '#050505' : COLORS.textWhite} />
              <Text style={[styles.actionBtnText, isDarkMode && { color: '#050505', fontWeight: '900' }]}>
                {isArabic ? 'وارد / تحويل' : 'Income / Trns'}
              </Text>
            </TouchableOpacity>
          </View>

          {onOpenExcelSheet && (
            <TouchableOpacity
              style={[styles.actionBtn, SHADOWS.small, styles.excelActionBtn, { marginTop: 6, backgroundColor: themeColors.primaryLight, borderColor: themeColors.primary }, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={onOpenExcelSheet}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="file-excel-box" size={16} color={isDarkMode ? themeColors.primary : themeColors.primaryDark} />
              <Text style={[styles.actionBtnText, { color: isDarkMode ? themeColors.primary : themeColors.primaryDark, fontWeight: '800' }]}>
                {isArabic ? 'شيت إكسيل 📊' : 'Excel Sheet 📊'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 13,
    borderWidth: 1,
    borderColor: '#DCE5E1',
    width: '100%',
  },
  // Top Spent & Start Figures side-by-side
  spentHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  topFigureBlock: {
    flex: 1,
  },
  figureLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  figureLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  figureNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  figureMainNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  figureCurrency: {
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  topVDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#E2E8F0',
  },
  cycleSubBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 4,
  },
  directSpentText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cycleBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  // Section 1 (Top): Light Beige Box with Gross Available (Dark Green, K) + Card Debts (Red) + Consumption Badge & prominent shadow
  netContainer: {
    alignItems: 'center',
    backgroundColor: '#FAF3E0',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 13,
    borderWidth: 1.3,
    borderColor: '#E5D3B3',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  netBalancesCol: {
    flex: 1,
  },
  balanceBlock: {
    width: '100%',
  },
  netLabel: {
    fontSize: 10.5,
    color: '#065F46',
    fontWeight: '700',
    marginBottom: 1,
  },
  netDebtLabel: {
    fontSize: 10.5,
    color: '#B91C1C',
    fontWeight: '700',
    marginBottom: 1,
  },
  balanceValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#065F46',
  },
  balanceDebtValNumber: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#DC2626',
  },
  balanceValCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    marginHorizontal: 2,
  },
  balanceDebtCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginHorizontal: 2,
  },
  netDividerH: {
    height: 1,
    backgroundColor: '#E5D3B3',
    width: '100%',
    marginVertical: 5,
  },
  consumptionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7,
    minWidth: 78,
  },
  consumptionPercentText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#B45309',
    marginTop: 2,
  },
  consumptionLabelText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 11,
  },
  // 4 Accounts Grid
  accountsGridContainer: {
    gap: 7,
    marginBottom: 10,
    width: '100%',
  },
  blocksPairRow: {
    flexDirection: 'row',
    gap: 7,
    width: '100%',
  },
  accountCard: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  // Beige theme (كاش متاح + حساب بنكي DC)
  beigeCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  beigeText: {
    color: '#92400E',
  },
  beigeSubText: {
    color: '#B45309',
  },
  // Green Light theme (كريدي أجريكول CC CA)
  greenCaCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  greenCaText: {
    color: '#065F46',
  },
  greenCaSubText: {
    color: '#047857',
  },
  // Blue Light theme (البنك العربي CC AR)
  blueArCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  blueArText: {
    color: '#1E40AF',
  },
  blueArSubText: {
    color: '#2563EB',
  },
  // Sary-inspired Obsidian-Emerald Dark Box Themes (Dark Mode ONLY)
  darkBeigeCard: {
    backgroundColor: '#10221B',
    borderColor: 'rgba(60, 232, 142, 0.30)',
  },
  darkBeigeText: {
    color: '#3CE88E',
  },
  darkBeigeSubText: {
    color: '#9BB0AC',
  },
  darkGreenCaCard: {
    backgroundColor: '#1F1413',
    borderColor: 'rgba(242, 113, 88, 0.32)',
  },
  darkGreenCaText: {
    color: '#F27158',
  },
  darkGreenCaSubText: {
    color: '#9BB0AC',
  },
  darkBlueArCard: {
    backgroundColor: '#0F1F22',
    borderColor: 'rgba(79, 209, 217, 0.32)',
  },
  darkBlueArText: {
    color: '#4FD1D9',
  },
  darkBlueArSubText: {
    color: '#9BB0AC',
  },
  accountTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    width: '100%',
  },
  accountName: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  accountAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  accountSub: {
    fontSize: 8.5,
    marginTop: 1,
  },
  carouselToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
    width: '100%',
  },
  carouselSectionTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  carouselToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexShrink: 0,
  },
  carouselToggleText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  // Insights Row
  insightsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBF0EE',
    ...SHADOWS.small,
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  insightLbl: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  insightDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  // Action Buttons
  actionButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circularExpenseBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.expense,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  circularExpenseBtnText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 13,
  },
  secondaryActionsCol: {
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 4,
  },
  expenseActionBtn: {
    backgroundColor: COLORS.expense,
  },
  payCcActionBtn: {
    backgroundColor: '#059669',
  },
  excelActionBtn: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  incomeActionBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    color: COLORS.textWhite,
    fontSize: 10.5,
    fontWeight: '700',
  },
  // Pay Badges on Credit Card Blocks
  payBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payBadgeGreen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  payBadgeGreenText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#065F46',
  },
  payBadgeBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  payBadgeBlueText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1E40AF',
  },
});
