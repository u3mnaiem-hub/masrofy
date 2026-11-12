import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from '../constants/categories';
import { useExpense } from '../context/ExpenseContext';
import {
  speakText,
  stopSpeech,
  parseSpokenExpense,
  extractAmountFromText,
  startNativeVoiceListening,
  stopNativeVoiceListening,
  subscribeVoiceEvents,
} from '../utils/voiceAssistant';

export const AddTransactionModal = ({
  visible,
  onClose,
  initialType = 'expense',
  initialTargetCard = 'cc_ar',
  editingTransaction = null,
}) => {
  const {
    addTransaction,
    updateTransaction,
    currency,
    isArabic,
    allPaymentMethods,
    alertPrefs,
    balances,
    formatAmount,
    language,
    allExpenseCategories,
    addCustomCategory,
    deleteCategory,
    restoreAllCategories,
  } = useExpense();

  // Mode: 'expense' | 'cc_pyd' | 'income' | 'switch'
  const [mode, setMode] = useState(initialType || 'expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('csh');
  const [toAccount, setToAccount] = useState('dc');
  const [targetCard, setTargetCard] = useState(initialTargetCard || 'cc_ar');

  // Voice Assistant & Custom Category States
  const [oneLineSentence, setOneLineSentence] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0); // 0: inactive, 1: amount, 2: category, 3: payment
  const [voiceStepPrompt, setVoiceStepPrompt] = useState('');
  const [voiceStepInput, setVoiceStepInput] = useState('');
  const [voiceStepPlaceholder, setVoiceStepPlaceholder] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceListenTarget, setVoiceListenTarget] = useState(null); // 'oneLine' | 'wizard'
  const [voiceLiveStatus, setVoiceLiveStatus] = useState('');
  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const voiceTargetRef = useRef(null);
  const onVoiceResultRef = useRef(null);
  const autoListenTimerRef = useRef(null);

  useEffect(() => {
    voiceTargetRef.current = voiceListenTarget;
  }, [voiceListenTarget]);

  useEffect(() => {
    if (!visible) {
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      stopNativeVoiceListening();
      stopSpeech();
      setIsListeningVoice(false);
      setVoiceListenTarget(null);
      setVoiceStep(0);
      setVoiceLiveStatus('');
    }
  }, [visible]);

  useEffect(() => {
    const unsub = subscribeVoiceEvents({
      onReady: () => {
        setIsListeningVoice(true);
        setVoiceLiveStatus(isArabic ? '🎙️ أنصت لصوتك الآن...' : '🎙️ Listening...');
      },
      onPartial: (partialText) => {
        if (partialText) {
          setVoiceLiveStatus(partialText);
          if (voiceTargetRef.current === 'oneLine') {
            setOneLineSentence(partialText);
          } else if (voiceTargetRef.current === 'wizard') {
            setVoiceStepInput(partialText);
          }
        }
      },
      onResult: (finalText) => {
        setIsListeningVoice(false);
        setVoiceLiveStatus('');
        if (onVoiceResultRef.current) {
          onVoiceResultRef.current(finalText);
        }
      },
      onError: (err) => {
        setIsListeningVoice(false);
        setVoiceLiveStatus(err?.message || '');
      },
      onEnd: () => {
        setIsListeningVoice(false);
      },
    });
    return () => {
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      unsub();
    };
  }, [isArabic]);

  // Build the list of all Credit Cards (built-in CCs + custom CCs)
  const availableCreditCards = [
    {
      id: 'cc_ar',
      name: isArabic ? 'البنك العربي (CC AR)' : 'Arab Bank (CC AR)',
      shortName: isArabic ? 'العربي' : 'Arab Bank',
      debt: balances.ccArDebt || 0,
      dueThisMonth: balances.ccArDueThisMonth || 0,
      dueNextMonth: balances.ccArDueNextMonth || 0,
      color: '#1E40AF',
      bgColor: '#EFF6FF',
      borderColor: '#93C5FD',
      icon: 'credit-card-clock',
    },
    {
      id: 'cc_ca',
      name: isArabic ? 'كريدي أجريكول (CC CA)' : 'Crédit Agricole (CC CA)',
      shortName: isArabic ? 'أجريكول' : 'Crédit Agricole',
      debt: balances.ccCaDebt || 0,
      dueThisMonth: balances.ccCaDueThisMonth || 0,
      dueNextMonth: balances.ccCaDueNextMonth || 0,
      color: '#065F46',
      bgColor: '#ECFDF5',
      borderColor: '#6EE7B7',
      icon: 'credit-card-outline',
    },
    ...((balances.customCreditCardsSummary || []).map((c) => ({
      id: c.id,
      name: `${c.bankName} (CC)`,
      shortName: c.bankName,
      debt: c.totalDebt || 0,
      dueThisMonth: c.dueThisMonth || 0,
      dueNextMonth: c.dueNextMonth || 0,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      borderColor: '#C4B5FD',
      icon: 'credit-card-clock-outline',
    }))),
  ];

  // Build the list of funding source accounts (Cash, Bank DC, custom Debit)
  const fundingAccounts = (allPaymentMethods || PAYMENT_METHODS).filter(
    (pm) => pm.accountType === 'cash' || pm.accountType === 'debit' || pm.id === 'csh' || pm.id === 'dc'
  );

  const selectedCardObj =
    availableCreditCards.find((c) => c.id === targetCard) || availableCreditCards[0];

  useEffect(() => {
    if (visible) {
      if (editingTransaction) {
        const editM = editingTransaction.type === 'cc_pyd'
          ? 'cc_pyd'
          : (editingTransaction.type === 'switch' ? 'switch' : (editingTransaction.type === 'income' ? 'income' : 'expense'));
        setMode(editM);
        setAmount(editingTransaction.amount != null ? String(editingTransaction.amount) : '');
        setCategoryId(editingTransaction.categoryId || EXPENSE_CATEGORIES[0].id);
        setPaymentMethod(editingTransaction.paymentMethod || 'csh');
        setToAccount(editingTransaction.toAccount || 'dc');
        setTargetCard(editingTransaction.targetCard || initialTargetCard || 'cc_ar');
        setNote(editingTransaction.note || '');
        setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
        setOneLineSentence('');
        return;
      }

      const initM = initialType === 'cc_pyd' ? 'cc_pyd' : (initialType === 'switch' ? 'switch' : (initialType === 'income' ? 'income' : 'expense'));
      setMode(initM);
      setAmount('');
      setOneLineSentence('');
      setDate(new Date().toISOString().split('T')[0]);

      if (initM === 'cc_pyd') {
        setCategoryId('cc_pyd');
        setPaymentMethod('dc'); // Default paying from DC bank account
        const target = initialTargetCard || 'cc_ar';
        setTargetCard(target);
        const cardObj = availableCreditCards.find((c) => c.id === target) || availableCreditCards[0];
        setNote(isArabic ? `سداد كارت ${cardObj?.shortName || cardObj?.name}` : `Payment ${cardObj?.name}`);
      } else if (initM === 'switch') {
        setCategoryId('switch');
        setPaymentMethod('dc');
        setToAccount('csh');
        setNote(isArabic ? 'تحويل كاش من الحساب' : 'Transfer cash from bank');
      } else if (initM === 'income') {
        setCategoryId(INCOME_CATEGORIES[0].id);
        setPaymentMethod('dc');
        setNote('');
      } else {
        setCategoryId(EXPENSE_CATEGORIES[0].id);
        setPaymentMethod('csh');
        setNote('');
      }
    }
  }, [visible, initialType, initialTargetCard, editingTransaction]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'cc_pyd') {
      setCategoryId('cc_pyd');
      if (paymentMethod === 'cc_ar' || paymentMethod === 'cc_ca' || paymentMethod.startsWith('cc_')) {
        setPaymentMethod('dc');
      }
      setNote(isArabic ? `سداد كارت ${selectedCardObj?.shortName || selectedCardObj?.name}` : `Payment ${selectedCardObj?.name}`);
    } else if (newMode === 'switch') {
      setCategoryId('switch');
      if (paymentMethod === 'cc_ar' || paymentMethod === 'cc_ca' || paymentMethod.startsWith('cc_')) {
        setPaymentMethod('dc');
      }
      setToAccount(paymentMethod === 'dc' ? 'csh' : 'dc');
    } else if (newMode === 'income') {
      setCategoryId(INCOME_CATEGORIES[0].id);
      if (paymentMethod === 'cc_ar' || paymentMethod === 'cc_ca' || paymentMethod.startsWith('cc_')) {
        setPaymentMethod('dc');
      }
    } else {
      setCategoryId(EXPENSE_CATEGORIES[0].id);
    }
  };

  const setQuickDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSelectTargetCard = (cardId) => {
    setTargetCard(cardId);
    const cardObj = availableCreditCards.find((c) => c.id === cardId);
    if (cardObj) {
      setNote(isArabic ? `سداد كارت ${cardObj.shortName || cardObj.name}` : `Payment ${cardObj.name}`);
    }
  };

  const beginListening = async (target) => {
    try {
      stopSpeech();
      setVoiceListenTarget(target);
      voiceTargetRef.current = target;
      setVoiceLiveStatus(isArabic ? 'جاري تشغيل الميكروفون...' : 'Starting mic...');
      await startNativeVoiceListening(isArabic ? 'ar-EG' : 'en-US');
    } catch (err) {
      setIsListeningVoice(false);
      setVoiceLiveStatus('');
      Alert.alert(
        isArabic ? 'تنبيه' : 'Alert',
        err?.message || (isArabic ? 'تعذر تشغيل الميكروفون' : 'Unable to start microphone')
      );
    }
  };

  const scheduleWizardListen = (delayMs = 800) => {
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
    autoListenTimerRef.current = setTimeout(() => {
      beginListening('wizard');
    }, delayMs);
  };

  const speakWizardAndListen = (prompt, fallbackDelayMs = 4800) => {
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
    let listened = false;
    const triggerListen = () => {
      if (!listened) {
        listened = true;
        scheduleWizardListen(650);
      }
    };
    autoListenTimerRef.current = setTimeout(triggerListen, fallbackDelayMs);
    speakText(prompt, {
      language: isArabic ? 'ar' : 'en',
      onDone: triggerListen,
    });
  };

  const getBankNamesHint = () => {
    const cards = availableCreditCards || [];
    if (cards.length === 0) return isArabic ? 'العربي أو أجريكول' : 'Arab Bank or Crédit Agricole';
    return cards
      .map((c) => (isArabic ? (c.shortNameAr || c.nameAr || c.name) : (c.shortName || c.name)))
      .join(isArabic ? ' أو ' : ' or ');
  };

  const matchCreditCardByBankName = (spokenText, pmList) => {
    const s = (spokenText || '').toLowerCase();
    const cards = (pmList || []).filter((p) => p.isCredit || p.id === 'cc_ar' || p.id === 'cc_ca' || String(p.id).startsWith('cc_'));
    if (/اجريكول|أجريكول|كريدي|كريدى|agricole|cc ca|cc_ca/i.test(s)) {
      return cards.find((c) => c.id === 'cc_ca') || { id: 'cc_ca' };
    }
    if (/عربي|العربي|arab/i.test(s)) {
      return cards.find((c) => c.id === 'cc_ar') || { id: 'cc_ar' };
    }
    return cards.find((c) => {
      const ar = (c.nameAr || '').toLowerCase();
      const sar = (c.shortNameAr || '').toLowerCase();
      const en = (c.name || '').toLowerCase();
      const bank = (c.bankName || '').toLowerCase();
      return (ar && s.includes(ar)) || (sar && s.includes(sar)) || (en && s.includes(en)) || (bank && s.includes(bank));
    }) || null;
  };

  // Single-sentence One-Shot Voice Dictation (إملاء سطر واحد ينفذ كل شيء دفعة واحدة ويحفظ ويرجع للرئيسية)
  const handleExecuteOneLineVoice = async (spokenOverride) => {
    const text = (typeof spokenOverride === 'string' ? spokenOverride : oneLineSentence || '').trim();
    if (!text) {
      Alert.alert(
        isArabic ? 'تنبيه' : 'Alert',
        isArabic
          ? 'اضغط على الميكروفون أو اكتب المعاملة كاملة\nمثال: "100 جنيه بنزين كاش" أو "100 جنيه بنزين كريديت كارد"'
          : 'Tap the mic or type the full expense e.g. "100 petrol cash"'
      );
      return;
    }
    setOneLineSentence(text);
    const categoriesList = allExpenseCategories || EXPENSE_CATEGORIES;
    const pmList = allPaymentMethods || PAYMENT_METHODS;
    const parsed = parseSpokenExpense(text, categoriesList, pmList);

    const finalAmt = parsed.amount && parsed.amount > 0 ? parsed.amount : (parseFloat(amount) || 0);
    if (finalAmt > 0) {
      setAmount(String(finalAmt));
    }
    const nextCatId = parsed.categoryId || parsed.matchedCategory?.id || categoryId;
    if (parsed.categoryId || parsed.matchedCategory?.id) {
      setCategoryId(nextCatId);
    }
    const nextPmId = parsed.paymentMethod || parsed.matchedPaymentMethod?.id || paymentMethod;
    if (parsed.paymentMethod || parsed.matchedPaymentMethod?.id) {
      setPaymentMethod(nextPmId);
    }
    const nextNote = parsed.note || note;
    if (parsed.note) {
      setNote(parsed.note);
    }

    // Requirement 6: If credit card was said without bank name, ask for bank name!
    if (parsed.needsBankName) {
      setVoiceStep(4);
      setVoiceStepInput('');
      setVoiceListenTarget('wizard');
      voiceTargetRef.current = 'wizard';
      const bankPrompt = isArabic
        ? `ما اسم البنك صاحب كارت الائتمان؟ مثل ${getBankNamesHint()}`
        : `Which bank is the credit card from? e.g. ${getBankNamesHint()}`;
      setVoiceStepPrompt(bankPrompt);
      setVoiceStepPlaceholder(isArabic ? 'تحدث أو اكتب اسم البنك (مثال: العربي، أجريكول)' : 'Say or type bank name');
      speakWizardAndListen(bankPrompt, 5000);
      return;
    }

    const catObj = categoriesList.find((c) => c.id === nextCatId);
    const catName = isArabic ? (catObj?.nameAr || catObj?.name || 'مصروف') : (catObj?.name || 'expense');
    const pmObj = pmList.find((p) => p.id === nextPmId);
    const pmName = isArabic
      ? (pmObj?.shortNameAr || pmObj?.nameAr || 'كاش')
      : (pmObj?.shortName || pmObj?.name || 'Cash');

    // Requirement 4: Save the record and return to the Home screen's Add Expense button
    if (finalAmt > 0) {
      const speakMsg = isArabic
        ? `تم حفظ ${finalAmt} ${currency.symbol} لبند ${catName} عبر ${pmName}`
        : `Saved ${finalAmt} ${currency.symbol} for ${catName} via ${pmName}`;
      speakText(speakMsg, { language: isArabic ? 'ar' : 'en' });

      await addTransaction({
        type: mode === 'income' ? 'income' : 'expense',
        amount: finalAmt,
        categoryId: nextCatId,
        note: nextNote || (isArabic ? `تسجيل صوتي: ${catName}` : `Voice entry: ${catName}`),
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: nextPmId,
      });
      onClose();
    } else {
      const speakMsg = isArabic
        ? 'لم يتم التعرف على المبلغ، يرجى ذكر المبلغ وحفظ المصروف'
        : 'Amount not detected, please mention the amount';
      speakText(speakMsg, { language: isArabic ? 'ar' : 'en' });
    }
  };

  // Interactive Voice-Dictated Entry Step-by-Step (Auto-advances & auto-listens!)
  const startVoiceWizard = () => {
    setVoiceStep(1);
    setVoiceStepInput('');
    setVoiceListenTarget('wizard');
    voiceTargetRef.current = 'wizard';
    const prompt = isArabic ? 'كم المبلغ الذي تريد تسجيله؟' : 'How much is the amount?';
    setVoiceStepPrompt(prompt);
    setVoiceStepPlaceholder(isArabic ? 'تحدث أو اكتب المبلغ (مثال: 100 أو مية)' : 'Say or type amount (e.g. 100)');
    speakWizardAndListen(prompt, 4000);
  };

  const stopVoiceWizard = () => {
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
    stopNativeVoiceListening();
    setIsListeningVoice(false);
    setVoiceListenTarget(null);
    setVoiceStep(0);
    setVoiceStepInput('');
    setVoiceLiveStatus('');
    stopSpeech();
  };

  const speakCurrentStepPrompt = () => {
    if (voiceStepPrompt) {
      speakText(voiceStepPrompt, { language: isArabic ? 'ar' : 'en' });
    }
  };

  const handleAdvanceVoiceStep = async (spokenOverride) => {
    const inputVal = (typeof spokenOverride === 'string' ? spokenOverride : voiceStepInput || '').trim();
    const categoriesList = allExpenseCategories || EXPENSE_CATEGORIES;
    const pmList = allPaymentMethods || PAYMENT_METHODS;

    if (voiceStep === 1) {
      // Step 1: Amount -> Fill Amount & Auto-Move to Step 2 (Category)
      const parsedAmt = extractAmountFromText(inputVal) || parseFloat(amount);
      if (parsedAmt && parsedAmt > 0) {
        setAmount(String(parsedAmt));
        setVoiceStep(2);
        setVoiceStepInput('');
        const prompt = isArabic
          ? `تم تسجيل ${parsedAmt} ${currency.symbol}. ما هو بند المصروف؟ مثل بنزين أو طعام أو فواتير`
          : `Amount is ${parsedAmt}. What is the category?`;
        setVoiceStepPrompt(prompt);
        setVoiceStepPlaceholder(isArabic ? 'تحدث أو اكتب البند (مثال: بنزين، طعام)' : 'Say or type category');
        speakWizardAndListen(prompt, 5500);
      } else {
        const errorMsg = isArabic ? 'يرجى نطق أو كتابة المبلغ أولاً' : 'Please say or type the amount first';
        speakWizardAndListen(errorMsg, 4000);
      }
    } else if (voiceStep === 2) {
      // Step 2: Category -> Select Category & Auto-Move to Step 3 (Payment Method)
      const parsed = parseSpokenExpense(inputVal, categoriesList, pmList);
      let selectedCat = categoryId;
      if (parsed.categoryId || parsed.matchedCategory?.id) {
        selectedCat = parsed.categoryId || parsed.matchedCategory.id;
        setCategoryId(selectedCat);
      }
      if (parsed.note) {
        setNote(parsed.note);
      }
      setVoiceStep(3);
      setVoiceStepInput('');
      const catObj = categoriesList.find((c) => c.id === selectedCat);
      const cName = isArabic ? (catObj?.nameAr || catObj?.name || 'مصروف') : (catObj?.name || 'expense');
      const prompt = isArabic
        ? `تم اختيار ${cName}. ما هي طريقة الدفع؟ كاش أم كارت ائتمان أم بنك؟`
        : `Category is ${cName}. Payment method?`;
      setVoiceStepPrompt(prompt);
      setVoiceStepPlaceholder(isArabic ? 'تحدث أو اكتب طريقة الدفع (كاش، كارت ائتمان، بنك)' : 'Say or type payment method');
      speakWizardAndListen(prompt, 5500);
    } else if (voiceStep === 3) {
      // Step 3: Payment Method -> If generic credit card, ask for bank name (Step 4); otherwise save & finish!
      const parsed = parseSpokenExpense(inputVal, categoriesList, pmList);
      if (parsed.needsBankName) {
        setVoiceStep(4);
        setVoiceStepInput('');
        const bankPrompt = isArabic
          ? `ما اسم البنك صاحب كارت الائتمان؟ مثل ${getBankNamesHint()}`
          : `Which bank is the credit card from? e.g. ${getBankNamesHint()}`;
        setVoiceStepPrompt(bankPrompt);
        setVoiceStepPlaceholder(isArabic ? 'تحدث أو اكتب اسم البنك (مثال: العربي، أجريكول)' : 'Say or type bank name');
        speakWizardAndListen(bankPrompt, 5000);
        return;
      }

      let finalPm = paymentMethod;
      if (parsed.paymentMethod || parsed.matchedPaymentMethod?.id) {
        finalPm = parsed.paymentMethod || parsed.matchedPaymentMethod.id;
        setPaymentMethod(finalPm);
      }
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      setVoiceStep(0);
      setVoiceStepInput('');
      setVoiceListenTarget(null);
      const pmObj = pmList.find((p) => p.id === finalPm);
      const pmName = isArabic ? (pmObj?.shortNameAr || pmObj?.nameAr || 'كاش') : (pmObj?.shortName || pmObj?.name || 'Cash');
      const catObj = categoriesList.find((c) => c.id === categoryId);
      const cName = isArabic ? (catObj?.nameAr || catObj?.name || 'مصروف') : (catObj?.name || 'expense');

      const numAmt = parseFloat(amount);
      if (numAmt > 0) {
        const finalMsg = isArabic
          ? `تم بنجاح! تم حفظ ${numAmt} ${currency.symbol} لبند ${cName} عبر ${pmName}.`
          : `Saved! ${numAmt} ${currency.symbol} for ${cName} via ${pmName}.`;
        speakText(finalMsg, { language: isArabic ? 'ar' : 'en' });

        await addTransaction({
          type: 'expense',
          amount: numAmt,
          categoryId: categoryId,
          note: note || (isArabic ? `تسجيل صوتي: ${cName}` : `Voice entry: ${cName}`),
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: finalPm,
        });
        onClose();
      } else {
        const finalMsg = isArabic
          ? `تم تجهيز بند ${cName} وطريقة الدفع ${pmName}.`
          : `Ready! Selected ${cName} and ${pmName}.`;
        speakText(finalMsg, { language: isArabic ? 'ar' : 'en' });
      }
    } else if (voiceStep === 4) {
      // Step 4: Credit card bank name
      const matchedCard = matchCreditCardByBankName(inputVal, pmList);
      if (!matchedCard) {
        const retryPrompt = isArabic
          ? `لم أتعرف على اسم البنك. من فضلك قل اسم البنك مثل ${getBankNamesHint()}`
          : `Bank not recognized. Please say the bank name like ${getBankNamesHint()}`;
        setVoiceStepPrompt(retryPrompt);
        setVoiceStepInput('');
        speakWizardAndListen(retryPrompt, 5000);
        return;
      }

      const finalPm = matchedCard.id;
      setPaymentMethod(finalPm);
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      setVoiceStep(0);
      setVoiceStepInput('');
      setVoiceListenTarget(null);

      const pmObj = pmList.find((p) => p.id === finalPm) || matchedCard;
      const pmName = isArabic ? (pmObj?.shortNameAr || pmObj?.nameAr || finalPm) : (pmObj?.shortName || pmObj?.name || finalPm);
      const catObj = categoriesList.find((c) => c.id === categoryId);
      const cName = isArabic ? (catObj?.nameAr || catObj?.name || 'مصروف') : (catObj?.name || 'expense');

      const numAmt = parseFloat(amount);
      if (numAmt > 0) {
        const finalMsg = isArabic
          ? `تم بنجاح! تم حفظ ${numAmt} ${currency.symbol} لبند ${cName} عبر كارت ${pmName}.`
          : `Saved! ${numAmt} ${currency.symbol} for ${cName} via ${pmName}.`;
        speakText(finalMsg, { language: isArabic ? 'ar' : 'en' });

        await addTransaction({
          type: 'expense',
          amount: numAmt,
          categoryId: categoryId,
          note: note || (isArabic ? `تسجيل صوتي: ${cName}` : `Voice entry: ${cName}`),
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: finalPm,
        });
        onClose();
      } else {
        const finalMsg = isArabic
          ? `تم اختيار كارت ${pmName}.`
          : `Selected ${pmName}.`;
        speakText(finalMsg, { language: isArabic ? 'ar' : 'en' });
      }
    }
  };

  onVoiceResultRef.current = (spokenText) => {
    if (voiceTargetRef.current === 'oneLine') {
      handleExecuteOneLineVoice(spokenText);
    } else if (voiceTargetRef.current === 'wizard') {
      handleAdvanceVoiceStep(spokenText);
    }
  };

  const handleCreateCategory = async () => {
    const clean = (newCatName || '').trim();
    if (!clean) {
      Alert.alert(isArabic ? 'تنبيه' : 'Alert', isArabic ? 'يرجى كتابة اسم البند' : 'Please enter category name');
      return;
    }
    const colors = ['#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#10B981', '#6366F1'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];
    const created = await addCustomCategory({
      name: clean,
      nameAr: clean,
      icon: 'tag-outline',
      color: chosenColor,
      bgColor: chosenColor + '20',
    });
    if (created) {
      setCategoryId(created.id);
    }
    setNewCatName('');
    setNewCatModalVisible(false);
  };

  const handleDeleteCategoryPrompt = (cat) => {
    Alert.alert(
      isArabic ? 'حذف البند نهائياً' : 'Delete Category',
      isArabic
        ? `هل تريد حذف بند «${cat.nameAr || cat.name}» نهائياً من قائمة المصروفات؟`
        : `Delete category "${cat.name}" permanently?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'نعم، حذف البند' : 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            if (categoryId === cat.id) {
              const remaining = (allExpenseCategories || EXPENSE_CATEGORIES).filter((c) => c.id !== cat.id);
              if (remaining.length > 0) {
                setCategoryId(remaining[0].id);
              }
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(
        isArabic ? 'مبلغ غير صحيح' : 'Invalid Amount',
        isArabic ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' : 'Please enter a valid amount greater than zero.'
      );
      return;
    }

    let txType = 'expense';
    let txCategoryId = categoryId;
    let txNote = note;

    if (mode === 'cc_pyd') {
      txType = 'cc_pyd';
      txCategoryId = 'cc_pyd';
      if (!targetCard) {
        Alert.alert(
          isArabic ? 'اختر البطاقة' : 'Select Card',
          isArabic ? 'يرجى اختيار بطاقة الائتمان المراد سدادها.' : 'Please select which credit card to pay.'
        );
        return;
      }
      if (!txNote) {
        txNote = isArabic
          ? `سداد ${selectedCardObj?.shortName || selectedCardObj?.name}`
          : `Payment ${selectedCardObj?.name}`;
      }
    } else if (mode === 'switch') {
      txType = 'switch';
      txCategoryId = 'switch';
      if (paymentMethod === toAccount) {
        Alert.alert(
          isArabic ? 'حساب مكرر' : 'Same Account',
          isArabic ? 'يرجى اختيار حسابين مختلفين للتحويل.' : 'Please choose two different accounts for transfer.'
        );
        return;
      }
    } else if (mode === 'income') {
      txType = 'income';
      if (!txCategoryId || txCategoryId === 'switch' || txCategoryId === 'cc_pyd') {
        txCategoryId = 'incomings';
      }
    } else {
      txType = 'expense';
      if (txCategoryId === 'switch') {
        txType = 'switch';
      } else if (txCategoryId === 'cc_pyd') {
        txType = 'cc_pyd';
      }
    }

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type: txType,
        amount: numericAmount,
        categoryId: txCategoryId,
        note: txNote,
        date: date || editingTransaction.date || new Date().toISOString().split('T')[0],
        paymentMethod,
        toAccount: mode === 'switch' ? toAccount : null,
        targetCard: mode === 'cc_pyd' ? targetCard : null,
      });
      onClose();
      return;
    }

    const saved = await addTransaction({
      type: txType,
      amount: numericAmount,
      categoryId: txCategoryId,
      note: txNote,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod,
      toAccount: mode === 'switch' ? toAccount : null,
      targetCard: mode === 'cc_pyd' ? targetCard : null,
    });

    onClose();

    // Category budget notification for standard expenses
    const ba = saved?.budgetAlert;
    if (ba && alertPrefs?.budgetAlertsEnabled !== false) {
      const fmt = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
      if (ba.level === 'exceeded') {
        Alert.alert(
          isArabic ? `🚨 تجاوزت ميزانية «${ba.categoryName}»` : `🚨 Budget exceeded: ${ba.categoryName}`,
          isArabic
            ? `الحد الشهري: ${fmt(ba.limit)} ${currency.symbol}\nالمصروف حتى الآن: ${fmt(ba.spent)} ${currency.symbol}\nالتجاوز: ${fmt(ba.over)} ${currency.symbol}`
            : `Monthly limit: ${fmt(ba.limit)} ${currency.symbol}\nSpent so far: ${fmt(ba.spent)} ${currency.symbol}\nOver by: ${fmt(ba.over)} ${currency.symbol}`
        );
      } else {
        Alert.alert(
          isArabic ? `⚠️ قربت من حد ميزانية «${ba.categoryName}»` : `⚠️ Near budget limit: ${ba.categoryName}`,
          isArabic
            ? `صرفت ${fmt(ba.spent)} من ${fmt(ba.limit)} ${currency.symbol} — متبقي ${fmt(ba.remaining)} ${currency.symbol}`
            : `Spent ${fmt(ba.spent)} of ${fmt(ba.limit)} ${currency.symbol} — ${fmt(ba.remaining)} ${currency.symbol} left`
        );
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={{ width: 36 }} />
            <Text style={styles.headerTitle}>
              {mode === 'cc_pyd'
                ? isArabic ? '💳 سداد بطاقة ائتمان' : '💳 Pay Credit Card'
                : mode === 'income'
                ? isArabic ? '➕ إضافة وارد / دخل' : '➕ Add Income'
                : mode === 'switch'
                ? isArabic ? '🔄 تحويل بين الحسابات' : '🔄 Transfer'
                : isArabic ? '➖ تسجيل مصروف' : '➖ Add Expense'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 4 Mode Tabs */}
            <View style={[styles.modeTabsRow, isArabic && { flexDirection: 'row-reverse' }]}>
              {/* 1. Expense Tab */}
              <TouchableOpacity
                style={[styles.modeTab, mode === 'expense' && styles.activeExpenseTab]}
                onPress={() => handleModeChange('expense')}
              >
                <MaterialCommunityIcons
                  name="arrow-top-right"
                  size={14}
                  color={mode === 'expense' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text style={[styles.modeTabText, mode === 'expense' && styles.activeModeTabText]}>
                  {isArabic ? 'مصروف' : 'Expense'}
                </Text>
              </TouchableOpacity>

              {/* 2. Pay CC Tab */}
              <TouchableOpacity
                style={[styles.modeTab, mode === 'cc_pyd' && styles.activePayCcTab]}
                onPress={() => handleModeChange('cc_pyd')}
              >
                <MaterialCommunityIcons
                  name="credit-card-check"
                  size={14}
                  color={mode === 'cc_pyd' ? '#FFFFFF' : '#059669'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'cc_pyd' && styles.activeModeTabText,
                    mode !== 'cc_pyd' && { color: '#059669', fontWeight: '800' },
                  ]}
                >
                  {isArabic ? 'سداد كارت 💳' : 'Pay CC 💳'}
                </Text>
              </TouchableOpacity>

              {/* 3. Income Tab */}
              <TouchableOpacity
                style={[styles.modeTab, mode === 'income' && styles.activeIncomeTab]}
                onPress={() => handleModeChange('income')}
              >
                <MaterialCommunityIcons
                  name="arrow-bottom-left"
                  size={14}
                  color={mode === 'income' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text style={[styles.modeTabText, mode === 'income' && styles.activeModeTabText]}>
                  {isArabic ? 'وارد' : 'Income'}
                </Text>
              </TouchableOpacity>

              {/* 4. Switch (Transfer) Tab */}
              <TouchableOpacity
                style={[styles.modeTab, mode === 'switch' && styles.activeSwitchTab]}
                onPress={() => handleModeChange('switch')}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={14}
                  color={mode === 'switch' ? '#FFFFFF' : COLORS.textSecondary}
                />
                <Text style={[styles.modeTabText, mode === 'switch' && styles.activeModeTabText]}>
                  {isArabic ? 'تحويل' : 'Transfer'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ===== MODE 1: سداد كارت ائتمان (CREDIT CARD PAYMENT) ===== */}
            {mode === 'cc_pyd' && (
              <View style={styles.ccPaymentContainer}>
                {/* Visual Banner */}
                <View style={[styles.ccPromptBanner, isArabic && { flexDirection: 'row-reverse' }]}>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#059669" />
                  <Text style={[styles.ccPromptBannerText, isArabic && { textAlign: 'right' }]}>
                    {isArabic
                      ? 'اختر بطاقة الائتمان المراد سدادها، وسيتم خصم المبلغ من حسابك وإيداعه في رصيد البطاقة فوراً.'
                      : 'Choose the credit card to pay; funds will be deducted from your account to reduce card debt immediately.'}
                  </Text>
                </View>

                {/* 1. SELECT TARGET CREDIT CARD */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic
                    ? '1. الفلوس هتدخل في أنهي بطاقة؟ (اختر البطاقة المسدد إليها 💳)'
                    : '1. Which card is receiving payment? (Target Card 💳)'}
                </Text>

                <View style={styles.targetCardsList}>
                  {availableCreditCards.map((card) => {
                    const isSelected = targetCard === card.id;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.targetCardOption,
                          {
                            borderColor: isSelected ? card.color : '#E2E8F0',
                            backgroundColor: isSelected ? card.bgColor : '#FFFFFF',
                          },
                          isSelected && styles.selectedTargetCardBox,
                        ]}
                        onPress={() => handleSelectTargetCard(card.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.targetCardTop, isArabic && { flexDirection: 'row-reverse' }]}>
                          <View style={[styles.targetCardHeaderLeft, isArabic && { flexDirection: 'row-reverse' }]}>
                            <MaterialCommunityIcons name={card.icon} size={18} color={card.color} />
                            <Text style={[styles.targetCardTitle, { color: card.color }]} numberOfLines={1}>
                              {card.name}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={[styles.checkCircle, { backgroundColor: card.color }]}>
                              <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                            </View>
                          )}
                        </View>

                        <View style={[styles.targetCardDebtRow, isArabic && { flexDirection: 'row-reverse' }]}>
                          <Text style={styles.targetCardDebtLabel}>
                            {isArabic ? 'إجمالي المديونية:' : 'Total Debt:'}
                          </Text>
                          <Text style={[styles.targetCardDebtVal, { color: card.color }]}>
                            {formatAmount(card.debt)} {currency.symbol}
                          </Text>
                        </View>

                        {card.dueThisMonth > 0 && (
                          <View style={[styles.targetCardDebtRow, isArabic && { flexDirection: 'row-reverse' }]}>
                            <Text style={styles.targetCardDueLabel}>
                              {isArabic ? 'مستحق 25/11:' : 'Due 25/11:'}
                            </Text>
                            <Text style={styles.targetCardDueVal}>
                              {formatAmount(card.dueThisMonth)} {currency.symbol}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quick Auto-Fill Buttons for Selected Card */}
                <View style={[styles.quickPayRow, isArabic && { flexDirection: 'row-reverse' }]}>
                  {selectedCardObj?.debt > 0 && (
                    <TouchableOpacity
                      style={styles.quickPayChipGreen}
                      onPress={() => setAmount(String(Math.round(selectedCardObj.debt)))}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name="lightning-bolt" size={13} color="#059669" />
                      <Text style={styles.quickPayChipGreenText}>
                        {isArabic
                          ? `كامل المديونية (${formatAmount(selectedCardObj.debt)} ${currency.symbol})`
                          : `Full Debt (${formatAmount(selectedCardObj.debt)})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedCardObj?.dueThisMonth > 0 && (
                    <TouchableOpacity
                      style={styles.quickPayChipBlue}
                      onPress={() => setAmount(String(Math.round(selectedCardObj.dueThisMonth)))}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name="calendar-alert" size={13} color="#1E40AF" />
                      <Text style={styles.quickPayChipBlueText}>
                        {isArabic
                          ? `مستحق 25/11 (${formatAmount(selectedCardObj.dueThisMonth)} ${currency.symbol})`
                          : `Due 25/11 (${formatAmount(selectedCardObj.dueThisMonth)})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. AMOUNT INPUT */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '2. المبلغ المراد سداده' : '2. Payment Amount'}
                </Text>
                <View style={[styles.amountInputContainer, { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }]}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={false}
                  />
                  <Text style={[styles.amountCurrency, { color: '#059669' }]}>{currency.symbol}</Text>
                </View>

                {/* 3. SOURCE ACCOUNT (DEDUCT FROM) */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? '3. يُخصم من أي حساب؟ (مصدر السداد 🏦)' : '3. Deduct from which account? (Source 🏦)'}
                </Text>
                <View style={[styles.paymentMethodsGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {fundingAccounts.map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    const avail =
                      pm.id === 'dc'
                        ? balances.availDc
                        : pm.id === 'csh'
                        ? balances.availCsh
                        : (balances.customDebitCardsSummary || []).find((d) => d.id === pm.id)?.avail ?? 0;

                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[
                          styles.pmChip,
                          isSelected && styles.activePmChip,
                          isArabic && { flexDirection: 'row-reverse' },
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}
                      >
                        <MaterialCommunityIcons
                          name={pm.icon || 'bank'}
                          size={18}
                          color={isSelected ? COLORS.primaryDark : COLORS.textSecondary}
                        />
                        <View style={{ alignItems: isArabic ? 'flex-end' : 'flex-start' }}>
                          <Text style={[styles.pmChipText, isSelected && styles.activePmChipText]}>
                            {isArabic ? (pm.shortNameAr || pm.nameAr) : (pm.shortName || pm.name)}
                          </Text>
                          <Text style={[styles.pmAvailSubText, isSelected && { color: COLORS.primaryDark }]}>
                            {isArabic ? `متاح: ${formatAmount(avail)}` : `Avail: ${formatAmount(avail)}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ===== MODE 2: مصروف عادي (REGULAR EXPENSE) ===== */}
            {mode === 'expense' && (
              <>
                {/* Smart Voice Dictation Card (One-Shot & Auto-Advancing Step-by-Step) */}
                <View style={styles.smartVoiceCard}>
                  <View style={[styles.smartVoiceHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                    <MaterialCommunityIcons name="microphone-outline" size={18} color="#6D28D9" />
                    <Text style={styles.smartVoiceTitle}>
                      {isArabic ? 'المساعد الصوتي الذكي (بالعامية المصرية)' : 'Smart Voice Dictation'}
                    </Text>
                    {isListeningVoice && (
                      <View style={styles.listeningPill}>
                        <Text style={styles.listeningPillText}>
                          {isArabic ? 'بيسمعك...' : 'Listening...'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* One-Shot Full Sentence Input + Live Mic */}
                  <View style={[styles.voiceStepInputRow, isArabic && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[
                        styles.voiceMicBtn,
                        isListeningVoice && voiceListenTarget === 'oneLine' && styles.voiceMicBtnActive,
                      ]}
                      onPress={() => {
                        if (isListeningVoice && voiceListenTarget === 'oneLine') {
                          stopNativeVoiceListening();
                          setIsListeningVoice(false);
                        } else {
                          beginListening('oneLine');
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name={isListeningVoice && voiceListenTarget === 'oneLine' ? 'microphone-off' : 'microphone'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.voiceStepInput, isArabic && { textAlign: 'right' }]}
                      placeholder={isArabic ? 'مثال: 100 جنيه بنزين كاش' : 'e.g. 100 petrol cash'}
                      placeholderTextColor="#94A3B8"
                      value={oneLineSentence}
                      onChangeText={setOneLineSentence}
                      onSubmitEditing={() => handleExecuteOneLineVoice()}
                    />
                    <TouchableOpacity
                      style={styles.voiceNextStepBtn}
                      onPress={() => handleExecuteOneLineVoice()}
                    >
                      <Text style={styles.voiceNextStepBtnText}>
                        {isArabic ? 'تطبيق' : 'Fill'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!!voiceLiveStatus && (
                    <Text style={[styles.voiceLiveStatusText, isArabic && { textAlign: 'right' }]}>
                      {voiceLiveStatus}
                    </Text>
                  )}

                  {/* Auto-Advancing Step-by-Step Voice Wizard */}
                  {voiceStep === 0 ? (
                    <TouchableOpacity style={styles.startWizardBtn} onPress={startVoiceWizard}>
                      <MaterialCommunityIcons name="auto-fix" size={16} color="#5B21B6" />
                      <Text style={styles.startWizardBtnText}>
                        {isArabic
                          ? 'إملاء خطوة بخطوة (يملا المبلغ ثم البند ثم الدفع تلقائياً)'
                          : 'Step-by-step Auto-Advancing Voice Wizard'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.activeVoiceStepBox}>
                      <View style={styles.stepDotsRow}>
                        {[1, 2, 3].map((stepNum, idx) => (
                          <React.Fragment key={stepNum}>
                            <View style={[styles.stepDot, voiceStep >= stepNum && styles.stepDotActive]}>
                              <Text style={styles.stepDotNum}>{stepNum}</Text>
                            </View>
                            {idx < 2 && (
                              <View style={[styles.stepLine, voiceStep > stepNum && styles.stepLineActive]} />
                            )}
                          </React.Fragment>
                        ))}
                      </View>

                      <View style={[styles.promptSpeechRow, isArabic && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity onPress={speakCurrentStepPrompt} style={styles.replaySpeechBtn}>
                          <MaterialCommunityIcons name="volume-high" size={16} color="#6D28D9" />
                        </TouchableOpacity>
                        <Text style={[styles.promptSpeechText, isArabic && { textAlign: 'right' }]}>
                          {voiceStepPrompt}
                        </Text>
                        <TouchableOpacity onPress={stopVoiceWizard}>
                          <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.voiceStepInputRow, isArabic && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity
                          style={[
                            styles.voiceMicBtn,
                            isListeningVoice && voiceListenTarget === 'wizard' && styles.voiceMicBtnActive,
                          ]}
                          onPress={() => beginListening('wizard')}
                        >
                          <MaterialCommunityIcons name="microphone" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.voiceStepInput, isArabic && { textAlign: 'right' }]}
                          placeholder={voiceStepPlaceholder}
                          placeholderTextColor="#94A3B8"
                          value={voiceStepInput}
                          onChangeText={setVoiceStepInput}
                          onSubmitEditing={() => handleAdvanceVoiceStep()}
                        />
                        <TouchableOpacity
                          style={styles.voiceNextStepBtn}
                          onPress={() => handleAdvanceVoiceStep()}
                        >
                          <Text style={styles.voiceNextStepBtnText}>
                            {voiceStep === 3 ? (isArabic ? 'حفظ' : 'Save') : (isArabic ? 'التالي' : 'Next')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Amount Input */}
                <View style={styles.amountInputContainer}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={false}
                  />
                  <Text style={styles.amountCurrency}>{currency.symbol}</Text>
                </View>

                {/* Payment Method Selector */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'طريقة الدفع / الحساب' : 'Payment Method / Account'}
                </Text>
                <View style={[styles.paymentMethodsGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {(allPaymentMethods || PAYMENT_METHODS).map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[
                          styles.pmChip,
                          isSelected && styles.activePmChip,
                          isArabic && { flexDirection: 'row-reverse' },
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}
                      >
                        <MaterialCommunityIcons
                          name={pm.icon}
                          size={18}
                          color={isSelected ? COLORS.primaryDark : COLORS.textSecondary}
                        />
                        <Text style={[styles.pmChipText, isSelected && styles.activePmChipText]}>
                          {isArabic ? (pm.shortNameAr || pm.nameAr) : (pm.shortName || pm.name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Categories Selection */}
                <View
                  style={[
                    {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    },
                    isArabic && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <Text style={[styles.sectionLabel, { marginBottom: 0 }, isArabic && { textAlign: 'right' }]}>
                    {isArabic ? 'اختر البند' : 'Select Category'}
                  </Text>
                  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
                    {/* Delete Any Category Toggle */}
                    <TouchableOpacity
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: isDeleteMode ? '#FEE2E2' : '#F1F5F9',
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isDeleteMode ? '#EF4444' : '#CBD5E1',
                        },
                        isArabic && { flexDirection: 'row-reverse' },
                      ]}
                      onPress={() => setIsDeleteMode(!isDeleteMode)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isDeleteMode ? 'check-circle' : 'trash-can-outline'}
                        size={14}
                        color={isDeleteMode ? '#DC2626' : '#64748B'}
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isDeleteMode ? '#DC2626' : '#64748B' }}>
                        {isDeleteMode ? (isArabic ? 'تم ✅' : 'Done ✅') : (isArabic ? 'حذف بنود 🗑️' : 'Delete 🗑️')}
                      </Text>
                    </TouchableOpacity>

                    {/* Add Custom Category Button */}
                    <TouchableOpacity
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: '#ECFDF5',
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#A7F3D0',
                        },
                        isArabic && { flexDirection: 'row-reverse' },
                      ]}
                      onPress={() => setNewCatModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={14} color="#059669" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>
                        {isArabic ? '+ بند جديد' : '+ New'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {isDeleteMode && (
                  <View style={[styles.deleteModeBanner, isArabic && { flexDirection: 'row-reverse' }]}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#DC2626" />
                    <Text style={[styles.deleteModeBannerText, isArabic && { textAlign: 'right' }]}>
                      {isArabic
                        ? 'انقر على أي بند من البنود لحذفه وإخفائه نهائياً من القائمة.'
                        : 'Tap any category to permanently delete and remove it from the list.'}
                    </Text>
                  </View>
                )}

                <View style={[styles.categoriesGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {(allExpenseCategories && allExpenseCategories.length > 0
                    ? allExpenseCategories
                    : EXPENSE_CATEGORIES
                  ).map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          isSelected && { borderColor: cat.color, backgroundColor: cat.bgColor },
                          isDeleteMode && { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
                        ]}
                        onPress={() => {
                          if (isDeleteMode) {
                            handleDeleteCategoryPrompt(cat);
                          } else if (cat.id === 'cc_pyd') {
                            handleModeChange('cc_pyd');
                          } else if (cat.id === 'switch') {
                            handleModeChange('switch');
                          } else {
                            setCategoryId(cat.id);
                          }
                        }}
                        onLongPress={() => handleDeleteCategoryPrompt(cat)}
                        activeOpacity={0.7}
                      >
                        {isDeleteMode && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              backgroundColor: '#DC2626',
                              borderRadius: 10,
                              padding: 2,
                              zIndex: 20,
                            }}
                          >
                            <MaterialCommunityIcons name="close" size={11} color="#FFFFFF" />
                          </View>
                        )}
                        <View
                          style={[
                            styles.catIconWrap,
                            { backgroundColor: isSelected ? cat.color : cat.bgColor },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon || 'tag-outline'}
                            size={18}
                            color={isSelected ? '#FFFFFF' : cat.color}
                          />
                        </View>
                        <Text
                          style={[
                            styles.catName,
                            isSelected && { color: cat.color, fontWeight: '700' },
                            isDeleteMode && { color: '#DC2626' },
                          ]}
                          numberOfLines={2}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.75}
                        >
                          {isArabic ? (cat.nameAr || cat.name) : cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Add New Category Card Button */}
                  <TouchableOpacity
                    style={[
                      styles.categoryCard,
                      {
                        borderStyle: 'dashed',
                        borderColor: '#059669',
                        backgroundColor: '#F0FDF4',
                      },
                    ]}
                    onPress={() => setNewCatModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: '#D1FAE5' }]}>
                      <MaterialCommunityIcons name="plus" size={18} color="#059669" />
                    </View>
                    <Text
                      style={[
                        styles.catName,
                        { color: '#059669', fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {isArabic ? '+ بند جديد' : '+ New'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ===== MODE 3: وارد / دخل (INCOME) ===== */}
            {mode === 'income' && (
              <>
                {/* Amount Input */}
                <View style={[styles.amountInputContainer, { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' }]}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={false}
                  />
                  <Text style={[styles.amountCurrency, { color: '#2563EB' }]}>{currency.symbol}</Text>
                </View>

                {/* Deposited Into */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'إلى حساب (يُودع في)' : 'Deposit Into Account'}
                </Text>
                <View style={[styles.paymentMethodsGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {fundingAccounts.map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[styles.pmChip, isSelected && styles.activePmChip]}
                        onPress={() => setPaymentMethod(pm.id)}
                      >
                        <MaterialCommunityIcons
                          name={pm.icon || 'bank'}
                          size={18}
                          color={isSelected ? COLORS.primaryDark : COLORS.textSecondary}
                        />
                        <Text style={[styles.pmChipText, isSelected && styles.activePmChipText]}>
                          {isArabic ? (pm.shortNameAr || pm.nameAr) : (pm.shortName || pm.name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Income Categories */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'نوع الوارد' : 'Income Category'}
                </Text>
                <View style={[styles.categoriesGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {INCOME_CATEGORIES.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          isSelected && { borderColor: cat.color, backgroundColor: cat.bgColor },
                        ]}
                        onPress={() => setCategoryId(cat.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.catIconWrap,
                            { backgroundColor: isSelected ? cat.color : cat.bgColor },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon}
                            size={18}
                            color={isSelected ? '#FFFFFF' : cat.color}
                          />
                        </View>
                        <Text
                          style={[
                            styles.catName,
                            isSelected && { color: cat.color, fontWeight: '700' },
                          ]}
                          numberOfLines={2}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.75}
                        >
                          {isArabic ? (cat.nameAr || cat.name) : cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ===== MODE 4: تحويل داخلي (INTERNAL TRANSFER) ===== */}
            {mode === 'switch' && (
              <>
                {/* Amount Input */}
                <View style={[styles.amountInputContainer, { borderColor: '#5EEAD4', backgroundColor: '#F0FDFA' }]}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={false}
                  />
                  <Text style={[styles.amountCurrency, { color: '#0D9488' }]}>{currency.symbol}</Text>
                </View>

                {/* From Account */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'من حساب (يُخصم من)' : 'From Account (Deduct)'}
                </Text>
                <View style={[styles.paymentMethodsGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {fundingAccounts.map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[styles.pmChip, isSelected && styles.activePmChip]}
                        onPress={() => setPaymentMethod(pm.id)}
                      >
                        <MaterialCommunityIcons
                          name={pm.icon || 'bank'}
                          size={18}
                          color={isSelected ? COLORS.primaryDark : COLORS.textSecondary}
                        />
                        <Text style={[styles.pmChipText, isSelected && styles.activePmChipText]}>
                          {isArabic ? (pm.shortNameAr || pm.nameAr) : (pm.shortName || pm.name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* To Account */}
                <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
                  {isArabic ? 'إلى حساب (يُودع في)' : 'To Account (Deposit)'}
                </Text>
                <View style={[styles.paymentMethodsGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                  {fundingAccounts.map((pm) => {
                    const isSelected = toAccount === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[styles.pmChip, isSelected && styles.activePmChip]}
                        onPress={() => setToAccount(pm.id)}
                      >
                        <MaterialCommunityIcons
                          name={pm.icon || 'bank'}
                          size={18}
                          color={isSelected ? COLORS.primaryDark : COLORS.textSecondary}
                        />
                        <Text style={[styles.pmChipText, isSelected && styles.activePmChipText]}>
                          {isArabic ? (pm.shortNameAr || pm.nameAr) : (pm.shortName || pm.name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Date Selection */}
            <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'التاريخ' : 'Date'}
            </Text>
            <View style={[styles.dateRow, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[
                  styles.quickDateBtn,
                  date === new Date().toISOString().split('T')[0] && styles.quickDateActive,
                ]}
                onPress={() => setQuickDate(0)}
              >
                <Text style={styles.quickDateText}>{isArabic ? 'اليوم' : 'Today'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => setQuickDate(1)}
              >
                <Text style={styles.quickDateText}>{isArabic ? 'أمس' : 'Yesterday'}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Note input */}
            <Text style={[styles.sectionLabel, isArabic && { textAlign: 'right' }]}>
              {isArabic ? 'الوصف / ملاحظة (اختياري)' : 'Description / Note (Optional)'}
            </Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder={
                mode === 'cc_pyd'
                  ? isArabic ? 'مثال: سداد كارت البنك العربي' : 'e.g. Arab Bank CC Payment'
                  : isArabic ? 'مثال: سوبر ماركت، صيدلية، مطعم...' : 'e.g. Supermarket, Pharmacy...'
              }
              placeholderTextColor={COLORS.textMuted}
              textAlign={isArabic ? 'right' : 'left'}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                mode === 'cc_pyd'
                  ? styles.saveCcPayBtn
                  : mode === 'income'
                  ? styles.saveIncomeBtn
                  : mode === 'switch'
                  ? styles.saveSwitchBtn
                  : styles.saveExpenseBtn,
                isArabic && { flexDirection: 'row-reverse' },
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={
                  mode === 'cc_pyd'
                    ? 'credit-card-check'
                    : mode === 'income'
                    ? 'plus-circle'
                    : mode === 'switch'
                    ? 'swap-horizontal'
                    : 'check-circle'
                }
                size={18}
                color="#FFFFFF"
                style={{ marginHorizontal: 6 }}
              />
              <Text style={styles.saveButtonText}>
                {editingTransaction
                  ? isArabic ? 'حفظ التعديلات' : 'Save Changes'
                  : mode === 'cc_pyd'
                  ? isArabic
                    ? `تأكيد سداد البطاقة (${amount || 0} ${currency.symbol})`
                    : `Confirm CC Payment (${amount || 0} ${currency.symbol})`
                  : mode === 'income'
                  ? isArabic ? 'حفظ الوارد' : 'Save Income'
                  : mode === 'switch'
                  ? isArabic ? 'تأكيد التحويل الداخلي' : 'Confirm Transfer'
                  : isArabic ? 'حفظ المصروف' : 'Save Expense'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Inline Modal for adding new custom category */}
      <Modal
        visible={newCatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNewCatModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.newCatOverlay}
        >
          <View style={styles.newCatCard}>
            <View style={[styles.newCatHeader, isArabic && { flexDirection: 'row-reverse' }]}>
              <MaterialCommunityIcons name="tag-plus" size={22} color="#059669" />
              <Text style={styles.newCatTitle}>
                {isArabic ? 'إضافة بند مصروفات مخصص 🏷️' : 'Add Custom Category 🏷️'}
              </Text>
            </View>

            <TextInput
              style={[styles.newCatInput, isArabic && { textAlign: 'right' }]}
              placeholder={isArabic ? 'اسم البند (مثال: صيانة سيارة، ألعاب، كتب...)' : 'Category name'}
              placeholderTextColor={COLORS.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus={true}
            />

            <View style={[styles.newCatActions, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.newCatBtn, styles.newCatCancelBtn]}
                onPress={() => setNewCatModalVisible(false)}
              >
                <Text style={styles.newCatCancelText}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.newCatBtn, styles.newCatSaveBtn]}
                onPress={handleCreateCategory}
              >
                <Text style={styles.newCatSaveText}>{isArabic ? 'حفظ البند' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
  },
  scrollBody: {
    padding: 18,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
    gap: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  activeExpenseTab: {
    backgroundColor: COLORS.expense,
  },
  activePayCcTab: {
    backgroundColor: '#059669',
  },
  activeIncomeTab: {
    backgroundColor: '#2563EB',
  },
  activeSwitchTab: {
    backgroundColor: '#0D9488',
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeModeTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // Credit Card Payment specific styles
  ccPaymentContainer: {
    marginBottom: 6,
  },
  ccPromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  ccPromptBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 16,
  },
  targetCardsList: {
    gap: 8,
    marginBottom: 10,
  },
  targetCardOption: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
  },
  selectedTargetCardBox: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  targetCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  targetCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetCardDebtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  targetCardDebtLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  targetCardDebtVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  targetCardDueLabel: {
    fontSize: 10.5,
    color: '#B45309',
    fontWeight: '600',
  },
  targetCardDueVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  quickPayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quickPayChipGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  quickPayChipGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  quickPayChipBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  quickPayChipBlueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
  },
  amountInput: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minWidth: 120,
  },
  amountCurrency: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginLeft: 6,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 6,
    textAlign: 'left',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  pmChip: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePmChip: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryDark,
  },
  pmChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activePmChipText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  pmAvailSubText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  categoryCard: {
    width: '31.5%',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  catName: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
  },
  quickDateActive: {
    backgroundColor: COLORS.primaryLight,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 16,
    backgroundColor: COLORS.surfaceSecondary,
  },
  saveButton: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveExpenseBtn: {
    backgroundColor: COLORS.expense,
  },
  saveCcPayBtn: {
    backgroundColor: '#059669',
  },
  saveIncomeBtn: {
    backgroundColor: '#2563EB',
  },
  saveSwitchBtn: {
    backgroundColor: '#0D9488',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Voice Assistant Styles
  voiceAssistantCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
  },
  voiceAssistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceIconPulse: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceAssistantTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  voiceAssistantSubtitle: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 2,
  },
  voiceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  voiceActionBtnActive: {
    backgroundColor: '#DC2626',
  },
  voiceActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  activeVoiceStepBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
  },
  smartVoiceCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  smartVoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  smartVoiceTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#5B21B6',
  },
  listeningPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listeningPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  voiceMicBtn: {
    backgroundColor: '#7C3AED',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMicBtnActive: {
    backgroundColor: '#EF4444',
  },
  voiceLiveStatusText: {
    fontSize: 11,
    color: '#6D28D9',
    marginBottom: 6,
    fontWeight: '600',
  },
  startWizardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  startWizardBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5B21B6',
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#7C3AED',
  },
  stepDotNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#7C3AED',
  },
  promptSpeechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
  },
  replaySpeechBtn: {
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  promptSpeechText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#5B21B6',
  },
  voiceStepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  voiceStepInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  voiceNextStepBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceNextStepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  voicePillsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  quickVoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickVoicePillSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  quickVoicePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  // Custom Category Modal Styles
  newCatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  newCatInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  newCatActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  newCatBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newCatCancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  newCatCancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  newCatSaveBtn: {
    backgroundColor: '#059669',
  },
  newCatSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  oneShotInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  oneShotInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  oneShotExecuteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  oneShotExecuteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  toggleStepByStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  toggleStepByStepText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  deleteModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  deleteModeBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  catDeleteBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    padding: 2,
    zIndex: 20,
  },
});
