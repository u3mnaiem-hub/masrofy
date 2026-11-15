import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';

export const BalanceCard = ({ onOpenAddExpense, onOpenAddIncome, onOpenExcelSheet, onOpenPayCc }) => {
  const { balances, currency, formatAmount, isArabic, isDarkMode, themeColors } = useExpense();
  const [showPlasticCards, setShowPlasticCards] = useState(true);

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
    {
      id: 'dc',
      title: isArabic ? 'DC / حساب بنكي' : 'DC Bank Account',
      typeBadge: 'DEBIT CARD',
      digits: '4532 •••• 8821',
      amount: balances.availDc,
      subText: isArabic ? `بداية الشهر: ${formatAmount(balances.startDc)}` : `Start: ${formatAmount(balances.startDc)}`,
      ratio: balances.startDc > 0 ? Math.min(100, Math.max(0, Math.round(((balances.startDc - balances.availDc) / balances.startDc) * 100))) : 0,
      bg: '#1E3A8A',
      accent: '#60A5FA',
      isCredit: false,
    },
    {
      id: 'cc_ar',
      title: isArabic ? 'البنك العربي (CC AR)' : 'Arab Bank (CC AR)',
      typeBadge: 'CREDIT CARD',
      digits: '5412 •••• 3910',
      amount: balances.ccArDebt,
      subText: isArabic ? `مستحق 25/11: ${formatAmount(balances.ccArDueThisMonth)}` : `Due 25/11: ${formatAmount(balances.ccArDueThisMonth)}`,
      ratio: Math.min(100, Math.round(((balances.ccArDebt || 0) / 10000) * 100)),
      bg: '#7DD3FC',
      accent: '#0369A1',
      isLightCard: true,
      isCredit: true,
    },
    {
      id: 'cc_ca',
      title: isArabic ? 'كريدي أجريكول (CC CA)' : 'Crédit Agricole',
      typeBadge: 'CREDIT CARD',
      digits: '4916 •••• 7742',
      amount: balances.ccCaDebt,
      subText: isArabic ? `مستحق 25/12: ${formatAmount(balances.ccCaDueNextMonth)}` : `Due 25/12: ${formatAmount(balances.ccCaDueNextMonth)}`,
      ratio: Math.min(100, Math.round(((balances.ccCaDebt || 0) / 10000) * 100)),
      bg: '#064E3B',
      accent: '#34D399',
      isCredit: true,
    },
  ];

  // Monthly Consumption Percentage calculation (Outflow / Starting Base)
  const totalBase = balances.totalStartedWith > 0 ? balances.totalStartedWith : 1;
  const consumptionPercent = ((balances.totalOutflow / totalBase) * 100).toFixed(1);
  const numConsumption = parseFloat(consumptionPercent) || 0;
  const isHighConsumption = numConsumption > 50;

  // Gross liquid available before credit card debt deductions
  const grossAvailableBeforeCards =
    (balances.availCsh || 0) +
    (balances.availDc || 0) +
    ((balances.customDebitCardsSummary || []).reduce((sum, d) => sum + (d.avail || 0), 0));

  return (
    <View style={[styles.card, SHADOWS.medium, { borderColor: themeColors.primaryLight, borderWidth: 1.5 }, isDarkMode && { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      {/* 1. TOP SPOTLIGHT: المبلغ المنصرف (بالأحمر) وجنبه إجمالي البداية (بلون الثيم بنفس الحجم والفونت) */}
      <View style={[styles.spentHeaderContainer, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* المبلغ المنصرف */}
        <View style={[styles.topFigureBlock, isArabic && { alignItems: 'flex-end' }]}>
          <View style={[styles.figureLabelRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons name="arrow-up-circle" size={14} color="#DC2626" />
            <Text style={[styles.figureLabel, { color: '#DC2626' }]}>
              {isArabic ? 'المبلغ المنصرف' : 'Total Spent'}
            </Text>
          </View>
          <View style={[styles.figureNumberRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.figureMainNumber, { color: '#DC2626' }]}>
              {formatAmount(balances.totalOutflow)}
            </Text>
            <Text style={[styles.figureCurrency, { color: '#EF4444' }]}> {currency.symbol}</Text>
          </View>
        </View>

        {/* فاصل وسطي خفيف */}
        <View style={styles.topVDivider} />

        {/* إجمالي البداية (بنفس الحجم والفونت بلون الثيم المختار) */}
        <View style={[styles.topFigureBlock, isArabic && { alignItems: 'flex-start' }]}>
          <View style={[styles.figureLabelRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <MaterialCommunityIcons name="wallet-outline" size={14} color={themeColors.primaryDark} />
            <Text style={[styles.figureLabel, { color: isDarkMode ? themeColors.primary : themeColors.primaryDark }]}>
              {isArabic ? 'إجمالي البداية' : 'Starting Base'}
            </Text>
          </View>
          <View style={[styles.figureNumberRow, isArabic && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.figureMainNumber, { color: isDarkMode ? themeColors.primary : themeColors.primaryDark }]}>
              {formatAmount(balances.totalStartedWith)}
            </Text>
            <Text style={[styles.figureCurrency, { color: themeColors.primary }]}> {currency.symbol}</Text>
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

      {/* 2. SECTION 2: صافي الرصيد المتبقي (بعد خصم الكروت) وتحته صافي الرصيد المتواجد (بدون خصم الكروت) وجنبهم ناحية الشمال النسبة المئوية */}
      <View style={[styles.netContainer, isArabic ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }]}>
        {/* Right column in Arabic: Both Balances stacked one under the other */}
        <View style={[styles.netBalancesCol, isArabic ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {/* Balance 1: بعد خصم الكروت */}
          <View style={[styles.balanceBlock, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.netLabel} numberOfLines={1}>
              {isArabic ? 'صافي الرصيد المتبقي (بعد CC)' : 'Net Available (After CC)'}
            </Text>
            <View style={[styles.balanceValRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.balanceValNumber}>
                {formatAmount(balances.netAvailableAfterCards)}
              </Text>
              <Text style={styles.balanceValCurrency}> {currency.symbol}</Text>
            </View>
          </View>

          <View style={styles.netDividerH} />

          {/* Balance 2: بدون خصم الكروت (بنفس الحجم تقريباً) */}
          <View style={[styles.balanceBlock, isArabic && { alignItems: 'flex-end' }]}>
            <Text style={styles.netGrossLabel} numberOfLines={1}>
              {isArabic ? 'صافي الرصيد المتواجد (No CC)' : 'Gross Available (No CC)'}
            </Text>
            <View style={[styles.balanceValRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.balanceGrossValNumber}>
                {formatAmount(grossAvailableBeforeCards)}
              </Text>
              <Text style={styles.balanceValCurrency}> {currency.symbol}</Text>
            </View>
          </View>
        </View>

        {/* Left side: النسبة المئوية للاستهلاك الشهري (Monthly Consumption %) */}
        <View
          style={[
            styles.consumptionBox,
            {
              backgroundColor: isHighConsumption ? '#DC2626' : themeColors.primaryDark,
              borderColor: isHighConsumption ? '#B91C1C' : themeColors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons name="chart-pie" size={17} color="#FFFFFF" />
          <Text style={[styles.consumptionPercentText, { color: '#FFFFFF' }]}>
            {consumptionPercent}%
          </Text>
          <Text style={[styles.consumptionLabelText, { color: '#FFFFFF' }]} numberOfLines={2}>
            {isArabic ? 'نسبة الاستهلاك\nالشهري' : 'Monthly\nConsumption'}
          </Text>
        </View>
      </View>

      {/* 3. Swipeable Real Bank Cards Carousel + 4 Rectangular Blocks */}
      <View style={[styles.carouselToggleRow, isArabic && { flexDirection: 'row-reverse' }]}>
        <Text style={[styles.carouselSectionTitle, isDarkMode && { color: themeColors.textSecondary }]}>
          {isArabic ? 'البطاقات والأرصدة البنكية 💳' : 'Bank Cards & Wallets 💳'}
        </Text>
        <TouchableOpacity
          style={[styles.carouselToggleBtn, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }]}
          onPress={() => setShowPlasticCards((v) => !v)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name={showPlasticCards ? 'view-grid-outline' : 'cards-outline'} size={14} color={themeColors.primary} />
          <Text style={[styles.carouselToggleText, { color: themeColors.primary }]}>
            {showPlasticCards ? (isArabic ? 'إخفاء شريط الكروت' : 'Hide Cards') : (isArabic ? 'عرض كروت بنكية 💳' : 'Show Bank Cards 💳')}
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
        </View>

        {/* Row 2: أجريكول والعربي جنباً إلى جنب تحتهما مباشرة */}
        <View style={[styles.blocksPairRow, isArabic && { flexDirection: 'row-reverse' }]}>
          {/* Block 3: كريدي أجريكول (CC CA) */}
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
              {balances.ccCaDueThisMonth > 0
                ? `25/11: ${formatAmount(balances.ccCaDueThisMonth)} • 25/12: ${formatAmount(balances.ccCaDueNextMonth)}`
                : isArabic
                ? `مستحق 25/12: ${formatAmount(balances.ccCaDueNextMonth)}`
                : `Due 25/12: ${formatAmount(balances.ccCaDueNextMonth)}`}
            </Text>
          </TouchableOpacity>

          {/* Block 4: البنك العربي (CC AR) */}
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
              {balances.ccArDueNextMonth > 0
                ? `25/11: ${formatAmount(balances.ccArDueThisMonth)} • 25/12: ${formatAmount(balances.ccArDueNextMonth)}`
                : isArabic
                ? `مستحق 25/11: ${formatAmount(balances.ccArDueThisMonth)}`
                : `Due 25/11: ${formatAmount(balances.ccArDueThisMonth)}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Debit Cards Pairs */}
        {(balances.customDebitCardsSummary || []).length > 0 && (
          <View style={[styles.blocksPairRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {(balances.customDebitCardsSummary || []).map((dCard) => (
              <View key={dCard.id} style={[styles.accountCard, styles.blueArCard, isDarkMode && styles.darkBlueArCard, { flex: 1 }, isArabic && { alignItems: 'flex-end' }]}>
                <View style={[styles.accountTop, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.accountName, styles.blueArText, isDarkMode && styles.darkBlueArText, isArabic && { textAlign: 'right' }]} numberOfLines={1}>
                    {dCard.bankName} (DC)
                  </Text>
                  <MaterialCommunityIcons name="credit-card-outline" size={15} color={isDarkMode ? '#93BCEF' : '#1E40AF'} />
                </View>
                <Text style={[styles.accountAmount, styles.blueArText, isDarkMode && styles.darkBlueArText]} numberOfLines={1}>
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
                    {cCard.bankName} (CC)
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
                  {cCard.dueThisMonth > 0
                    ? `25/11: ${formatAmount(cCard.dueThisMonth)} • 25/12: ${formatAmount(cCard.dueNextMonth)}`
                    : isArabic
                    ? `مستحق 25/12: ${formatAmount(cCard.dueNextMonth)}`
                    : `Due 25/12: ${formatAmount(cCard.dueNextMonth)}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 4. Burn Rate & Insights Row */}
      <View style={[styles.insightsRow, isDarkMode && { backgroundColor: themeColors.surfaceSecondary, borderColor: themeColors.border }, isArabic && { flexDirection: 'row-reverse' }]}>
        <View style={styles.insightItem}>
          <Text style={[styles.insightVal, { color: '#DC2626' }]}>
            {formatAmount(balances.totalOutflow)}
          </Text>
          <Text style={styles.insightLbl} numberOfLines={1}>
            {isArabic ? 'المنصرف' : 'Outflow'}
          </Text>
        </View>
        <View style={styles.insightDivider} />
        <View style={styles.insightItem}>
          <Text style={styles.insightVal}>
            {formatAmount(balances.realTotalSpent)}
          </Text>
          <Text style={styles.insightLbl} numberOfLines={1}>
            {isArabic ? 'الاستهلاك' : 'Direct'}
          </Text>
        </View>
        <View style={styles.insightDivider} />
        <View style={styles.insightItem}>
          <Text style={styles.insightVal}>
            {formatAmount(balances.avgPerDay)}
          </Text>
          <Text style={styles.insightLbl} numberOfLines={1}>
            {isArabic ? 'المتوسط' : 'Daily'}
          </Text>
        </View>
        <View style={styles.insightDivider} />
        <View style={styles.insightItem}>
          <Text style={[styles.insightVal, { color: '#059669' }]}>
            {balances.daysMoneyLasts} {isArabic ? 'يوم' : 'd'}
          </Text>
          <Text style={styles.insightLbl} numberOfLines={1}>
            {isArabic ? 'يكفي' : 'Lasts'}
          </Text>
        </View>
      </View>

      {/* 5. Action Buttons: 2 rows of 2 wide buttons for maximum comfort & clarity */}
      <View style={styles.actionButtonsContainer}>
        {/* Row 1: تسجيل مصروف + سداد كارت ائتمان */}
        <View style={[styles.actionButtonsRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.expenseActionBtn, isArabic && { flexDirection: 'row-reverse' }]}
            onPress={onOpenAddExpense}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="minus-circle-outline" size={15} color={COLORS.textWhite} />
            <Text style={styles.actionBtnText}>{isArabic ? 'تسجيل مصروف' : 'Add Expense'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.payCcActionBtn, { backgroundColor: themeColors.primaryDark }, isArabic && { flexDirection: 'row-reverse' }]}
            onPress={() => onOpenPayCc && onOpenPayCc('cc_ar')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="credit-card-check" size={15} color={COLORS.textWhite} />
            <Text style={styles.actionBtnText}>{isArabic ? 'سداد كارت 💳' : 'Pay Card 💳'}</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: شيت إكسيل سريع + وارد / تحويل */}
        <View style={[styles.actionButtonsRow, { marginTop: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
          {onOpenExcelSheet && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.excelActionBtn, { backgroundColor: themeColors.primaryLight, borderColor: themeColors.primary }, isArabic && { flexDirection: 'row-reverse' }]}
              onPress={onOpenExcelSheet}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="file-excel-box" size={16} color={isDarkMode ? themeColors.primary : themeColors.primaryDark} />
              <Text style={[styles.actionBtnText, { color: isDarkMode ? themeColors.primary : themeColors.primaryDark, fontWeight: '800' }]}>
                {isArabic ? 'شيت إكسيل 📊' : 'Excel Sheet 📊'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.incomeActionBtn, { backgroundColor: themeColors.primary }, isArabic && { flexDirection: 'row-reverse' }]}
            onPress={onOpenAddIncome}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={15} color={COLORS.textWhite} />
            <Text style={styles.actionBtnText}>
              {isArabic ? 'وارد / تحويل' : 'Income / Trns'}
            </Text>
          </TouchableOpacity>
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
    borderColor: '#E2E8F0',
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
  // Section 2: Two Net Balances + Left Consumption Badge
  netContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  netBalancesCol: {
    flex: 1,
  },
  balanceBlock: {
    width: '100%',
  },
  netLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: 1,
  },
  netGrossLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 1,
  },
  balanceValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceValNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  balanceGrossValNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  balanceValCurrency: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginHorizontal: 2,
  },
  netDividerH: {
    height: 1,
    backgroundColor: '#E2E8F0',
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
  // Soft Dark-Gray Box Themes (for comfortable dark mode)
  darkBeigeCard: {
    backgroundColor: '#36332B',
    borderColor: '#524B3B',
  },
  darkBeigeText: {
    color: '#EAD7A7',
  },
  darkBeigeSubText: {
    color: '#C7B485',
  },
  darkGreenCaCard: {
    backgroundColor: '#283630',
    borderColor: '#3B564A',
  },
  darkGreenCaText: {
    color: '#A7E3C5',
  },
  darkGreenCaSubText: {
    color: '#82C2A3',
  },
  darkBlueArCard: {
    backgroundColor: '#293240',
    borderColor: '#3E4F69',
  },
  darkBlueArText: {
    color: '#B5D2F7',
  },
  darkBlueArSubText: {
    color: '#8EB2E0',
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
  },
  carouselSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  carouselToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  carouselToggleText: {
    fontSize: 10.5,
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
    borderColor: '#F1F5F9',
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
