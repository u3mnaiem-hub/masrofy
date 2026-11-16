import { NativeModules, Platform } from 'react-native';

const VoiceInputNative = NativeModules.VoiceInputModule || null;

export const isBiometricHardwareAvailable = async () => {
  if (Platform.OS !== 'android' || !VoiceInputNative || typeof VoiceInputNative.isBiometricAvailable !== 'function') {
    return false;
  }
  try {
    return await VoiceInputNative.isBiometricAvailable();
  } catch {
    return false;
  }
};

export const authenticateWithBiometrics = async (isArabic = true) => {
  if (Platform.OS !== 'android' || !VoiceInputNative || typeof VoiceInputNative.authenticateBiometric !== 'function') {
    return false;
  }
  try {
    const title = isArabic ? 'الدخول بالبصمة - مصروفي 🔒' : 'Fingerprint Login - Masrofy 🔒';
    const subtitle = isArabic
      ? 'ضع بصمة إصبعك لفتح قفل تطبيق مصروفي'
      : 'Touch the fingerprint sensor to unlock Masrofy';
    const cancelText = isArabic ? 'استخدام الرقم السري / إلغاء' : 'Use PIN / Cancel';
    const res = await VoiceInputNative.authenticateBiometric(title, subtitle, cancelText);
    return Boolean(res);
  } catch {
    return false;
  }
};

export const authenticateWithDeviceCredential = async (isArabic = true) => {
  if (Platform.OS !== 'android' || !VoiceInputNative || typeof VoiceInputNative.authenticateDeviceCredential !== 'function') {
    return false;
  }
  try {
    const title = isArabic ? 'الدخول بالرقم السري - مصروفي 🔑' : 'PIN / Password Login - Masrofy 🔑';
    const subtitle = isArabic
      ? 'أدخل الرقم السري أو النمط الخاص بهاتفك لفتح مصروفي'
      : 'Enter your device PIN, pattern, or password to unlock Masrofy';
    const res = await VoiceInputNative.authenticateDeviceCredential(title, subtitle);
    return Boolean(res);
  } catch {
    return false;
  }
};
