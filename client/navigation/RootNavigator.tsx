import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';
import type { RootStackParamList, AuthStackParamList } from './types';

const ONBOARDING_COMPLETE_KEY = '@medinvest/onboarding_complete';

// Navigators
import MainTabNavigator from './MainTabNavigator';

// Auth Screens
import LoginScreen from '@/screens/auth/LoginScreen';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';

// Modal Screens
import InvestModalScreen from '@/screens/modals/InvestModalScreen';
import InvestmentDetailScreen from '@/screens/main/InvestmentDetailScreen';

// Other Screens
import SettingsScreen from '@/screens/settings/SettingsScreen';
import DocumentsScreen from '@/screens/settings/DocumentsScreen';
import PaymentMethodsScreen from '@/screens/settings/PaymentMethodsScreen';
import SupportScreen from '@/screens/settings/SupportScreen';
import LegalScreen from '@/screens/settings/LegalScreen';
import EditProfileScreen from '@/screens/settings/EditProfileScreen';
import NotificationsSettingsScreen from '@/screens/settings/NotificationsSettingsScreen';
import BookmarkedArticlesScreen from '@/screens/main/BookmarkedArticlesScreen';
import TransactionHistoryScreen from '@/screens/main/TransactionHistoryScreen';
import ArticleDetailScreen from '@/screens/main/ArticleDetailScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth Navigator
 * Handles login/signup flow
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      {/* Add more auth screens as needed */}
    </AuthStack.Navigator>
  );
}

/**
 * Loading Screen
 * Shown while checking auth state
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary.main} />
    </View>
  );
}

/**
 * Root Navigator
 * Handles auth state and routes to appropriate navigator
 */
export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch {
        setHasCompletedOnboarding(true);
      }
    }
    if (!isAuthenticated) {
      checkOnboarding();
    }
  }, [isAuthenticated]);

  // Show loading while checking auth state or onboarding status
  if (isLoading || (!isAuthenticated && hasCompletedOnboarding === null)) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // Authenticated routes
          <>
            <RootStack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{
                animation: 'fade',
              }}
            />
            
            {/* Investment Detail - Full screen */}
            <RootStack.Screen
              name="InvestmentDetail"
              component={InvestmentDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Invest Modal - Modal presentation */}
            <RootStack.Screen
              name="InvestModal"
              component={InvestModalScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />

            {/* Settings screens */}
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="Documents"
              component={DocumentsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="PaymentMethods"
              component={PaymentMethodsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="Support"
              component={SupportScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="Legal"
              component={LegalScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="NotificationsSettings"
              component={NotificationsSettingsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="BookmarkedArticles"
              component={BookmarkedArticlesScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="TransactionHistory"
              component={TransactionHistoryScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="ArticleDetail"
              component={ArticleDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        ) : hasCompletedOnboarding ? (
          // User has completed onboarding - show auth
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'fade',
            }}
          />
        ) : (
          // First time user - show onboarding
          <>
            <RootStack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{
                animation: 'fade',
              }}
            />
            <RootStack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{
                animation: 'fade',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
