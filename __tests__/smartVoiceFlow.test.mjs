import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUDGET_BLINK_THRESHOLD_PERCENT,
  BUDGET_BLINK_DURATION_MS,
  shouldBlinkBudgetPercentage,
  isBudgetPercentageAboveThreshold,
  parseSpokenExpense,
  createSmartVoiceDraft,
  processSmartVoiceTurn,
  handleSmartVoiceSilence,
  createDoubleSaveGuard,
} from '../src/utils/smartVoiceFlow.js';

// Full realistic database categories (including متفرقات، إصلاحات, and a custom category)
const ALL_DATABASE_CATEGORIES = [
  { id: 'food', nameAr: 'طعام وبقالة', name: 'Food & Groceries', type: 'expense' },
  { id: 'bills', nameAr: 'فواتير ومرافق', name: 'Bills & Utilities', type: 'expense' },
  { id: 'trns', nameAr: 'مواصلات وانتقالات', name: 'Transport', type: 'expense' },
  { id: 'mdsn', nameAr: 'أدوية وعلاج', name: 'Medical & Pharmacy', type: 'expense' },
  { id: 'personal', nameAr: 'مصاريف شخصية', name: 'Personal Expenses', type: 'expense' },
  { id: 'mntnns', nameAr: 'صيانة وإصلاحات', name: 'Maintenance & Repairs', type: 'expense' },
  { id: 'misc', nameAr: 'متفرقات ونثريات', name: 'Miscellaneous', type: 'expense' },
  { id: 'cat_custom_1', nameAr: 'مدارس ودروس', name: 'Schools & Tuition', type: 'expense', isCustom: true },
  { id: 'switch', nameAr: 'تحويل داخلي', name: 'Internal Transfer', type: 'expense' },
  { id: 'cc_pyd', nameAr: 'سداد بطاقة ائتمان', name: 'Credit Card Payment', type: 'expense' },
];

const PAYMENT_METHODS_TWO_CARDS = [
  { id: 'csh', nameAr: 'كاش', shortNameAr: 'كاش', accountType: 'cash' },
  { id: 'dc', nameAr: 'الحساب البنكي', shortNameAr: 'الحساب البنكي', accountType: 'debit' },
  { id: 'cc_ar', nameAr: 'البنك العربي', shortNameAr: 'العربي', isCredit: true, accountType: 'credit' },
  { id: 'cc_ca', nameAr: 'كريدي أجريكول', shortNameAr: 'أجريكول', isCredit: true, accountType: 'credit' },
];

const PAYMENT_METHODS_TWO_BANKS = [
  ...PAYMENT_METHODS_TWO_CARDS,
  { id: 'dc_cib', nameAr: 'حساب CIB', shortNameAr: 'CIB', bankName: 'CIB', accountType: 'debit' },
];

test('1. Full sentence with non-default category like إصلاحات or متفرقات or custom category completes in one turn', () => {
  // Test "إصلاحات"
  const repairsRes = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '250 جنيه إصلاحات حساب بنكي',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
    currencySymbol: 'جنيه',
    autoSaveEnabled: true,
  });

  assert.equal(repairsRes.status, 'complete');
  assert.equal(repairsRes.draft.amount, 250);
  assert.equal(repairsRes.draft.categoryId, 'mntnns');
  assert.equal(repairsRes.draft.paymentMethod, 'dc');
  assert.ok(repairsRes.confirmationText.includes('ماشي'));
  assert.ok(repairsRes.confirmationText.includes('250'));
  assert.ok(repairsRes.confirmationText.includes('صيانة وإصلاحات'));
  assert.ok(repairsRes.confirmationText.includes('الحساب البنكي'));
  assert.ok(repairsRes.confirmationText.includes('تم الحفظ'));

  // Test "متفرقات"
  const miscRes = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '75 جنيه متفرقات كاش',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(miscRes.status, 'complete');
  assert.equal(miscRes.draft.amount, 75);
  assert.equal(miscRes.draft.categoryId, 'misc');
  assert.equal(miscRes.draft.paymentMethod, 'csh');

  // Test custom database category ("مدارس ودروس" via partial word "دروس")
  const customRes = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '300 جنيه دروس كاش',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(customRes.status, 'complete');
  assert.equal(customRes.draft.amount, 300);
  assert.equal(customRes.draft.categoryId, 'cat_custom_1');
  assert.equal(customRes.draft.paymentMethod, 'csh');
});

test('2. Sentence without a payment method NEVER defaults to cash and asks "كاش ولا حساب بنكي ولا كارت ائتمان؟"', () => {
  const parsed = parseSpokenExpense('100 جنيه بنزين', ALL_DATABASE_CATEGORIES, PAYMENT_METHODS_TWO_CARDS);
  assert.equal(parsed.paymentMethod, null);
  assert.equal(parsed.paymentStatus, 'missing');

  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '100 جنيه بنزين',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.amount, 100);
  assert.equal(step1.draft.categoryId, 'trns');
  assert.equal(step1.draft.paymentMethod, null);
  assert.equal(step1.draft.awaitingSlot, 'payment_method');
  assert.equal(step1.question, 'كاش ولا حساب بنكي ولا كارت ائتمان؟');

  // User replies "حساب بنكي"
  const step2 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'حساب بنكي',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step2.status, 'complete');
  assert.equal(step2.draft.amount, 100);
  assert.equal(step2.draft.categoryId, 'trns');
  assert.equal(step2.draft.paymentMethod, 'dc');
});

test('3. Credit card with two cards asks which card and resolves by name or ordinal', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '200 جنيه سوبرماركت كارت ائتمان',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.awaitingSlot, 'credit_card');
  assert.ok(step1.question.includes('أنهي كارت؟'));
  assert.ok(step1.question.includes('العربي'));
  assert.ok(step1.question.includes('أجريكول'));

  // Select second card by ordinal ("التاني")
  const step2Ordinal = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'التاني',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step2Ordinal.status, 'complete');
  assert.equal(step2Ordinal.draft.paymentMethod, 'cc_ca');

  // Select first card by name ("العربي")
  const step2Name = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'العربي',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step2Name.status, 'complete');
  assert.equal(step2Name.draft.paymentMethod, 'cc_ar');
});

test('4. Unclear category asks about category and offers ALL real categories from the database (not just 3)', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '150 جنيه كاش',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.amount, 150);
  assert.equal(step1.draft.paymentMethod, 'csh');
  assert.equal(step1.draft.awaitingSlot, 'category');

  // Verify ALL selectable expense categories from the database are offered in the question
  assert.ok(step1.question.includes('طعام وبقالة'));
  assert.ok(step1.question.includes('فواتير ومرافق'));
  assert.ok(step1.question.includes('مواصلات وانتقالات'));
  assert.ok(step1.question.includes('أدوية وعلاج'));
  assert.ok(step1.question.includes('مصاريف شخصية'));
  assert.ok(step1.question.includes('صيانة وإصلاحات'));
  assert.ok(step1.question.includes('متفرقات ونثريات'));
  assert.ok(step1.question.includes('مدارس ودروس'));

  // User replies with "إصلاحات" -> completes without re-asking amount or payment method
  const step2 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'إصلاحات',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step2.status, 'complete');
  assert.equal(step2.draft.amount, 150);
  assert.equal(step2.draft.categoryId, 'mntnns');
  assert.equal(step2.draft.paymentMethod, 'csh');
});

test('5. Unclear follow-up answer asks ONCE more, then cancels without saving', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '100 جنيه بنزين',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step1.status, 'ask');

  // First unclear answer -> asks once more
  const unclear1 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'مش عارف',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(unclear1.status, 'ask');
  assert.equal(unclear1.draft.unclearCount, 1);

  // Second unclear answer -> cancels without saving
  const unclear2 = processSmartVoiceTurn({
    draft: unclear1.draft,
    spokenText: 'أي حاجة',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(unclear2.status, 'cancelled');
  assert.equal(unclear2.draft.paymentMethod, null);
});

test('6. Bank account with multiple accounts asks which bank account', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '150 جنيه فواتير حساب بنكي',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_BANKS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.awaitingSlot, 'bank_account');
  assert.ok(step1.question.includes('أنهي حساب بنكي؟'));

  const step2 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'CIB',
    categories: ALL_DATABASE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_BANKS,
  });
  assert.equal(step2.status, 'complete');
  assert.equal(step2.draft.paymentMethod, 'dc_cib');
});

test('7. Double-save protection prevents duplicate saves when callback fires twice', () => {
  const guard = createDoubleSaveGuard();
  let saveCalls = 0;

  const trySave = () => {
    if (!guard.tryAcquire()) return;
    saveCalls += 1;
  };

  trySave();
  trySave();
  assert.equal(saveCalls, 1);

  guard.reset();
  trySave();
  assert.equal(saveCalls, 2);
});

test('8. Blink threshold: above 75% blinks, 75% and below does NOT blink, and respects remove-animations accessibility setting', () => {
  assert.equal(BUDGET_BLINK_THRESHOLD_PERCENT, 75);
  assert.equal(BUDGET_BLINK_DURATION_MS, 5000);

  // 75% and below -> does NOT blink
  assert.equal(isBudgetPercentageAboveThreshold(0), false);
  assert.equal(isBudgetPercentageAboveThreshold(50), false);
  assert.equal(isBudgetPercentageAboveThreshold(74.9), false);
  assert.equal(isBudgetPercentageAboveThreshold(75), false);
  assert.equal(shouldBlinkBudgetPercentage(75, false), false);
  assert.equal(shouldBlinkBudgetPercentage(60, false), false);

  // Above 75% -> blinks when animations are enabled
  assert.equal(isBudgetPercentageAboveThreshold(75.1), true);
  assert.equal(isBudgetPercentageAboveThreshold(90), true);
  assert.equal(shouldBlinkBudgetPercentage(75.1, false), true);
  assert.equal(shouldBlinkBudgetPercentage(100, false), true);

  // When system "remove animations" (reduceMotionEnabled) is true -> skip blink (return false) while still above threshold for static highlight
  assert.equal(shouldBlinkBudgetPercentage(85, true), false);
  assert.equal(isBudgetPercentageAboveThreshold(85), true);
});
