import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const buildFileName = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `U3mXpns_Backup_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;
};

/**
 * Saves a full JSON backup into a folder the user picks on the phone
 * (Downloads, Documents, SD card, Google Drive folder, etc.) via Android's Storage Access Framework.
 * Returns { ok, success, fileName, location } or { ok: false, success: false, cancelled } / { ok: false, error }.
 */
export const saveBackupToChosenFolder = async (payload) => {
  const fileName = buildFileName();
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS !== 'android') {
    return shareBackupFile(payload);
  }

  try {
    const SAF = FileSystem.StorageAccessFramework;
    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (!perm.granted) {
      return { ok: false, success: false, cancelled: true };
    }
    const fileUri = await SAF.createFileAsync(
      perm.directoryUri,
      fileName.replace(/\.json$/, ''),
      'application/json'
    );
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const location = decodeURIComponent(perm.directoryUri.split('/tree/')[1] || perm.directoryUri);
    return { ok: true, success: true, fileName, location };
  } catch (e) {
    return { ok: false, success: false, error: e?.message || String(e) };
  }
};

/**
 * Writes the backup to app cache then opens the Android share sheet
 * (send to WhatsApp, Gmail, Google Drive, Telegram, Files, etc.).
 */
export const shareBackupFile = async (payload) => {
  const fileName = buildFileName();
  try {
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { ok: false, success: false, error: 'Sharing is not available on this device' };
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'U3mXpns Backup',
      UTI: 'public.json',
    });
    return { ok: true, success: true, fileName, location: 'share' };
  } catch (e) {
    return { ok: false, success: false, error: e?.message || String(e) };
  }
};

/**
 * Lets the user pick a previously saved U3mXpns backup JSON file and returns the parsed content.
 * Uses a resilient multi-strategy reader (fetch -> FileSystem -> SAF) to handle any URI type on Android.
 */
export const pickAndReadBackupFile = async () => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', 'text/*', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) {
      return { ok: false, success: false, cancelled: true };
    }

    const asset = res.assets[0];
    let content = null;
    let readError = null;

    // Strategy 1: Read via fetch (works seamlessly with content:// and file:// URIs on Android)
    try {
      const response = await fetch(asset.uri);
      if (response.ok || response.status === 0 || response.status === 200) {
        content = await response.text();
      }
    } catch (err) {
      readError = err;
    }

    // Strategy 2: FileSystem.readAsStringAsync
    if (!content) {
      try {
        content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (err) {
        readError = err;
      }
    }

    // Strategy 3: StorageAccessFramework on Android
    if (!content && Platform.OS === 'android' && FileSystem.StorageAccessFramework?.readAsStringAsync) {
      try {
        content = await FileSystem.StorageAccessFramework.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (err) {
        readError = err;
      }
    }

    if (!content) {
      return {
        ok: false,
        success: false,
        error: readError?.message || 'تعذر قراءة محتوى الملف المختار من الذاكرة',
      };
    }

    // Clean content (strip UTF-8 BOM if present)
    let cleanContent = content.trim();
    if (cleanContent.charCodeAt(0) === 0xFEFF) {
      cleanContent = cleanContent.slice(1);
    }

    let parsed = null;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (jsonErr) {
      return {
        ok: false,
        success: false,
        error: 'الملف المختار ليس بصيغة JSON صالحة (تأكد من اختيار ملف النسخة الاحتياطية .json الصحيح)',
      };
    }

    const dataObj = parsed?.data || parsed;
    const isValid =
      Array.isArray(parsed) ||
      (typeof dataObj === 'object' &&
        dataObj !== null &&
        (Array.isArray(dataObj.transactions) ||
          dataObj.startBalances ||
          dataObj.cycleStartDate ||
          Array.isArray(dataObj.archivedMonths)));

    if (!isValid) {
      return {
        ok: false,
        success: false,
        error: 'الملف المختار لا يحتوي على بيانات نسخ احتياطي صالحة لمصروفي',
      };
    }

    return {
      ok: true,
      success: true,
      payload: parsed,
      parsed,
      fileName: asset.name || 'backup.json',
    };
  } catch (e) {
    return {
      ok: false,
      success: false,
      error: e?.message || String(e),
    };
  }
};
