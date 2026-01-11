import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { QueryProvider } from '@/providers/QueryProvider';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { ToastProvider } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';

import RootNavigator from '@/navigation/RootNavigator';

import { colors } from '@/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryProvider enablePersistence>
            <NetworkProvider>
              <AuthProvider>
                <KeyboardProvider>
                  <ToastProvider>
                    <StatusBar style="dark" backgroundColor={colors.background.primary} />
                    <RootNavigator />
                  </ToastProvider>
                </KeyboardProvider>
              </AuthProvider>
            </NetworkProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
