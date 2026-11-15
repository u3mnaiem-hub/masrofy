package com.masrofy.app

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.hardware.biometrics.BiometricPrompt
import android.hardware.fingerprint.FingerprintManager
import android.os.Build
import android.os.Bundle
import android.os.CancellationSignal
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.atomic.AtomicBoolean

class VoiceInputModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechRecognizer: SpeechRecognizer? = null

    override fun getName(): String = "VoiceInputModule"

    private fun emitEvent(eventName: String, params: com.facebook.react.bridge.WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactContext))
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun startListening(languageCode: String, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                    promise.reject("UNAVAILABLE", "Speech recognition is not available on this device")
                    return@runOnUiThread
                }

                destroyRecognizer()

                val recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                speechRecognizer = recognizer

                recognizer.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        emitEvent("VoiceInputReady", Arguments.createMap())
                    }

                    override fun onBeginningOfSpeech() {}

                    override fun onRmsChanged(rmsdB: Float) {}

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        emitEvent("VoiceInputEnd", Arguments.createMap())
                    }

                    override fun onError(error: Int) {
                        val message = when (error) {
                            SpeechRecognizer.ERROR_NO_MATCH -> "لم يتم التعرف على كلام واضح، حاول مرة أخرى"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "انتهت مهلة الانتظار دون صوت"
                            SpeechRecognizer.ERROR_AUDIO -> "خطأ في تسجيل الصوت"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "يرجى منح صلاحية الميكروفون"
                            SpeechRecognizer.ERROR_NETWORK -> "خطأ في الشبكة أثناء التعرف الصوتي"
                            else -> "خطأ في التعرف الصوتي ($error)"
                        }
                        val map = Arguments.createMap().apply {
                            putInt("code", error)
                            putString("message", message)
                        }
                        emitEvent("VoiceInputError", map)
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull()?.trim() ?: ""
                        if (text.isNotEmpty()) {
                            val map = Arguments.createMap().apply {
                                putString("text", text)
                            }
                            emitEvent("VoiceInputResult", map)
                        } else {
                            val map = Arguments.createMap().apply {
                                putInt("code", SpeechRecognizer.ERROR_NO_MATCH)
                                putString("message", "لم يتم اكتشاف كلمات")
                            }
                            emitEvent("VoiceInputError", map)
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull()?.trim() ?: ""
                        if (text.isNotEmpty()) {
                            val map = Arguments.createMap().apply {
                                putString("text", text)
                            }
                            emitEvent("VoiceInputPartial", map)
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                val lang = if (languageCode.isBlank()) "ar-EG" else languageCode
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    // Give generous silence timeouts so user has plenty of time to finish speaking
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 5000L)
                }

                recognizer.startListening(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("START_ERROR", e.message ?: "Failed to start speech recognition")
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                destroyRecognizer()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun isBiometricAvailable(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                var available = false
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    @Suppress("DEPRECATION")
                    val fpManager = reactContext.getSystemService(Context.FINGERPRINT_SERVICE) as? FingerprintManager
                    @Suppress("DEPRECATION")
                    if (fpManager != null && fpManager.isHardwareDetected && fpManager.hasEnrolledFingerprints()) {
                        available = true
                    }
                    if (!available) {
                        val keyguard = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
                        if (keyguard != null && keyguard.isDeviceSecure) {
                            available = true
                        }
                    }
                }
                promise.resolve(available)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun authenticateBiometric(title: String, subtitle: String, cancelText: String, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            val settled = AtomicBoolean(false)
            fun resolveOnce(result: Boolean) {
                if (settled.compareAndSet(false, true)) {
                    promise.resolve(result)
                }
            }

            try {
                val activity = currentActivity
                if (activity == null) {
                    resolveOnce(false)
                    return@runOnUiThread
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    val executor = activity.mainExecutor
                    val cancellationSignal = CancellationSignal()
                    val promptTitle = if (title.isNotBlank()) title else "تأكيد الهوية بالبصمة"
                    val promptSub = if (subtitle.isNotBlank()) subtitle else "ضع إصبعك على مستشعر البصمة لفتح تطبيق مصروفي"
                    val negText = if (cancelText.isNotBlank()) cancelText else "إلغاء"

                    val builder = BiometricPrompt.Builder(activity)
                        .setTitle(promptTitle)
                        .setSubtitle(promptSub)
                        .setNegativeButton(negText, executor) { _, _ ->
                            resolveOnce(false)
                        }

                    val prompt = builder.build()
                    prompt.authenticate(
                        cancellationSignal,
                        executor,
                        object : BiometricPrompt.AuthenticationCallback() {
                            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                                super.onAuthenticationSucceeded(result)
                                resolveOnce(true)
                            }

                            override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                                super.onAuthenticationError(errorCode, errString)
                                resolveOnce(false)
                            }
                        }
                    )
                } else {
                    resolveOnce(false)
                }
            } catch (e: Exception) {
                resolveOnce(false)
            }
        }
    }

    private fun destroyRecognizer() {
        try {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
        } catch (_: Exception) {
        } finally {
            speechRecognizer = null
        }
    }

    override fun invalidate() {
        super.invalidate()
        UiThreadUtil.runOnUiThread { destroyRecognizer() }
    }
}
