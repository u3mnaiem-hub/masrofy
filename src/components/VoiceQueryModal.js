import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useExpense } from '../context/ExpenseContext';
import { speakText, stopSpeech } from '../utils/voiceAssistant';

export const VoiceQueryModal = ({ visible, onClose, onOpenAddExpense }) => {
  const { todayAndYesterdayTotals, currency, formatAmount, language, isArabic } = useExpense();
  const [userQuery, setUserQuery] = useState('');
  const [responseMsg, setResponseMsg] = useState('');

  const { todayTotal, todayCount, yesterdayTotal, yesterdayCount, todayStr, yesterdayStr } =
    todayAndYesterdayTotals || {
      todayTotal: 0,
      todayCount: 0,
      yesterdayTotal: 0,
      yesterdayCount: 0,
      todayStr: '',
      yesterdayStr: '',
    };

  useEffect(() => {
    if (visible) {
      setUserQuery('');
      setResponseMsg('');
      // Auto speak intro when opening
      const greeting = isArabic
        ? `مرحباً بك. إجمالي مصروف اليوم هو ${todayTotal} ${currency.symbol}، وإجمالي مصروف أمس هو ${yesterdayTotal} ${currency.symbol}.`
        : `Hello. Today's total expense is ${todayTotal} ${currency.symbol}, and yesterday was ${yesterdayTotal} ${currency.symbol}.`;
      speakText(greeting, { language });
    } else {
      stopSpeech();
    }
    return () => {
      stopSpeech();
    };
  }, [visible]);

  const speakToday = () => {
    const msg = isArabic
      ? `إجمالي مصروف اليوم تاريخ ${todayStr} هو ${todayTotal} ${currency.symbol} من خلال ${todayCount} معاملة.`
      : `Today's expense for ${todayStr} is ${todayTotal} ${currency.symbol} across ${todayCount} transactions.`;
    setResponseMsg(msg);
    speakText(msg, { language });
  };

  const speakYesterday = () => {
    const msg = isArabic
      ? `إجمالي مصروف أمس تاريخ ${yesterdayStr} هو ${yesterdayTotal} ${currency.symbol} من خلال ${yesterdayCount} معاملة.`
      : `Yesterday's expense for ${yesterdayStr} is ${yesterdayTotal} ${currency.symbol} across ${yesterdayCount} transactions.`;
    setResponseMsg(msg);
    speakText(msg, { language });
  };

  const handleAskQuestion = (textToAsk) => {
    const query = (textToAsk || userQuery || '').toLowerCase().trim();
    if (!query) return;

    if (/امس|أمس|البارحة|امبارح|yesterday/i.test(query)) {
      speakYesterday();
    } else if (/اليوم|النهاردة|النهارده|today/i.test(query)) {
      speakToday();
    } else {
      const fullSummary = isArabic
        ? `مصروف اليوم: ${todayTotal} ${currency.symbol}. مصروف أمس: ${yesterdayTotal} ${currency.symbol}.`
        : `Today: ${todayTotal} ${currency.symbol}. Yesterday: ${yesterdayTotal} ${currency.symbol}.`;
      setResponseMsg(fullSummary);
      speakText(fullSummary, { language });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isArabic ? 'المساعد والاستعلام الصوتي 🎙️' : 'Voice Query Assistant 🎙️'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isArabic ? 'استعلام فوري صوتي عن مصروف اليوم وأمس' : 'Instant voice insights for Today & Yesterday'}
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Today's Expense Card */}
            <View style={[styles.statCard, { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]}>
              <View style={[styles.cardHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="calendar-today" size={22} color="#1D4ED8" />
                </View>
                <View style={[{ flex: 1 }, isArabic ? { alignItems: 'flex-end', marginRight: 10 } : { marginLeft: 10 }]}>
                  <Text style={styles.cardPeriodTitle}>
                    {isArabic ? 'إجمالي مصروف اليوم (Today)' : "Today's Total Expense"}
                  </Text>
                  <Text style={styles.cardDateSub}>{todayStr}</Text>
                </View>
                <TouchableOpacity onPress={speakToday} style={styles.speakerBtn} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="volume-high" size={20} color="#1D4ED8" />
                </TouchableOpacity>
              </View>

              <View style={[styles.amountRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.amountNumber, { color: '#1D4ED8' }]}>{formatAmount(todayTotal)}</Text>
                <Text style={styles.amountCurrency}> {currency.symbol}</Text>
                <Text style={styles.txCountBadge}>
                  {isArabic ? `(${todayCount} معاملة)` : `(${todayCount} txs)`}
                </Text>
              </View>
            </View>

            {/* Yesterday's Expense Card */}
            <View style={[styles.statCard, { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' }]}>
              <View style={[styles.cardHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="history" size={22} color="#6D28D9" />
                </View>
                <View style={[{ flex: 1 }, isArabic ? { alignItems: 'flex-end', marginRight: 10 } : { marginLeft: 10 }]}>
                  <Text style={styles.cardPeriodTitle}>
                    {isArabic ? 'إجمالي مصروف أمس (Yesterday)' : "Yesterday's Total Expense"}
                  </Text>
                  <Text style={styles.cardDateSub}>{yesterdayStr}</Text>
                </View>
                <TouchableOpacity onPress={speakYesterday} style={styles.speakerBtn} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="volume-high" size={20} color="#6D28D9" />
                </TouchableOpacity>
              </View>

              <View style={[styles.amountRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.amountNumber, { color: '#6D28D9' }]}>{formatAmount(yesterdayTotal)}</Text>
                <Text style={styles.amountCurrency}> {currency.symbol}</Text>
                <Text style={styles.txCountBadge}>
                  {isArabic ? `(${yesterdayCount} معاملة)` : `(${yesterdayCount} txs)`}
                </Text>
              </View>
            </View>

            {/* Response Banner (if spoke) */}
            {responseMsg ? (
              <View style={styles.responseBox}>
                <MaterialCommunityIcons name="bullhorn-outline" size={18} color="#059669" />
                <Text style={styles.responseTxt}>{responseMsg}</Text>
              </View>
            ) : null}

            {/* Interactive Voice Question Box */}
            <View style={styles.queryBox}>
              <Text style={[styles.queryBoxTitle, isArabic && { textAlign: 'right' }]}>
                {isArabic ? 'اسأل المساعد صوتياً أو كتابةً:' : 'Ask the Assistant:'}
              </Text>

              {/* Quick Prompt Pills */}
              <View style={[styles.pillsRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={styles.queryPill}
                  onPress={() => handleAskQuestion(isArabic ? 'مصروف اليوم' : 'Today')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.queryPillText}>{isArabic ? 'كم صرفت اليوم؟ 🗣️' : "Today's spent? 🗣️"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.queryPill}
                  onPress={() => handleAskQuestion(isArabic ? 'مصروف أمس' : 'Yesterday')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.queryPillText}>{isArabic ? 'كم صرفت أمس؟ 🗣️' : "Yesterday's? 🗣️"}</Text>
                </TouchableOpacity>
              </View>

              {/* Input for Voice Dictation via Samsung Keyboard Mic */}
              <View style={[styles.inputRow, isArabic && { flexDirection: 'row-reverse' }]}>
                <TextInput
                  style={[styles.input, isArabic ? { textAlign: 'right' } : { textAlign: 'left' }]}
                  placeholder={isArabic ? 'قل أو اكتب: مصروف اليوم أو أمس...' : 'Say or type: Today or Yesterday...'}
                  placeholderTextColor={COLORS.textMuted}
                  value={userQuery}
                  onChangeText={setUserQuery}
                  onSubmitEditing={() => handleAskQuestion()}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={() => handleAskQuestion()}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="microphone" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Big Action: Read Full Aloud */}
            <TouchableOpacity
              style={[styles.readAllBtn, SHADOWS.medium]}
              onPress={() => {
                const full = isArabic
                  ? `تقرير الاستعلام المالي: إجمالي مصروفك اليوم هو ${todayTotal} ${currency.symbol}. وإجمالي مصروف أمس هو ${yesterdayTotal} ${currency.symbol}.`
                  : `Financial Query: Today's total is ${todayTotal} ${currency.symbol}, and yesterday was ${yesterdayTotal} ${currency.symbol}.`;
                setResponseMsg(full);
                speakText(full, { language });
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="text-to-speech" size={22} color="#FFFFFF" />
              <Text style={styles.readAllBtnText}>
                {isArabic ? 'نطق التقرير الصوتي بالكامل 🔊' : 'Read Full Report Aloud 🔊'}
              </Text>
            </TouchableOpacity>

            {/* Quick Link to Add Expense */}
            {onOpenAddExpense && (
              <TouchableOpacity
                style={styles.addExpenseLink}
                onPress={() => {
                  onClose();
                  onOpenAddExpense();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color={COLORS.primaryDark} />
                <Text style={styles.addExpenseLinkText}>
                  {isArabic ? 'تسجيل مصروف جديد بالمساعد الصوتي 🎙️' : 'Add New Expense with Voice Assistant 🎙️'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: COLORS.surface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 14,
  },
  statCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPeriodTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardDateSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  speakerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    gap: 4,
  },
  amountNumber: {
    fontSize: 26,
    fontWeight: '900',
  },
  amountCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  txCountBadge: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  responseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  responseTxt: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
  queryBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  queryBoxTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  queryPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  queryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 12,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  readAllBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addExpenseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  addExpenseLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
