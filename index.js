import { registerRootComponent } from 'expo';
import React, { Component } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Buffer polyfill for xlsx / SheetJS
if (typeof global.Buffer === 'undefined') {
  try {
    global.Buffer = require('buffer').Buffer;
  } catch (e) {}
}

// Global JS error handler
if (global.ErrorUtils) {
  const prevHandler = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Captured Global Error:', error);
    if (prevHandler) {
      try {
        prevHandler(error, isFatal);
      } catch (e) {}
    }
  });
}

import App from './App';

class RootErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RootErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>تنبيه: تعذر فتح واجهة التطبيق</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.text}>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' },
  title: { color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  scroll: { maxHeight: 400, backgroundColor: '#1E293B', padding: 16, borderRadius: 12 },
  text: { color: '#F8FAFC', fontSize: 12, fontFamily: 'monospace' },
});

function Root() {
  return (
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}

registerRootComponent(Root);
