let Speech = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.log('expo-speech not available in current environment:', e);
}

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
      language: language === 'ar' ? 'ar-SA' : 'en-US',
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
 * Arabic number word dictionary for smart voice parsing
 */
const ARABIC_NUMBER_WORDS = {
  'صفر': 0,
  'واحد': 1,
  'اثنين': 2,
  'تلاتة': 3,
  'ثلاثة': 3,
  'اربعة': 4,
  'أربعة': 4,
  'خمسة': 5,
  'ستة': 6,
  'سبعة': 7,
  'تمانية': 8,
  'ثمانية': 8,
  'تسعة': 9,
  'عشرة': 10,
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
  'مية': 100,
  'مائة': 100,
  'ميتين': 200,
  'مائتين': 200,
  'تلتمية': 300,
  'ثلاثمائة': 300,
  'ربعمية': 400,
  'خمسمية': 500,
  'ستمية': 600,
  'سبعمية': 700,
  'تمنمية': 800,
  'تسعمية': 900,
  'الف': 1000,
  'ألف': 1000,
  'الفين': 2000,
  'ألفين': 2000,
  'الاف': 1000,
  'آلاف': 1000,
};

/**
 * Convert spoken Arabic digits and numerals to a float
 */
export const extractAmountFromText = (input) => {
  if (!input) return null;
  const str = input.toString().trim();

  // Convert Arabic-Indic numerals (٠-٩) to Western (0-9)
  const normalized = str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  // Find direct digits
  const digitMatch = normalized.match(/(\d+(\.\d+)?)/);
  if (digitMatch) {
    return parseFloat(digitMatch[1]);
  }

  // Fallback: check words (e.g. خمسمية, خمسة آلاف)
  const words = str.split(/\s+/);
  let total = 0;
  let found = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[أإآ]/g, 'ا');
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
 * Smart Natural Language Expense Parser
 * e.g.: "5000 فواتير كاش" or "صرفت 250 صيدلية من العربي"
 */
export const parseSpokenExpense = (sentence = '') => {
  const s = sentence.toLowerCase().trim();
  const amount = extractAmountFromText(s);

  // Match category
  let categoryId = null;
  if (/طعام|اكل|أكل|سوبر|غداء|عشاء|فطار|بقالة|مطعم|food/i.test(s)) {
    categoryId = 'food';
  } else if (/فاتورة|فواتير|كهرباء|مياه|نت|واي فاي|شحن|غاز|bills/i.test(s)) {
    categoryId = 'bills';
  } else if (/مواصلات|بنزين|اوبر|أوبر|تاكسي|مترو|قطار|عربية|trns|transport/i.test(s)) {
    categoryId = 'trns';
  } else if (/صيدلية|دواء|علاج|دكتور|كشف|طبيب|تحاليل|مستشفى|mdsn/i.test(s)) {
    categoryId = 'mdsn';
  } else if (/شخصي|مصاريف شخصية|كافيه|قهوة|ترفيه|خروجة|سينما|boz/i.test(s)) {
    categoryId = 'boz';
  } else if (/صيانة|تصليح|سباك|كهربائي|سباكة|نجار|mntnns/i.test(s)) {
    categoryId = 'mntnns';
  } else if (/تسوق|هدوم|ملابس|شراء|مشتريات|misc/i.test(s)) {
    categoryId = 'misc';
  }

  // Match payment method
  let paymentMethod = null;
  if (/كاش|نقدي|نقدا|كاش متاح|cash|csh/i.test(s)) {
    paymentMethod = 'csh';
  } else if (/عربي|البنك العربي|كارت العربي|cc ar|cc_ar/i.test(s)) {
    paymentMethod = 'cc_ar';
  } else if (/اجريكول|أجريكول|كريدي|كريدى|cc ca|cc_ca/i.test(s)) {
    paymentMethod = 'cc_ca';
  } else if (/بنك|حساب|فيزا|dc|دي سي|ديبت|خصم مباشر/i.test(s)) {
    paymentMethod = 'dc';
  }

  return {
    amount,
    categoryId,
    paymentMethod,
    originalText: sentence,
  };
};
