import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import {
  normalizeArabicText,
  extractAmountFromText,
  parseSpokenExpense,
  createSmartVoiceDraft,
  processSmartVoiceTurn,
  handleSmartVoiceSilence,
  buildSmartVoiceConfirmation,
  createDoubleSaveGuard,
  getCreditCardsList,
  getBankAccountsList,
  matchCreditCardFromText,
  matchBankAccountFromText,
} from './smartVoiceFlow';

let Speech = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.log('expo-speech not available in current environment:', e);
}

const VoiceInputNative = NativeModules.VoiceInputModule || null;
const voiceEmitter = VoiceInputNative ? new NativeEventEmitter(VoiceInputNative) : null;

export {
  normalizeArabicText,
  extractAmountFromText,
  parseSpokenExpense,
  createSmartVoiceDraft,
  processSmartVoiceTurn,
  handleSmartVoiceSilence,
  buildSmartVoiceConfirmation,
  createDoubleSaveGuard,
  getCreditCardsList,
  getBankAccountsList,
  matchCreditCardFromText,
  matchBankAccountFromText,
};

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

export const finishNativeVoiceListening = async () => {
  if (!VoiceInputNative) return '';
  try {
    if (typeof VoiceInputNative.finishListening === 'function') {
      return await VoiceInputNative.finishListening();
    }
    await VoiceInputNative.stopListening();
    return '';
  } catch {
    return '';
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
export const speakText = (text, { language = 'ar', rate = 0.95, pitch = 1.0, onDone } = {}) => {
  if (!Speech || !Speech.speak) {
    console.log('[VoiceAssistant] Speech engine not available:', text);
    if (typeof onDone === 'function') onDone();
    return;
  }
  try {
    Speech.stop();
    let doneCalled = false;
    const triggerDone = () => {
      if (!doneCalled) {
        doneCalled = true;
        if (typeof onDone === 'function') onDone();
      }
    };
    Speech.speak(text, {
      language: language === 'ar' ? 'ar-EG' : 'en-US',
      rate,
      pitch,
      onDone: triggerDone,
      onStopped: triggerDone,
      onError: triggerDone,
    });
  } catch (err) {
    console.warn('[VoiceAssistant] speak error:', err);
    if (typeof onDone === 'function') onDone();
  }
};

export const stopSpeech = () => {
  if (Speech && Speech.stop) {
    try {
      Speech.stop();
    } catch {}
  }
};
