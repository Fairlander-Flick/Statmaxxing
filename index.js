import React from 'react';
import { Platform, LogBox } from 'react-native';

// Handle React 19 compatibility issues on Web.
if (Platform.OS === 'web') {
  // Suppress specific React 19 warnings that trigger the LogBox toast
  const suppressRegex = /Invalid DOM property `transform-origin`/i;
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && suppressRegex.test(args[0])) return;
    originalError(...args);
  };
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && suppressRegex.test(args[0])) return;
    originalWarn(...args);
  };
  
  // Also tell LogBox to ignore it specifically
  LogBox.ignoreLogs([
    'Invalid DOM property `transform-origin`',
    'Invalid DOM property `transformOrigin`'
  ]);
}

import 'expo-router/entry';
