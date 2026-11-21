import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSpokenExpense,
  createSmartVoiceDraft,
  processSmartVoiceTurn,
  handleSmartVoiceSilence,
  createDoubleSaveGuard,
} from '../src/utils/smartVoiceFlow.js';

const CATEGORIES = [
  { id: 'food', nameAr: 'طعام ومقاضي', name: 'Food' },
  { id: 'trns', nameAr: 'بنزين ومواصلات', name: 'Transport' },
  { id: 'mdsn', nameAr: 'صيدلية وعلاج', name: 'Medical' },
  { id: 'bills', nameAr: 'فواتير', name: 'Bills' },
];

const PAYMENT_METHODS_TWO_CARDS = [
  { id: 'csh', nameAr: 'كاش', shortNameAr: 'كاش', accountType: 'cash' },
  { id: 'dc', nameAr: 'الحساب البنكي', shortNameAr: 'الحساب البنكي', accountType: 'debit' },
  { id: 'cc_ar', nameAr: 'البنك العربي', shortNameAr: 'العربي', isCredit: true },
  { id: 'cc_ca', nameAr: 'كريدي أجريكول', shortNameAr: 'أجريكول', isCredit: true },
];

const PAYMENT_METHODS_TWO_BANKS = [
  ...PAYMENT_METHODS_TWO_CARDS,
  { id: 'dc_cib', nameAr: 'حساب CIB', shortNameAr: 'CIB', bankName: 'CIB', accountType: 'debit' },
];

test('1. Complete sentence with payment method completes immediately and formats Egyptian readback', () => {
  const res = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '١٠٠ جنيه بنزين من الحساب البنكي',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
    currencySymbol: 'جنيه',
    autoSaveEnabled: true,
  });

  assert.equal(res.status, 'complete');
  assert.equal(res.draft.amount, 100);
  assert.equal(res.draft.categoryId, 'trns');
  assert.equal(res.draft.paymentMethod, 'dc');
  assert.ok(res.confirmationText.includes('ماشي'));
  assert.ok(res.confirmationText.includes('100'));
  assert.ok(res.confirmationText.includes('الحساب البنكي'));
  assert.ok(res.confirmationText.includes('تم الحفظ'));
});

test('2. Missing payment method NEVER assumes cash and asks Egyptian Arabic follow-up', () => {
  const parsed = parseSpokenExpense('100 جنيه بنزين', CATEGORIES, PAYMENT_METHODS_TWO_CARDS);
  assert.equal(parsed.paymentMethod, null);
  assert.equal(parsed.paymentStatus, 'missing');

  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '100 جنيه بنزين',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.paymentMethod, null);
  assert.equal(step1.draft.awaitingSlot, 'payment_method');
  assert.equal(step1.question, 'كاش ولا حساب بنكي ولا كارت ائتمان؟');

  // User replies "كاش"
  const step2 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'كاش',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step2.status, 'complete');
  assert.equal(step2.draft.amount, 100);
  assert.equal(step2.draft.categoryId, 'trns');
  assert.equal(step2.draft.paymentMethod, 'csh');
});

test('3. Credit card with two cards asks which card and accepts card name or الأول/التاني', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '200 جنيه سوبرماركت كريديت كارد',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.awaitingSlot, 'credit_card');
  assert.ok(step1.question.includes('أنهي كارت؟'));
  assert.ok(step1.question.includes('العربي'));
  assert.ok(step1.question.includes('أجريكول'));

  // Answer with "التاني" -> selects second card (cc_ca)
  const step2Ordinal = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'التاني',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step2Ordinal.status, 'complete');
  assert.equal(step2Ordinal.draft.paymentMethod, 'cc_ca');

  // Answer with "الأول" -> selects first card (cc_ar)
  const step2First = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'الأول',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step2First.status, 'complete');
  assert.equal(step2First.draft.paymentMethod, 'cc_ar');

  // Answer by name ("العربي") -> selects cc_ar
  const step2Name = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'العربي',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step2Name.status, 'complete');
  assert.equal(step2Name.draft.paymentMethod, 'cc_ar');
});

test('4. Multiple bank accounts asks which bank account and resolves by name or ordinal', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '150 جنيه فواتير من البنك',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_BANKS,
  });

  assert.equal(step1.status, 'ask');
  assert.equal(step1.draft.awaitingSlot, 'bank_account');
  assert.ok(step1.question.includes('أنهي حساب بنكي؟'));

  const step2 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'CIB',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_BANKS,
  });

  assert.equal(step2.status, 'complete');
  assert.equal(step2.draft.paymentMethod, 'dc_cib');
});

test('5. Ambiguous/unclear answer repeats ONCE then cancels without saving', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '100 جنيه بنزين',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(step1.status, 'ask');

  // 1st unclear answer -> repeats question once
  const unclear1 = processSmartVoiceTurn({
    draft: step1.draft,
    spokenText: 'مش عارف',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(unclear1.status, 'ask');
  assert.equal(unclear1.draft.unclearCount, 1);

  // 2nd unclear answer -> cancels without saving
  const unclear2 = processSmartVoiceTurn({
    draft: unclear1.draft,
    spokenText: 'أي حاجة',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(unclear2.status, 'cancelled');
  assert.equal(unclear2.draft.paymentMethod, null);
});

test('6. Silence during follow-up repeats once then cancels without saving', () => {
  const step1 = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: '100 جنيه بنزين',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });

  const silence1 = handleSmartVoiceSilence(step1.draft, PAYMENT_METHODS_TWO_CARDS);
  assert.equal(silence1.status, 'ask');

  const silence2 = handleSmartVoiceSilence(silence1.draft, PAYMENT_METHODS_TWO_CARDS);
  assert.equal(silence2.status, 'cancelled');
});

test('7. Missing amount or missing category asks only for the missing part', () => {
  const missingAmt = processSmartVoiceTurn({
    draft: createSmartVoiceDraft(),
    spokenText: 'بنزين كاش',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(missingAmt.status, 'ask');
  assert.equal(missingAmt.draft.awaitingSlot, 'amount');
  assert.equal(missingAmt.question, 'كام المبلغ؟');

  const completed = processSmartVoiceTurn({
    draft: missingAmt.draft,
    spokenText: 'مية وخمسين',
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS_TWO_CARDS,
  });
  assert.equal(completed.status, 'complete');
  assert.equal(completed.draft.amount, 150);
  assert.equal(completed.draft.categoryId, 'trns');
  assert.equal(completed.draft.paymentMethod, 'csh');
});

test('8. Double-callback protection prevents duplicate saves', () => {
  const guard = createDoubleSaveGuard();
  let saveCalls = 0;

  const trySave = () => {
    if (!guard.tryAcquire()) return;
    saveCalls += 1;
  };

  // Simulate speech callback firing twice
  trySave();
  trySave();
  assert.equal(saveCalls, 1);

  guard.reset();
  trySave();
  assert.equal(saveCalls, 2);
});
