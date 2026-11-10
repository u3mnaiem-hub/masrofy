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
  const { isArabic, isDarkMode, themeColors } = useExpense();
  const insets = useSafeAreaInsets();

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
