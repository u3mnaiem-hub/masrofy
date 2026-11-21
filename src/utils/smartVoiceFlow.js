/**
 * Pure, dependency-free Egyptian Arabic Smart Voice Expense parser, multi-turn state machine,
 * and budget blink threshold helpers.
 * - 100% local rule-based (zero external LLM/API calls, zero API keys).
 * - Dynamically matches ALL categories from the database (built-in + custom, e.g. متفرقات، إصلاحات).
 * - NEVER guesses or defaults payment method to cash.
 * - Requires all 3 slots (amount, category, paymentMethod) before saving.
 * - Protects against duplicate saves when speech callbacks fire twice.
 */

// TASK 1: Budget percentage blink constants (kept in one place)
export const BUDGET_BLINK_THRESHOLD_PERCENT = 75;
export const BUDGET_BLINK_DURATION_MS = 5000;

export const shouldBlinkBudgetPercentage = (percentValue, reduceMotionEnabled = false) => {
  if (reduceMotionEnabled) return false;
  const num = parseFloat(percentValue) || 0;
  return num > BUDGET_BLINK_THRESHOLD_PERCENT;
};

export const isBudgetPercentageAboveThreshold = (percentValue) => {
  const num = parseFloat(percentValue) || 0;
  return num > BUDGET_BLINK_THRESHOLD_PERCENT;
};

// TASK 2.3: Speech recognition timing & locale constants (kept in one place)
export const VOICE_RECOGNITION_CONFIG = {
  LOCALE_PRIMARY: 'ar-EG',
  LOCALE_FALLBACK: 'ar',
  EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3500,
  EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
  EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 5000,
  MAX_SILENCE_RETRIES: 2,
  SERVER_DISCONNECTED_RETRY_DELAY_MS: 600,
  ERROR_SERVER_DISCONNECTED: 11,
};

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
  'مائه': 100,
  'ميتين': 200,
  'مائتين': 200,
  'تلتميه': 300,
  'تلتمية': 300,
  'ثلاثمائة': 300,
  'ثلاثمائه': 300,
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
  'نص': 0.5,
  'نصف': 0.5,
  'ربع': 0.25,
};

export const normalizeArabicText = (input = '') => {
  return String(input || '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
};

export const stripArabicDefiniteArticle = (word = '') => {
  const w = normalizeArabicText(word).toLowerCase();
  if (w.length > 3 && w.startsWith('ال')) {
    return w.slice(2);
  }
  if (w.length > 4 && (w.startsWith('بال') || w.startsWith('وال') || w.startsWith('كال') || w.startsWith('لال'))) {
    return w.slice(3);
  }
  return w;
};

export const extractAmountFromText = (input) => {
  if (!input) return null;
  const str = String(input).trim();
  const normalized = str
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

  const digitMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[1]);
    return val > 0 ? val : null;
  }

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
 * Egyptian dialect & colloquial synonyms mapped to built-in category IDs.
 * Combined dynamically with ALL categories loaded from the database (built-in + custom).
 */
const CATEGORY_SYNONYMS_BY_ID = {
  food: [
    'طعام', 'اكل', 'بقاله', 'سوبر', 'سوبرماركت', 'سوبر ماركت', 'غداء', 'غدا',
    'عشاء', 'عشا', 'فطار', 'مطعم', 'كشري', 'فول', 'بيتزا', 'عيش', 'خضار',
    'فاكهه', 'لحمه', 'فراخ', 'سمك', 'لبن', 'جبنه', 'مقاضي', 'طلبات', 'دليفري',
    'food', 'grocery', 'groceries', 'supermarket', 'restaurant',
  ],
  bills: [
    'فاتوره', 'فواتير', 'مرافق', 'كهرباء', 'كهربا', 'مياه', 'مايه', 'الميه',
    'نت', 'انترنت', 'واي فاي', 'شحن', 'رصيد', 'باقه', 'غاز', 'تليفون',
    'موبايل', 'اشتراك', 'ايجار', 'أرضي', 'ارضي', 'ودافون', 'فودافون', 'اتصالات', 'وي', 'اورنج',
    'bills', 'utilities', 'electricity', 'water', 'internet',
  ],
  trns: [
    'مواصلات', 'انتقالات', 'بنزين', 'سولار', 'وقود', 'اوبر', 'كريم', 'ديدي',
    'اندرايف', 'تاكسي', 'مترو', 'قطار', 'قطر', 'ميكروباص', 'اتوبيس', 'عربيه',
    'سياره', 'جراج', 'ركنه', 'كارته', 'زيت', 'كاوتش',
    'trns', 'transport', 'transportation', 'petrol', 'fuel', 'gas', 'uber', 'taxi',
  ],
  mdsn: [
    'ادويه', 'دواء', 'دوا', 'علاج', 'صيدليه', 'دكتور', 'كشف', 'طبيب',
    'تحاليل', 'تحليل', 'اشعه', 'مستشفي', 'عياده', 'اسنان', 'فيتامين', 'حقنه', 'برشام',
    'mdsn', 'medical', 'pharmacy', 'medicine', 'doctor', 'hospital',
  ],
  personal: [
    'شخصي', 'شخصيه', 'مصاريف شخصيه', 'كافيه', 'قهوه', 'شاي', 'عصير',
    'ترفيه', 'خروجه', 'سينما', 'نادي', 'جيم', 'حلاقه', 'حلاق', 'كوافير', 'هديه',
    'personal', 'coffee', 'cafe', 'gym', 'entertainment',
  ],
  mntnns: [
    'صيانه', 'اصلاحات', 'اصلاح', 'تصليح', 'تصليحات', 'سباك', 'سباكه',
    'كهربائي', 'نجار', 'تكييف', 'ثلاجه', 'تلاجه', 'غساله', 'سخان', 'فني',
    'عطل', 'قطع غيار', 'ورشه', 'ميكانيكي', 'سمكري',
    'mntnns', 'maintenance', 'repairs', 'repair',
  ],
  misc: [
    'متفرقات', 'نثريات', 'متنوعه', 'متنوعات', 'اخري', 'أخرى', 'تسوق',
    'هدوم', 'ملابس', 'لبس', 'شراء', 'مشتريات', 'جزمه', 'شنطه', 'مول',
    'ادوات', 'مستلزمات', 'ورق', 'مكتبه',
    'misc', 'miscellaneous', 'other', 'shopping',
  ],
  nvn: ['nvn', 'ان في ان'],
};

const STOP_TOKENS = new Set([
  'و', 'في', 'من', 'علي', 'عن', 'الي', 'ب', 'ل', 'ك', 'مصروف', 'مصاريف',
  'بند', 'جنيه', 'جنيهات', 'ج', 'م', 'صرفت', 'دفعت', 'سجل', 'حساب', 'كارت',
  'بنك', 'كاش', 'نقدي', 'ائتمان', 'كريديت', 'ديبت', 'فيزا',
]);

/**
 * Filters a category list down to real user expense categories (excluding internal transfer/cc_pyd actions).
 */
export const getSelectableExpenseCategories = (categories = []) => {
  const list = Array.isArray(categories) ? categories : [];
  return list.filter(
    (c) =>
      c &&
      c.id !== 'switch' &&
      c.id !== 'cc_pyd' &&
      (c.type === 'expense' || !c.type)
  );
};

/**
 * Matches spoken text dynamically against ALL categories from the database (built-in + custom),
 * supporting exact match, partial token match, definite article stripping, and Egyptian dialect variants.
 */
export const matchCategoryFromText = (spokenText = '', categories = []) => {
  const selectable = getSelectableExpenseCategories(categories);
  const normSentence = normalizeArabicText(spokenText).toLowerCase();
  if (!normSentence) return null;

  const sentenceTokens = normSentence
    .split(/[^a-z0-9\u0600-\u06FF]+/i)
    .map((t) => stripArabicDefiniteArticle(t))
    .filter((t) => t && t.length >= 2 && !STOP_TOKENS.has(t));

  let bestCat = null;
  let bestScore = 0;

  // 1. Check all database categories by their dynamic nameAr / name + built-in synonyms if applicable
  const pool = selectable.length > 0
    ? selectable
    : Object.keys(CATEGORY_SYNONYMS_BY_ID).map((id) => ({ id, nameAr: id, name: id }));

  for (const cat of pool) {
    let score = 0;
    const rawAr = normalizeArabicText(cat.nameAr || '').toLowerCase();
    const rawEn = normalizeArabicText(cat.name || '').toLowerCase();

    // Exact phrase match against full category nameAr or name
    if (rawAr && rawAr.length >= 2 && normSentence.includes(rawAr)) {
      score = Math.max(score, 100 + rawAr.length);
    }
    if (rawEn && rawEn.length >= 2 && normSentence.includes(rawEn)) {
      score = Math.max(score, 95 + rawEn.length);
    }

    // Token / partial matches against category nameAr & name words (e.g., "إصلاحات" matching "صيانة وإصلاحات", "متفرقات" matching "متفرقات ونثريات", or custom categories)
    const catWords = `${rawAr} ${rawEn}`
      .split(/[^a-z0-9\u0600-\u06FF]+/i)
      .map((w) => {
        const clean = w.startsWith('و') && w.length > 3 ? w.slice(1) : w;
        return stripArabicDefiniteArticle(clean);
      })
      .filter((w) => w && w.length >= 2 && !STOP_TOKENS.has(w));

    for (const cw of catWords) {
      if (normSentence.includes(cw)) {
        score = Math.max(score, 85 + cw.length);
      }
      for (const st of sentenceTokens) {
        if (st === cw) {
          score = Math.max(score, 90 + cw.length);
        } else if (st.length >= 3 && cw.length >= 3 && (cw.includes(st) || st.includes(cw))) {
          score = Math.max(score, 75);
        }
      }
    }

    // Check Egyptian dialect synonyms if this category ID has known dialect variations
    const synonyms = CATEGORY_SYNONYMS_BY_ID[cat.id] || [];
    for (const syn of synonyms) {
      const normSyn = normalizeArabicText(syn).toLowerCase();
      const strippedSyn = stripArabicDefiniteArticle(normSyn);
      if (normSyn && normSentence.includes(normSyn)) {
        score = Math.max(score, 80 + normSyn.length);
      } else if (strippedSyn && sentenceTokens.includes(strippedSyn)) {
        score = Math.max(score, 80 + strippedSyn.length);
      } else if (
        strippedSyn.length >= 3 &&
        sentenceTokens.some((st) => st.length >= 3 && (st === strippedSyn || st.includes(strippedSyn) || strippedSyn.includes(st)))
      ) {
        score = Math.max(score, 70);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  return bestScore > 0 ? bestCat : null;
};

export const getCreditCardsList = (paymentMethods = []) => {
  const list = Array.isArray(paymentMethods) ? paymentMethods : [];
  const cards = list.filter(
    (p) =>
      p.isCredit ||
      p.accountType === 'credit' ||
      p.id === 'cc_ar' ||
      p.id === 'cc_ca' ||
      String(p.id || '').startsWith('cc_')
  );
  if (cards.length > 0) return cards;
  return [
    { id: 'cc_ar', nameAr: 'البنك العربي', shortNameAr: 'العربي', name: 'Arab Bank' },
    { id: 'cc_ca', nameAr: 'كريدي أجريكول', shortNameAr: 'أجريكول', name: 'Crédit Agricole' },
  ];
};

export const getBankAccountsList = (paymentMethods = []) => {
  const list = Array.isArray(paymentMethods) ? paymentMethods : [];
  const accounts = list.filter(
    (p) =>
      p.id === 'dc' ||
      p.accountType === 'debit' ||
      String(p.id || '').startsWith('dc_')
  );
  if (accounts.length > 0) return accounts;
  return [{ id: 'dc', nameAr: 'الحساب البنكي', shortNameAr: 'الحساب البنكي', name: 'Bank Account' }];
};

const matchOrdinalSelection = (normLower, items = []) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  if (/(?:الاول|اول|الاولاني|الاولي|اولي|رقم 1|\b1\b|first)/i.test(normLower)) {
    return items[0] || null;
  }
  if (items.length >= 2 && /(?:التاني|الثاني|تاني|ثاني|التانيه|الثانيه|رقم 2|\b2\b|second)/i.test(normLower)) {
    return items[1] || null;
  }
  if (items.length >= 3 && /(?:التالت|الثالث|تالت|ثالث|رقم 3|\b3\b|third)/i.test(normLower)) {
    return items[2] || null;
  }
  return null;
};

export const matchCreditCardFromText = (spokenText, paymentMethods = []) => {
  const normLower = normalizeArabicText(spokenText).toLowerCase();
  const cards = getCreditCardsList(paymentMethods);

  // 1. Ordinal ("الأول" / "التاني")
  const byOrdinal = matchOrdinalSelection(normLower, cards);
  if (byOrdinal) return byOrdinal;

  // 2. Built-in Egyptian names
  if (/اجريكول|كريدي|كريدى|agricole|cc ca|cc_ca/i.test(normLower)) {
    return cards.find((c) => c.id === 'cc_ca') || cards[1] || null;
  }
  if (/عربي|العربي|arab|cc ar|cc_ar/i.test(normLower)) {
    return cards.find((c) => c.id === 'cc_ar') || cards[0] || null;
  }

  // 3. Match by card name / shortName / bankName
  return (
    cards.find((c) => {
      const candidates = [c.nameAr, c.shortNameAr, c.name, c.shortName, c.bankName]
        .filter(Boolean)
        .map((x) => normalizeArabicText(x).toLowerCase());
      return candidates.some((name) => name && normLower.includes(name));
    }) || null
  );
};

export const matchBankAccountFromText = (spokenText, paymentMethods = []) => {
  const normLower = normalizeArabicText(spokenText).toLowerCase();
  const accounts = getBankAccountsList(paymentMethods);

  const byOrdinal = matchOrdinalSelection(normLower, accounts);
  if (byOrdinal) return byOrdinal;

  const byName = accounts.find((a) => {
    const candidates = [a.nameAr, a.shortNameAr, a.name, a.shortName, a.bankName]
      .filter(Boolean)
      .map((x) => normalizeArabicText(x).toLowerCase());
    return candidates.some((name) => name && normLower.includes(name));
  });
  if (byName) return byName;

  if (accounts.length === 1 && /حساب|بنك|ديبت|ديبيت|خصم|انستاباي|فيزا|debit|bank|dc/i.test(normLower)) {
    return accounts[0];
  }
  return null;
};

/**
 * Local rule-based Egyptian Arabic & English expense parser.
 * Dynamically uses ALL categories passed from the database.
 * NEVER guesses or defaults paymentMethod to cash — returns paymentStatus: 'missing' if omitted.
 */
export const parseSpokenExpense = (sentence = '', categories = [], paymentMethods = []) => {
  const raw = String(sentence || '').trim();
  const norm = normalizeArabicText(raw);
  const s = norm.toLowerCase();
  const amount = extractAmountFromText(raw);

  // 1. Dynamically match category against ALL categories in the database
  const matchedCategory = matchCategoryFromText(raw, categories);
  const categoryId = matchedCategory ? matchedCategory.id : null;

  // 2. Match payment method — NEVER assume cash!
  let paymentMethod = null;
  let matchedPaymentMethod = null;
  let paymentStatus = 'missing'; // 'resolved' | 'missing' | 'needs_credit_card' | 'needs_bank_account'
  let needsBankName = false;

  const bankAccounts = getBankAccountsList(paymentMethods);

  // Explicit cash
  if (/كاش|نقدي|نقدا|فلوس|محفظه|في ايدي|cash|\bcsh\b/i.test(s)) {
    paymentMethod = 'csh';
    paymentStatus = 'resolved';
    matchedPaymentMethod =
      (Array.isArray(paymentMethods) && paymentMethods.find((p) => p.id === 'csh')) || {
        id: 'csh',
        nameAr: 'كاش',
        shortNameAr: 'كاش',
        name: 'Cash',
      };
  } else {
    // Explicit specific credit card (Arab Bank, Credit Agricole, or custom CC)
    const explicitCard = matchCreditCardFromText(raw, paymentMethods);
    const mentionsGenericCredit =
      /كريديت|كريدت|كريديت كارد|كارت ائتمان|كارت ايتمان|كارت الائتمان|كارت اتمان|بطاقه ائتمان|بطاقه ايتمان|ائتمان|ايتمان|اتمان|credit card|credit/i.test(s);
    const mentionsBankOrDebit =
      /حساب بنكي|حساب البنك|الحساب البنكي|من البنك|بنكي|حساب|بنك|ديبت|ديبيت|خصم مباشر|انستاباي|فيزا|\bdc\b|debit|bank/i.test(
        s
      );

    if (explicitCard && !/الاول|التاني|الثاني|\b1\b|\b2\b/.test(s)) {
      paymentMethod = explicitCard.id;
      matchedPaymentMethod = explicitCard;
      paymentStatus = 'resolved';
    } else if (mentionsGenericCredit) {
      paymentMethod = null;
      paymentStatus = 'needs_credit_card';
      needsBankName = true;
    } else if (mentionsBankOrDebit) {
      const explicitBank = matchBankAccountFromText(raw, paymentMethods);
      if (
        explicitBank &&
        (bankAccounts.length === 1 ||
          explicitBank.id !== 'dc' ||
          /dc|ديبت|انستاباي|الحساب البنكي|حساب بنكي/.test(s))
      ) {
        if (bankAccounts.length > 1) {
          // Only resolve if user explicitly named one of the bank accounts
          const named = bankAccounts.find((a) => {
            const names = [a.bankName, a.shortNameAr, a.nameAr, a.name]
              .filter(Boolean)
              .map((n) => normalizeArabicText(n).toLowerCase());
            return names.some(
              (n) => n && n !== 'حساب بنكي' && n !== 'dc / حساب بنكي' && n !== 'الحساب البنكي' && s.includes(n)
            );
          });
          if (named) {
            paymentMethod = named.id;
            matchedPaymentMethod = named;
            paymentStatus = 'resolved';
          } else {
            paymentMethod = null;
            paymentStatus = 'needs_bank_account';
          }
        } else {
          paymentMethod = explicitBank.id;
          matchedPaymentMethod = explicitBank;
          paymentStatus = 'resolved';
        }
      } else if (bankAccounts.length > 1) {
        paymentMethod = null;
        paymentStatus = 'needs_bank_account';
      } else {
        paymentMethod = bankAccounts[0].id;
        matchedPaymentMethod = bankAccounts[0];
        paymentStatus = 'resolved';
      }
    } else if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      // Check custom payment methods by exact bankName
      const customMatch = paymentMethods.find((p) => {
        const b = normalizeArabicText(p.bankName || '').toLowerCase();
        return b && b.length >= 3 && s.includes(b);
      });
      if (customMatch) {
        paymentMethod = customMatch.id;
        matchedPaymentMethod = customMatch;
        paymentStatus = 'resolved';
      }
    }
  }

  // 3. Clean note
  const cleanedNote = raw
    .replace(/[٠-٩۰-۹\d]+(?:\.\d+)?/g, '')
    .replace(
      /(?:جنيه|جنية|ج\.م|صرفت|دفعت|ادفع|سجل|مصروف|من|في|على|عبر|بـ|كاش|نقدي|نقدا|كريديت كارد|كريديت|كريدت|كارت ائتمان|بطاقة ائتمان|ائتمان|حساب بنكي|الحساب البنكي|فيزا|ديبت|ديبيت|انستاباي|إنستاباي|بنك|كارت|العربي|أجريكول|اجريكول|كريدي)/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  return {
    amount,
    categoryId,
    matchedCategory,
    paymentMethod,
    matchedPaymentMethod,
    paymentStatus,
    needsBankName,
    note: cleanedNote || '',
    originalText: raw,
  };
};

export const createSmartVoiceDraft = () => ({
  amount: null,
  categoryId: null,
  categoryName: null,
  paymentMethod: null,
  paymentMethodName: null,
  note: '',
  awaitingSlot: null, // null | 'amount' | 'category' | 'payment_method' | 'credit_card' | 'bank_account'
  unclearCount: 0,
  lastQuestion: '',
});

const getCategoryDisplayName = (categoryId, categories = []) => {
  const found = (categories || []).find((c) => c.id === categoryId);
  return found?.nameAr || found?.name || 'مصروف';
};

const getPaymentDisplayName = (paymentMethodId, paymentMethods = []) => {
  if (paymentMethodId === 'csh') return 'الكاش';
  if (paymentMethodId === 'dc') return 'الحساب البنكي';
  const found = (paymentMethods || []).find((p) => p.id === paymentMethodId);
  if (found) {
    const label = found.shortNameAr || found.nameAr || found.bankName || found.name;
    if (found.isCredit || found.accountType === 'credit' || String(paymentMethodId).startsWith('cc_')) {
      return `كارت ${label}`;
    }
    return label;
  }
  return paymentMethodId || '';
};

export const buildSmartVoiceConfirmation = ({
  amount,
  categoryName,
  paymentMethodName,
  currencySymbol = 'جنيه',
  autoSaved = true,
}) => {
  const base = `ماشي، ${amount} ${currencySymbol} ${categoryName} من ${paymentMethodName}`;
  return autoSaved ? `${base}، تم الحفظ` : `${base}، راجع البيانات واضغط حفظ`;
};

/**
 * Builds the short Egyptian Arabic question for a missing slot.
 * When category is missing/unclear, dynamically offers ALL real expense categories from the database!
 */
export const buildQuestionForSlot = (slot, paymentMethods = [], categories = []) => {
  switch (slot) {
    case 'amount':
      return 'كام المبلغ؟';
    case 'category': {
      const selectable = getSelectableExpenseCategories(categories);
      if (selectable.length > 0) {
        const allNames = selectable
          .map((c) => c.nameAr || c.name)
          .filter(Boolean)
          .join('، أو ');
        return `إيه البند؟ البنود المتاحة: ${allNames}؟`;
      }
      return 'إيه البند؟';
    }
    case 'payment_method':
      return 'كاش ولا حساب بنكي ولا كارت ائتمان؟';
    case 'credit_card': {
      const cards = getCreditCardsList(paymentMethods);
      const names = cards
        .map((c) => c.shortNameAr || c.nameAr || c.bankName || c.name)
        .join(' ولا ');
      return `أنهي كارت؟ ${names}؟`;
    }
    case 'bank_account': {
      const accounts = getBankAccountsList(paymentMethods);
      const names = accounts
        .map((a) => a.shortNameAr || a.nameAr || a.bankName || a.name)
        .join(' ولا ');
      return `أنهي حساب بنكي؟ ${names}؟`;
    }
    default:
      return 'ممكن توضح تاني؟';
  }
};

/**
 * Processes one spoken turn in Smart Voice Mode.
 * Returns:
 * - { status: 'complete', draft, confirmationText }
 * - { status: 'ask', draft, question }
 * - { status: 'cancelled', draft, message }
 */
export const processSmartVoiceTurn = ({
  draft,
  spokenText,
  categories = [],
  paymentMethods = [],
  currencySymbol = 'جنيه',
  autoSaveEnabled = true,
}) => {
  const next = { ...(draft || createSmartVoiceDraft()) };
  const raw = String(spokenText || '').trim();
  const normLower = normalizeArabicText(raw).toLowerCase();

  // Explicit cancel command
  if (/^(?:الغي|الغاء|كنسل|بلاش|لا خلاص|cancel)$/i.test(normLower)) {
    return {
      status: 'cancelled',
      draft: createSmartVoiceDraft(),
      message: 'تم الإلغاء بدون حفظ.',
    };
  }

  let resolvedCurrentSlot = false;

  if (next.awaitingSlot === 'credit_card') {
    const card = matchCreditCardFromText(raw, paymentMethods);
    if (card) {
      next.paymentMethod = card.id;
      next.paymentMethodName = getPaymentDisplayName(card.id, paymentMethods);
      next.awaitingSlot = null;
      next.unclearCount = 0;
      resolvedCurrentSlot = true;
    }
  } else if (next.awaitingSlot === 'bank_account') {
    const account = matchBankAccountFromText(raw, paymentMethods);
    if (account) {
      next.paymentMethod = account.id;
      next.paymentMethodName = getPaymentDisplayName(account.id, paymentMethods);
      next.awaitingSlot = null;
      next.unclearCount = 0;
      resolvedCurrentSlot = true;
    }
  } else if (next.awaitingSlot === 'payment_method') {
    const parsed = parseSpokenExpense(raw, categories, paymentMethods);
    if (parsed.paymentStatus === 'resolved' && parsed.paymentMethod) {
      next.paymentMethod = parsed.paymentMethod;
      next.paymentMethodName = getPaymentDisplayName(parsed.paymentMethod, paymentMethods);
      next.awaitingSlot = null;
      next.unclearCount = 0;
      resolvedCurrentSlot = true;
    } else if (parsed.paymentStatus === 'needs_credit_card') {
      const q = buildQuestionForSlot('credit_card', paymentMethods, categories);
      next.awaitingSlot = 'credit_card';
      next.unclearCount = 0;
      next.lastQuestion = q;
      return { status: 'ask', draft: next, question: q };
    } else if (parsed.paymentStatus === 'needs_bank_account') {
      const q = buildQuestionForSlot('bank_account', paymentMethods, categories);
      next.awaitingSlot = 'bank_account';
      next.unclearCount = 0;
      next.lastQuestion = q;
      return { status: 'ask', draft: next, question: q };
    }
  } else {
    // Initial full sentence OR answering missing amount/category
    const parsed = parseSpokenExpense(raw, categories, paymentMethods);

    // Only fill slots that aren't already known (or when starting fresh) so we never overwrite or re-ask
    if (parsed.amount && parsed.amount > 0 && (!next.amount || next.awaitingSlot === 'amount' || next.awaitingSlot === null)) {
      next.amount = parsed.amount;
      if (next.awaitingSlot === 'amount') resolvedCurrentSlot = true;
    }
    if (parsed.categoryId && next.awaitingSlot !== 'amount') {
      next.categoryId = parsed.categoryId;
      next.categoryName = getCategoryDisplayName(parsed.categoryId, categories);
      if (next.awaitingSlot === 'category') resolvedCurrentSlot = true;
    }
    if (parsed.note && (!next.note || next.awaitingSlot === null)) {
      next.note = parsed.note;
    }
    if (parsed.paymentStatus === 'resolved' && parsed.paymentMethod && !next.paymentMethod) {
      next.paymentMethod = parsed.paymentMethod;
      next.paymentMethodName = getPaymentDisplayName(parsed.paymentMethod, paymentMethods);
    } else if (parsed.paymentStatus === 'needs_credit_card' && !next.paymentMethod) {
      next.awaitingSlot = 'credit_card';
    } else if (parsed.paymentStatus === 'needs_bank_account' && !next.paymentMethod) {
      next.awaitingSlot = 'bank_account';
    }

    if (resolvedCurrentSlot) {
      next.awaitingSlot = null;
      next.unclearCount = 0;
    }
  }

  // If we were waiting for a specific slot and the user's answer didn't resolve it -> ask once more, then cancel
  if (
    draft?.awaitingSlot &&
    !resolvedCurrentSlot &&
    next.awaitingSlot === draft.awaitingSlot
  ) {
    if (next.unclearCount >= 1) {
      return {
        status: 'cancelled',
        draft: createSmartVoiceDraft(),
        message: 'لم أفهم الإجابة، تم الإلغاء بدون حفظ.',
      };
    }
    next.unclearCount += 1;
    const baseQ = buildQuestionForSlot(next.awaitingSlot, paymentMethods, categories);
    const repeatQ = `مفهمتش، ${baseQ}`;
    next.lastQuestion = repeatQ;
    return { status: 'ask', draft: next, question: repeatQ };
  }

  // Check if all 3 required slots are known (amount + category + paymentMethod)
  if (!next.amount) {
    const q = buildQuestionForSlot('amount', paymentMethods, categories);
    next.awaitingSlot = 'amount';
    next.lastQuestion = q;
    return { status: 'ask', draft: next, question: q };
  }
  if (!next.categoryId) {
    const q = buildQuestionForSlot('category', paymentMethods, categories);
    next.awaitingSlot = 'category';
    next.lastQuestion = q;
    return { status: 'ask', draft: next, question: q };
  }
  if (!next.paymentMethod) {
    const slot =
      next.awaitingSlot === 'credit_card' || next.awaitingSlot === 'bank_account'
        ? next.awaitingSlot
        : 'payment_method';
    const q = buildQuestionForSlot(slot, paymentMethods, categories);
    next.awaitingSlot = slot;
    next.lastQuestion = q;
    return { status: 'ask', draft: next, question: q };
  }

  // All 3 known -> complete!
  next.awaitingSlot = null;
  next.unclearCount = 0;
  next.categoryName = next.categoryName || getCategoryDisplayName(next.categoryId, categories);
  next.paymentMethodName =
    next.paymentMethodName || getPaymentDisplayName(next.paymentMethod, paymentMethods);

  const confirmationText = buildSmartVoiceConfirmation({
    amount: next.amount,
    categoryName: next.categoryName,
    paymentMethodName: next.paymentMethodName,
    currencySymbol,
    autoSaved: autoSaveEnabled,
  });

  return {
    status: 'complete',
    draft: next,
    confirmationText,
  };
};

/**
 * Handles no-answer / silence timeout during a follow-up question:
 * repeats the question ONCE, then cancels without saving.
 */
export const handleSmartVoiceSilence = (draft, paymentMethods = [], categories = []) => {
  const next = { ...(draft || createSmartVoiceDraft()) };
  if (!next.awaitingSlot) {
    return {
      status: 'cancelled',
      draft: createSmartVoiceDraft(),
      message: 'لم أسمع صوتاً، تم الإلغاء بدون حفظ.',
    };
  }
  if (next.unclearCount >= 1) {
    return {
      status: 'cancelled',
      draft: createSmartVoiceDraft(),
      message: 'لم يتم الرد، تم الإلغاء بدون حفظ.',
    };
  }
  next.unclearCount += 1;
  const q = buildQuestionForSlot(next.awaitingSlot, paymentMethods, categories);
  next.lastQuestion = q;
  return { status: 'ask', draft: next, question: q };
};

/**
 * Double-save guard: ensures a smart voice session can only trigger save once even if callbacks fire twice.
 */
export const createDoubleSaveGuard = () => {
  let saved = false;
  return {
    tryAcquire() {
      if (saved) return false;
      saved = true;
      return true;
    },
    reset() {
      saved = false;
    },
    isLocked() {
      return saved;
    },
  };
};
