import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getCategoryById } from '../constants/categories';

/**
 * Builds the standard filename requested: مصروفاتي_YYYY-MM-DD.xlsx
 */
export const buildExcelFileName = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `مصروفاتي_${dateStr}.xlsx`;
};

/**
 * Generates a full multi-sheet XLSX workbook in Base64 encoding containing ALL app records.
 */
export const generateAllRecordsExcelBase64 = ({
  transactions = [],
  archivedMonths = [],
  balances = {},
  currencySymbol = 'ج.م',
  isArabic = true,
}) => {
  const wb = XLSX.utils.book_new();

  // ==================== SHEET 1: ALL TRANSACTIONS (كافة المعاملات) ====================
  const txRows = [
    [
      'م',
      'فترة الدورة / الشهر',
      'التاريخ',
      `المبلغ (${currencySymbol})`,
      'البند / التصنيف',
      'طريقة الدفع',
      'نوع المعاملة',
      'تاريخ الاستحقاق',
      'حالة السداد',
      'الوصف والملاحظات',
    ],
  ];

  let counter = 1;

  // 1. Current month transactions
  const currentCycleStr = balances?.cycleStartDate && balances?.cycleEndDate
    ? `${balances.cycleStartDate} إلى ${balances.cycleEndDate} (الشهر الحالي)`
    : 'الشهر الحالي';

  (transactions || []).forEach((t) => {
    const cat = getCategoryById(t.categoryId, 'ar');
    const catName = cat?.displayName || t.categoryId || 'عام';
    const amt = parseFloat(t.amount) || 0;

    let pmName = t.paymentMethod || '';
    if (t.paymentMethod === 'csh') pmName = 'كاش متاح';
    else if (t.paymentMethod === 'dc') pmName = 'DC / حساب بنكي';
    else if (t.paymentMethod === 'cc_ar') pmName = 'البنك العربي (CC AR)';
    else if (t.paymentMethod === 'cc_ca') pmName = 'كريدي أجريكول (CC CA)';

    let typeStr = 'مصروف';
    if (t.type === 'income') typeStr = 'وارد / إيداع';
    else if (t.type === 'switch') typeStr = 'تحويل داخلي';
    else if (t.type === 'cc_pyd') typeStr = 'سداد بطاقة ائتمان';

    const statusStr = t.isPaid ? 'مسددة' : 'سارية';

    txRows.push([
      counter++,
      currentCycleStr,
      t.date || '',
      amt,
      catName,
      pmName,
      typeStr,
      t.dueDate || '-',
      statusStr,
      t.note || '',
    ]);
  });

  // 2. Archived months transactions
  (archivedMonths || []).forEach((arch) => {
    const archCycleStr = `${arch.cycleStartDate || ''} إلى ${arch.cycleEndDate || ''} (مؤرشف)`;
    (arch.transactions || []).forEach((t) => {
      const cat = getCategoryById(t.categoryId, 'ar');
      const catName = cat?.displayName || t.categoryId || 'عام';
      const amt = parseFloat(t.amount) || 0;

      let pmName = t.paymentMethod || '';
      if (t.paymentMethod === 'csh') pmName = 'كاش متاح';
      else if (t.paymentMethod === 'dc') pmName = 'DC / حساب بنكي';
      else if (t.paymentMethod === 'cc_ar') pmName = 'البنك العربي (CC AR)';
      else if (t.paymentMethod === 'cc_ca') pmName = 'كريدي أجريكول (CC CA)';

      let typeStr = 'مصروف';
      if (t.type === 'income') typeStr = 'وارد / إيداع';
      else if (t.type === 'switch') typeStr = 'تحويل داخلي';
      else if (t.type === 'cc_pyd') typeStr = 'سداد بطاقة ائتمان';

      const statusStr = t.isPaid ? 'مسددة' : 'سارية';

      txRows.push([
        counter++,
        archCycleStr,
        t.date || '',
        amt,
        catName,
        pmName,
        typeStr,
        t.dueDate || '-',
        statusStr,
        t.note || '',
      ]);
    });
  });

  const wsTransactions = XLSX.utils.aoa_to_sheet(txRows);
  // Column widths
  wsTransactions['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'كافة المعاملات');

  // ==================== SHEET 2: FINANCIAL SUMMARY (ملخص الأرصدة) ====================
  const summaryRows = [
    ['البيان المالي', 'القيمة', 'العملة', 'ملاحظات'],
    ['إجمالي رأس مال البداية (Total Starting Base)', balances?.totalStartedWith || 0, currencySymbol, 'السيولة المتوفرة أول الدورة'],
    ['رصيد كاش بداية (Cash Start)', balances?.startCsh || 0, currencySymbol, 'الكاش المتوفر يدوياً'],
    ['رصيد البنك بداية (DC Start)', balances?.startDc || 0, currencySymbol, 'المتوفر في حساب DC البنكي'],
    ['إجمالي الاستهلاك الفعلي (Actual Spending)', balances?.realTotalSpent || 0, currencySymbol, 'بدون احتساب التحويلات الداخلية'],
    ['إجمالي السيولة الخارجة (Total Outflow)', balances?.totalOutflow || 0, currencySymbol, 'شاملة المسحوبات وسداد الكروت'],
    ['صافي الرصيد المتبقي (بعد CC)', balances?.netAvailableAfterCards || 0, currencySymbol, 'صافي الأمان بعد خصم مديونيات الكروت'],
    ['صافي الرصيد المتواجد (No CC)', balances?.netAvailableNoCards || 0, currencySymbol, 'السيولة الفعلية في اليد والبنك'],
    ['إجمالي مديونية بطاقات الائتمان', balances?.totalCcDebt || 0, currencySymbol, 'كافة المشتريات المعلقة بالكروت'],
    ['المستحق سداده هذا الشهر من الكروت', balances?.totalCcDueThisMonth || 0, currencySymbol, 'مستحق قبل موعد الاستحقاق'],
    ['إجمالي عدد المعاملات المسجلة بالشهر الحالي', transactions?.length || 0, 'معاملة', ''],
    ['إجمالي عدد الشهور المؤرشفة', archivedMonths?.length || 0, 'شهر', ''],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 10 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص الأرصدة والسيولة');

  // ==================== SHEET 3: ARCHIVES (أرشيف الشهور السابقة) ====================
  if (archivedMonths && archivedMonths.length > 0) {
    const archRows = [
      ['م', 'تاريخ بداية الدورة', 'تاريخ نهاية الدورة', 'عدد المعاملات', 'الاستهلاك الفعلي', 'إجمالي السيولة الخارجة', 'المتبقي النهائي'],
    ];

    archivedMonths.forEach((a, i) => {
      archRows.push([
        i + 1,
        a.cycleStartDate || '-',
        a.cycleEndDate || '-',
        a.transactions?.length || 0,
        a.balancesSummary?.totalExpense || 0,
        a.balancesSummary?.totalOutflow || 0,
        a.balancesSummary?.netRemainingAfterCards || 0,
      ]);
    });

    const wsArchives = XLSX.utils.aoa_to_sheet(archRows);
    wsArchives['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsArchives, 'أرشيف الشهور');
  }

  // Generate Base64
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
};

/**
 * Option 1: Saves the .xlsx file into a phone folder chosen by the user (Downloads, Documents, etc.)
 * using Android's Storage Access Framework.
 */
export const saveExcelToChosenFolder = async ({
  transactions = [],
  archivedMonths = [],
  balances = {},
  currencySymbol = 'ج.م',
  isArabic = true,
}) => {
  const fileName = buildExcelFileName();
  const b64 = generateAllRecordsExcelBase64({
    transactions,
    archivedMonths,
    balances,
    currencySymbol,
    isArabic,
  });

  if (Platform.OS !== 'android') {
    return shareExcelFile({ transactions, archivedMonths, balances, currencySymbol, isArabic });
  }

  try {
    const SAF = FileSystem.StorageAccessFramework;
    if (!SAF || !SAF.requestDirectoryPermissionsAsync) {
      return shareExcelFile({ transactions, archivedMonths, balances, currencySymbol, isArabic });
    }

    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (!perm.granted) {
      return { success: false, cancelled: true };
    }

    const fileUri = await SAF.createFileAsync(
      perm.directoryUri,
      fileName.replace(/\.xlsx$/, ''),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await FileSystem.writeAsStringAsync(fileUri, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const location = decodeURIComponent(perm.directoryUri.split('/tree/')[1] || perm.directoryUri);
    return { success: true, fileName, location, fileUri };
  } catch (err) {
    console.error('saveExcelToChosenFolder Error:', err);
    return { success: false, error: err?.message || String(err) };
  }
};

/**
 * Option 2: Shares the .xlsx file directly via system share sheet (WhatsApp, Drive, Gmail, etc.)
 */
export const shareExcelFile = async ({
  transactions = [],
  archivedMonths = [],
  balances = {},
  currencySymbol = 'ج.م',
  isArabic = true,
}) => {
  const fileName = buildExcelFileName();
  const b64 = generateAllRecordsExcelBase64({
    transactions,
    archivedMonths,
    balances,
    currencySymbol,
    isArabic,
  });

  try {
    const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${cacheDir}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const isAvail = await Sharing.isAvailableAsync().catch(() => false);
    if (isAvail) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: isArabic ? 'مشاركة ملف إكسيل (مصروفاتي)' : 'Share Excel File',
        UTI: 'com.microsoft.excel.xlsx',
      });
      return { success: true, fileName, fileUri };
    }

    // Fallback native share
    await Share.share({
      title: fileName,
      url: fileUri,
    });
    return { success: true, fileName, fileUri };
  } catch (err) {
    console.error('shareExcelFile Error:', err);
    return { success: false, error: err?.message || String(err) };
  }
};
