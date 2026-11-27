import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, LogBox, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SPLASH_SCREEN_IMAGE = require('./assets/splash-screen.jpg');

// Suppress known development-only Expo Go push notification warnings
LogBox.ignoreLogs([
  '[expo-notifications]',
  'expo-notifications',
  'Push notifications (remote notifications) are unavailable in Expo Go',
]);
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpenseProvider, useExpense } from './src/context/ExpenseContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS, NEON_GLOW } from './src/constants/theme';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [enteredPin, setEnteredPin] = useState('');
  const [showLockPassword, setShowLockPassword] = useState(false);
  const [pinError, setPinError] = useState(false);
  const {
    isLoading,
    isArabic,
    isDarkMode,
    themeColors,
    appPin,
    biometricEnabled,
    biometricHardwareAvailable,
    isAppUnlocked,
    unlockAppWithPin,
    unlockAppWithBiometrics,
    unlockAppWithDeviceCredential,
  } = useExpense();
  const insets = useSafeAreaInsets();

  const isLockRequired = Boolean(appPin || (biometricEnabled && biometricHardwareAvailable));

  React.useEffect(() => {
    if (!isLoading && isLockRequired && !isAppUnlocked && biometricEnabled && biometricHardwareAvailable) {
      const timer = setTimeout(() => {
        unlockAppWithBiometrics();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isLockRequired, isAppUnlocked, biometricEnabled, biometricHardwareAvailable]);

  if (!isLoading && isLockRequired && !isAppUnlocked) {
    const isFourDigitNumericPin = Boolean(appPin && /^\d{4}$/.test(appPin));
    const isNumericOnlySecret = Boolean(appPin && /^\d+$/.test(appPin));

    const onDigitPress = (d) => {
      const next = (enteredPin + d).slice(0, 4);
      setEnteredPin(next);
      setPinError(false);
      if (next.length === 4) {
        const ok = unlockAppWithPin(next);
        if (!ok) {
          setPinError(true);
          setEnteredPin('');
        } else {
          setEnteredPin('');
        }
      }
    };

    const handleSubmitCustomSecret = () => {
      const ok = unlockAppWithPin(enteredPin);
      if (!ok) {
        setPinError(true);
        setEnteredPin('');
      } else {
        setEnteredPin('');
        setPinError(false);
      }
    };

    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0F172A',
            padding: 24,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <StatusBar style="light" backgroundColor="#0F172A" />
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
          <MaterialCommunityIcons name={biometricEnabled && biometricHardwareAvailable ? 'fingerprint' : 'lock'} size={38} color="#FFFFFF" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginBottom: 6 }}>
          {isArabic ? 'مصروفي مؤمّن 🔒' : 'Masrofy Security Lock 🔒'}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 18, textAlign: 'center' }}>
          {pinError
            ? (isArabic ? '❌ كلمة السر / الرمز غير صحيح، حاول مرة أخرى' : '❌ Incorrect PIN / Password, try again')
            : biometricEnabled && biometricHardwareAvailable
            ? (isArabic ? 'استخدم بصمة الإصبع للدخول السريع أو كلمة سر مصروفي' : 'Use Fingerprint or your Masrofy PIN / Password to unlock')
            : (isArabic ? 'أدخل كلمة السر أو رمز الـ PIN الخاص بمصروفي للمتابعة' : 'Enter your custom Masrofy PIN / Password to continue')}
        </Text>

        {biometricEnabled && biometricHardwareAvailable && (
          <TouchableOpacity
            onPress={() => unlockAppWithBiometrics()}
            activeOpacity={0.85}
            style={{
              flexDirection: isArabic ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: themeColors.primary,
              paddingVertical: 13,
              paddingHorizontal: 26,
              borderRadius: 16,
              marginBottom: appPin ? 22 : 12,
              borderWidth: 1.5,
              borderColor: themeColors.primaryLight,
            }}
          >
            <MaterialCommunityIcons name="fingerprint" size={26} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>
              {isArabic ? 'الدخول ببصمة الإصبع 👆' : 'Unlock with Fingerprint 👆'}
            </Text>
          </TouchableOpacity>
        )}

        {appPin ? (
          isFourDigitNumericPin ? (
            <>
              <View style={{ flexDirection: 'row', gap: 14, marginBottom: 22 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: enteredPin.length > i ? themeColors.primary : '#334155',
                    }}
                  />
                ))}
              </View>
              <View style={{ width: 250, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <TouchableOpacity
                    key={k}
                    onPress={() => {
                      if (k === 'C') setEnteredPin('');
                      else if (k === '⌫') setEnteredPin((p) => p.slice(0, -1));
                      else onDigitPress(k);
                    }}
                    style={{
                      width: 68,
                      height: 56,
                      borderRadius: 16,
                      backgroundColor: '#1E293B',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#334155',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={{ width: '100%', maxWidth: 300 }}>
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <TextInput
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: pinError ? '#EF4444' : '#334155',
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    paddingLeft: isArabic ? 42 : 14,
                    paddingRight: isArabic ? 14 : 42,
                    fontSize: 16,
                    fontWeight: '700',
                    textAlign: isArabic ? 'right' : 'left',
                  }}
                  placeholder={
                    isNumericOnlySecret
                      ? (isArabic ? 'أدخل رمز PIN الخاص بمصروفي' : 'Enter Masrofy PIN')
                      : (isArabic ? 'أدخل كلمة السر الخاصة بمصروفي' : 'Enter Masrofy Password')
                  }
                  placeholderTextColor="#64748B"
                  keyboardType={isNumericOnlySecret ? 'numeric' : 'default'}
                  secureTextEntry={!showLockPassword}
                  autoCapitalize="none"
                  value={enteredPin}
                  onChangeText={(v) => {
                    setEnteredPin(v);
                    setPinError(false);
                  }}
                  onSubmitEditing={handleSubmitCustomSecret}
                />
                <TouchableOpacity
                  onPress={() => setShowLockPassword((v) => !v)}
                  style={{ position: 'absolute', top: 12, [isArabic ? 'left' : 'right']: 12, padding: 2 }}
                >
                  <MaterialCommunityIcons name={showLockPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSubmitCustomSecret}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#10B981',
                  paddingVertical: 13,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>
                  {isArabic ? 'فتح التطبيق 🔓' : 'Unlock App 🔓'}
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <TouchableOpacity
            onPress={() => unlockAppWithDeviceCredential && unlockAppWithDeviceCredential()}
            activeOpacity={0.85}
            style={{
              flexDirection: isArabic ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#1E293B',
              paddingVertical: 12,
              paddingHorizontal: 22,
              borderRadius: 14,
              marginTop: 4,
              borderWidth: 1.5,
              borderColor: '#475569',
            }}
          >
            <MaterialCommunityIcons name="dialpad" size={22} color="#E2E8F0" />
            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '800' }}>
              {isArabic ? 'الدخول بالرقم السري / قفل الهاتف 🔑' : 'Unlock with Device PIN / Password 🔑'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        );
      case 'analytics':
        return <InsightsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen onClose={() => setActiveTab('home')} />;
      default:
        return <HomeScreen onNavigateToHistory={() => setActiveTab('history')} />;
    }
  };

  const tabs = [
    {
      id: 'home',
      label: isArabic ? 'الرئيسية' : 'Home',
      icon: 'home-variant-outline',
      activeIcon: 'home-variant',
    },
    {
      id: 'analytics',
      label: isArabic ? 'التحليلات 📊' : 'Insights 📊',
      icon: 'chart-box-outline',
      activeIcon: 'chart-box',
    },
    {
      id: 'history',
      label: isArabic ? 'السجل' : 'History',
      icon: 'format-list-bulleted',
      activeIcon: 'format-list-bulleted',
    },
    {
      id: 'settings',
      label: isArabic ? 'الإعدادات' : 'Settings',
      icon: 'cog-outline',
      activeIcon: 'cog',
    },
  ];

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={isDarkMode ? themeColors.background : COLORS.background} />
      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNav,
          isArabic && { flexDirection: 'row-reverse' },
          isDarkMode && { backgroundColor: themeColors.surface, borderTopColor: themeColors.border },
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  isActive && {
                    backgroundColor: isDarkMode ? themeColors.primaryLight : (themeColors.primaryUltraLight || themeColors.primaryLight),
                    ...(isDarkMode ? { borderWidth: 1, borderColor: themeColors.border, ...NEON_GLOW.soft } : {}),
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? (isDarkMode ? themeColors.primary : themeColors.primaryDark) : (isDarkMode ? themeColors.textMuted : COLORS.textMuted)}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isDarkMode && { color: themeColors.textMuted },
                  isActive && { color: isDarkMode ? themeColors.primary : themeColors.primaryDark, fontWeight: '800' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(MaterialCommunityIcons.font);
      } catch (e) {
        console.warn('Font load error:', e);
      } finally {
        setFontsLoaded(true);
      }
    }
    prepare();
  }, []);

  React.useEffect(() => {
    if (!fontsLoaded) return;
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, splashOpacity]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020B1C' }}>
      {fontsLoaded && (
        <SafeAreaProvider>
          <ExpenseProvider>
            <MainApp />
          </ExpenseProvider>
        </SafeAreaProvider>
      )}

      {showSplash && (
        <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]}>
          <StatusBar style="light" translucent backgroundColor="transparent" />
          <Image
            source={SPLASH_SCREEN_IMAGE}
            style={styles.splashFullImage}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 2,
  },
  activeIconWrap: {
    backgroundColor: COLORS.primaryLight,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeNavLabel: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020B1C',
    zIndex: 9999,
  },
  splashFullImage: {
    width: '100%',
    height: '100%',
  },
});
