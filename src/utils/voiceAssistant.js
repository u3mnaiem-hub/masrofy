import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';

let Speech = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.log('expo-speech not available in current environment:', e);
}

const VoiceInputNative = NativeModules.VoiceInputModule || null;
const voiceEmitter = VoiceInputNative ? new NativeEventEmitter(VoiceInputNative) : null;

/**
 * Checks if native Android speech recognition is available.
 */
export const isVoiceInputAvailable = async () => {
  if (Platform.OS !== 'android' || !VoiceInputNative) return false;
  try {
    return await VoiceInputNative.isAvailable();
  } catch {
    return false;
  }
};

/**
 * Requests RECORD_AUDIO permission and starts native SpeechRecognizer.
 */
export const startNativeVoiceListening = async (languageCode = 'ar-EG') => {
  if (Platform.OS !== 'android' || !VoiceInputNative) {
    throw new Error('Native voice input is only supported on Android builds');
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'صلاحية الميكروفون',
      message: 'يحتاج تطبيق مصروفي إلى الميكروفون للاستماع إلى أوامر إدخال المصروفات بالصوت.',
      buttonPositive: 'سماح',
      buttonNegative: 'إلغاء',
    }
  );

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('تم رفض صلاحية الميكروفون');
  }

  return await VoiceInputNative.startListening(languageCode);
};

export const stopNativeVoiceListening = async () => {
  if (!VoiceInputNative) return false;
  try {
    return await VoiceInputNative.stopListening();
  } catch {
    return false;
  }
};

/**
 * Subscribes to native voice events: onReady, onPartial, onResult, onError, onEnd.
 * Returns an unsubscribe function.
 */
export const subscribeVoiceEvents = ({ onReady, onPartial, onResult, onError, onEnd } = {}) => {
  if (!voiceEmitter) return () => {};
  const subs = [];
  if (onReady) subs.push(voiceEmitter.addListener('VoiceInputReady', onReady));
  if (onPartial) subs.push(voiceEmitter.addListener('VoiceInputPartial', (e) => onPartial(e?.text || '')));
  if (onResult) subs.push(voiceEmitter.addListener('VoiceInputResult', (e) => onResult(e?.text || '')));
  if (onError) subs.push(voiceEmitter.addListener('VoiceInputError', (e) => onError(e || {})));
  if (onEnd) subs.push(voiceEmitter.addListener('VoiceInputEnd', onEnd));
  return () => {
    subs.forEach((s) => s.remove());
  };
};

/**
 * Speaks text using the device's native TTS engine (e.g. Samsung/Google Arabic voice).
 */
export const speakText = (text, { language = 'ar', rate = 0.95, pitch = 1.0 } = {}) => {
  if (!Speech || !Speech.speak) {
    console.log('[VoiceAssistant] Speech engine not available:', text);
    return;
  }
  try {
    Speech.stop();
    Speech.speak(text, {
      language: language === 'ar' ? 'ar-EG' : 'en-US',
      rate,
      pitch,
    });
  } catch (err) {
    console.warn('[VoiceAssistant] speak error:', err);
  }
};

export const stopSpeech = () => {
  if (Speech && Speech.stop) {
    try {
      Speech.stop();
    } catch {}
  }
};

/**
 * Egyptian & standard Arabic number word dictionary for smart voice parsing
 */
const ARABIC_NUMBER_WORDS = {
  'صفر': 0,
  'واحد': 1,
  'اتنين': 2,
  'اثنين': 2,
  'تلاته': 3,
  'تلاتة': 3,
  'ثلاثة': 3,
  'اربعه': 4,
  'اربعة': 4,
  'أربعة': 4,
  'خمسه': 5,
  'خمسة': 5,
  'سته': 6,
  'ستة': 6,
  'سبعه': 7,
  'سبعة': 7,
  'تمانيه': 8,
  'تمانية': 8,
  'ثمانية': 8,
  'تسعه': 9,
  'تسعة': 9,
  'عشره': 10,
  'عشرة': 10,
  'حداشر': 11,
  'اتناشر': 12,
  'تلتاشر': 13,
  'اربعتاشر': 14,
  'خمستاشر': 15,
  'ستاشر': 16,
  'سبعتاشر': 17,
  'تمنتاشر': 18,
  'تسعتاشر': 19,
  'عشرين': 20,
  'تلاتين': 30,
  'ثلاثين': 30,
  'اربعين': 40,
  'أربعين': 40,
  'خمسين': 50,
  'ستين': 60,
  'سبعين': 70,
  'تمانين': 80,
  'ثمانين': 80,
  'تسعين': 90,
  'ميه': 100,
  'مية': 100,
  'مائة': 100,
  'ميتين': 200,
  'مائتين': 200,
  'تلتميه': 300,
  'تلتمية': 300,
  'ثلاثمائة': 300,
  'ربعميه': 400,
  'ربعمية': 400,
  'خمسميه': 500,
  'خمسمية': 500,
  'ستميه': 600,
  'ستمية': 600,
  'سبعميه': 700,
  'سبعمية': 700,
  'تمنميه': 800,
  'تمنمية': 800,
  'تسعميه': 900,
  'تسعمية': 900,
  'الف': 1000,
  'ألف': 1000,
  'الفين': 2000,
  'ألفين': 2000,
  'الاف': 1000,
  'آلاف': 1000,
};

/**
 * Convert spoken Arabic digits, Arabic-Indic numerals, and Egyptian number words to a float
 */
export const extractAmountFromText = (input) => {
  if (!input) return null;
  const str = input.toString().trim();

  // Convert Arabic-Indic numerals (٠-٩) to Western (0-9)
  const normalized = str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  // Find direct digits
  const digitMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }

  // Fallback: check Egyptian Arabic number words (e.g. "مية وخمسين", "الف وخمسمية")
  const words = str.split(/\s+/);
  let total = 0;
  let found = false;

  for (let i = 0; i < words.length; i++) {
    let w = words[i].replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
    if (w.startsWith('و') && w.length > 2 && ARABIC_NUMBER_WORDS[w.slice(1)] !== undefined) {
      w = w.slice(1);
    }
    if (ARABIC_NUMBER_WORDS[w] !== undefined) {
      found = true;
      const val = ARABIC_NUMBER_WORDS[w];
      if (val === 1000 && total > 0 && total < 100) {
        total *= 1000;
      } else {
        total += val;
      }
    }
  }

  return found && total > 0 ? total : null;
};

/**
 * Smart Natural Language Expense Parser (Egyptian Arabic & English)
 * e.g.: "100 جنيه بنزين كاش" or "100 جنيه بنزين كريديت كارد" or "صرفت 250 صيدلية من العربي"
 */
export const parseSpokenExpense = (sentence = '', categories = [], paymentMethods = []) => {
  const raw = (sentence || '').trim();
  const s = raw.toLowerCase();
  const amount = extractAmountFromText(s);

  // 1. Match category (built-in Egyptian colloquial keywords + custom categories)
  let categoryId = null;
  if (/طعام|اكل|أكل|سوبر|سوبرماركت|سوبر ماركت|غداء|غدا|عشاء|عشا|فطار|بقالة|مطعم|كشري|فول|بيتزا|food|grocery/i.test(s)) {
    categoryId = 'food';
  } else if (/فاتورة|فواتير|كهرباء|كهربا|مياه|مايه|ميه|نت|انترنت|واي فاي|شحن|رصيد|غاز|تليفون|موبايل|bills/i.test(s)) {
    categoryId = 'bills';
  } else if (/مواصلات|بنزين|سولار|اوبر|أوبر|كريم|تاكسي|مترو|قطار|ميكروباص|عربية|عربيه|جراج|كارتة|trns|transport|petrol|fuel|gas/i.test(s)) {
    categoryId = 'trns';
  } else if (/صيدلية|صيدليه|دواء|دوا|علاج|دكتور|كشف|طبيب|تحاليل|مستشفى|مستشفي|اسنان|أسنان|mdsn|pharmacy|doctor/i.test(s)) {
    categoryId = 'mdsn';
  } else if (/شخصي|مصاريف شخصية|كافيه|قهوة|قهوه|شاي|ترفيه|خروجة|خروجه|سينما|نادي|هدية|هديه|boz|personal/i.test(s)) {
    categoryId = 'boz';
  } else if (/صيانة|صيانه|تصليح|سباك|كهربائي|سباكة|نجار|تكييف|ثلاجة|غسالة|mntnns|maintenance/i.test(s)) {
    categoryId = 'mntnns';
  } else if (/تسوق|هدوم|ملابس|لبس|شراء|مشتريات|جزمة|شنطة|مول|misc|shopping/i.test(s)) {
    categoryId = 'misc';
  }

  // Also check custom/all categories by nameAr or name
  let matchedCategory = null;
  if (Array.isArray(categories) && categories.length > 0) {
    if (categoryId) {
      matchedCategory = categories.find((c) => c.id === categoryId) || null;
    }
    if (!matchedCategory) {
      matchedCategory = categories.find((c) => {
        const ar = (c.nameAr || '').toLowerCase();
        const en = (c.name || '').toLowerCase();
        return (ar && s.includes(ar)) || (en && s.includes(en));
      }) || null;
      if (matchedCategory) {
        categoryId = matchedCategory.id;
      }
    }
  } else if (categoryId) {
    matchedCategory = { id: categoryId };
  }

  // 2. Match payment method (Egyptian colloquial + English + custom banks)
  let paymentMethod = null;
  if (/كاش|نقدي|نقدا|فلوس|في ايدي|cash|csh/i.test(s)) {
    paymentMethod = 'csh';
  } else if (/اجريكول|أجريكول|كريدي|كريدى|agricole|cc ca|cc_ca/i.test(s)) {
    paymentMethod = 'cc_ca';
  } else if (/عربي|البنك العربي|كارت العربي|كريديت|كريدت|كريديت كارد|credit|cc ar|cc_ar/i.test(s)) {
    paymentMethod = 'cc_ar';
  } else if (/فيزا|كارت|بنك|حساب|ديبت|ديبيت|خصم مباشر|انستاباي|إنستاباي|dc|debit/i.test(s)) {
    paymentMethod = 'dc';
  }

  let matchedPaymentMethod = null;
  if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
    if (paymentMethod) {
      matchedPaymentMethod = paymentMethods.find((p) => p.id === paymentMethod) || null;
    }
    if (!matchedPaymentMethod) {
      matchedPaymentMethod = paymentMethods.find((p) => {
        const ar = (p.nameAr || '').toLowerCase();
        const sar = (p.shortNameAr || '').toLowerCase();
        const en = (p.name || '').toLowerCase();
        return (ar && s.includes(ar)) || (sar && s.includes(sar)) || (en && s.includes(en));
      }) || null;
      if (matchedPaymentMethod) {
        paymentMethod = matchedPaymentMethod.id;
      }
    }
  } else if (paymentMethod) {
    matchedPaymentMethod = { id: paymentMethod };
  }

  // 3. Build a clean note by stripping filler words and numbers
  const cleanedNote = raw
    .replace(/[٠-٩\d]+(?:\.\d+)?/g, '')
    .replace(/(?:جنيه|جنية|ج\.م|صرفت|دفعت|ادفع|سجل|مصروف|من|في|على|عبر|بـ|كاش|نقدي|نقدا|كريديت كارد|كريديت|كريدت|فيزا|ديبت|بنك|كارت)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    amount,
    categoryId,
    matchedCategory,
    paymentMethod,
    matchedPaymentMethod,
    note: cleanedNote || raw,
    originalText: raw,
  };
};
