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
  const { isArabic, isDarkMode, themeColors, appPin, isAppUnlocked, unlockAppWithPin } = useExpense();
  const insets = useSafeAreaInsets();

  if (appPin && !isAppUnlocked) {
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
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <MaterialCommunityIcons name="lock" size={32} color="#FFFFFF" />
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 6 }}>
          {isArabic ? 'مصروفي مقفل 🔒' : 'Masrofy is Locked 🔒'}
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 22 }}>
          {pinError
            ? (isArabic ? '❌ الرقم السري غير صحيح، حاول مرة أخرى' : '❌ Incorrect PIN, try again')
            : (isArabic ? 'أدخل الرقم السري المكون من 4 أرقام للمتابعة' : 'Enter your 4-digit PIN to unlock')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 14, marginBottom: 28 }}>
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
        <View style={{ width: 250, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
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
                height: 60,
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
                  isActive && (isDarkMode ? { backgroundColor: '#064E3B' } : styles.activeIconWrap),
                ]}
              >
                <MaterialCommunityIcons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? (isDarkMode ? '#34D399' : COLORS.primaryDark) : (isDarkMode ? '#94A3B8' : COLORS.textMuted)}
                />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isDarkMode && { color: '#94A3B8' },
                  isActive && (isDarkMode ? { color: '#34D399', fontWeight: '800' } : styles.activeNavLabel),
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
