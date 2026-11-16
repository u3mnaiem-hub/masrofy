import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';

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
import { COLORS } from './src/constants/theme';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [enteredPin, setEnteredPin] = useState('');
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
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', padding: 24 }]}>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
          <MaterialCommunityIcons name={biometricEnabled && biometricHardwareAvailable ? 'fingerprint' : 'lock'} size={38} color="#FFFFFF" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginBottom: 6 }}>
          {isArabic ? 'مصروفي مؤمّن 🔒' : 'Masrofy Security Lock 🔒'}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 18, textAlign: 'center' }}>
          {pinError
            ? (isArabic ? '❌ الرقم السري غير صحيح، حاول مرة أخرى' : '❌ Incorrect PIN, try again')
            : biometricEnabled && biometricHardwareAvailable
            ? (isArabic ? 'استخدم بصمة الإصبع للدخول السريع أو الرقم السري' : 'Use Fingerprint or your 4-digit PIN to unlock')
            : (isArabic ? 'أدخل الرقم السري المكون من 4 أرقام للمتابعة' : 'Enter your 4-digit PIN to unlock')}
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
        return <SettingsScreen />;
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
    <View style={[styles.container, isDarkMode && { backgroundColor: '#0F172A' }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={isDarkMode ? '#0F172A' : COLORS.background} />
      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNav,
          isArabic && { flexDirection: 'row-reverse' },
          isDarkMode && { backgroundColor: '#1E293B', borderTopColor: '#334155' },
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
                  isActive && { backgroundColor: isDarkMode ? themeColors.primaryLight : (themeColors.primaryUltraLight || themeColors.primaryLight) },
                ]}
              >
                <MaterialCommunityIcons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? (isDarkMode ? themeColors.primary : themeColors.primaryDark) : (isDarkMode ? '#94A3B8' : COLORS.textMuted)}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isDarkMode && { color: '#94A3B8' },
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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#10B981', fontSize: 22, fontWeight: 'bold' }}>مصروفي</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ExpenseProvider>
        <MainApp />
      </ExpenseProvider>
    </SafeAreaProvider>
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
});
