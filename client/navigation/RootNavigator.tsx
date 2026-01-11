import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';
import type { RootStackParamList, AuthStackParamList } from './types';

// Navigators
import MainTabNavigator from './MainTabNavigator';

// Auth Screens
import LoginScreen from '@/screens/auth/LoginScreen';

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

  // Show loading while checking auth state
  if (isLoading) {
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
          </>
        ) : (
          // Unauthenticated routes
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'fade',
            }}
          />
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
