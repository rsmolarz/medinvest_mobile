/**
 * Navigation Configuration
 * Main app navigation with auth flow
 */

import React, { useState, useEffect } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Platform } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAppColors } from "@/hooks/useAppColors";
import { linkingConfig } from "@/lib/deep-linking";

// Auth Screens
import LoginScreen from "@/screens/LoginScreenNew";
import RegisterScreen from "@/screens/RegisterScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import VerifyEmailScreen from "@/screens/VerifyEmailScreen";
import OnboardingScreen, {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from "@/screens/OnboardingScreen";
import AuthTermsOfServiceScreen from "@/screens/TermsOfServiceScreen";
import AuthPrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";

// Main Screens
import HomeScreen from "@/screens/HomeScreen";
import RoomsScreen from "@/screens/RoomsScreen";
import MessagesScreen from "@/screens/MessagesScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import DealsScreen from "@/screens/DealsScreen";

// Stack Screens
import CreatePostScreen from "@/screens/CreatePostScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import ConversationScreen from "@/screens/ConversationScreen";
import NewConversationScreen from "@/screens/NewConversationScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import SearchScreen from "@/screens/SearchScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import RoomDetailScreen from "@/screens/RoomDetailScreen";
import HashtagScreen from "@/screens/HashtagScreen";
import FollowersScreen from "@/screens/FollowersScreen";
import BookmarksScreen from "@/screens/BookmarksScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import AchievementsScreen from "@/screens/AchievementsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import PremiumScreen from "@/screens/PremiumScreen";
import AMADetailScreen from "@/screens/AMADetailScreen";
import CourseDetailScreen from "@/screens/CourseDetailScreen";
import EventDetailScreen from "@/screens/EventDetailScreen";
import DealDetailScreen from "@/screens/DealDetailScreen";
import AIChatScreen from "@/screens/AIChatScreen";
import LessonPlayerScreen from "@/screens/LessonPlayerScreen";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import BlockedUsersScreen from "@/screens/BlockedUsersScreen";
import DeleteAccountScreen from "@/screens/DeleteAccountScreen";
import BiometricSettingsScreen from "@/screens/BiometricSettingsScreen";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "@/screens/TermsOfServiceScreen";
import AppearanceSettingsScreen from "@/screens/AppearanceSettingsScreen";
import EditPostScreen from "@/screens/EditPostScreen";
import DraftsScreen from "@/screens/DraftsScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import ContentPreferencesScreen from "@/screens/ContentPreferencesScreen";
import ReportScreen from "@/screens/ReportScreen";
import SavedSearchesScreen from "@/screens/SavedSearchesScreen";
import DataExportScreen from "@/screens/DataExportScreen";
import VoiceCallScreen from "@/screens/VoiceCallScreen";

// Types
import {
  RootStackParamList,
  MainTabParamList,
  AuthStackParamList,
} from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <AuthStack.Screen
        name="TermsOfService"
        component={AuthTermsOfServiceScreen}
      />
      <AuthStack.Screen
        name="PrivacyPolicy"
        component={AuthPrivacyPolicyScreen}
      />
    </AuthStack.Navigator>
  );
}

// Tab Navigator
function MainTabNavigator() {
  const appColors = useAppColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: appColors.textSecondary,
        tabBarStyle: {
          backgroundColor: appColors.surface,
          borderTopColor: appColors.border,
          paddingBottom: Platform.OS === "ios" ? Spacing.lg : Spacing.sm,
          paddingTop: Spacing.sm,
          height: Platform.OS === "ios" ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Rooms":
              iconName = focused ? "people" : "people-outline";
              break;
            case "Discover":
              iconName = focused ? "compass" : "compass-outline";
              break;
            case "Messages":
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Feed" }}
      />
      <Tab.Screen
        name="Rooms"
        component={RoomsScreen}
        options={{ tabBarLabel: "Rooms" }}
      />
      <Tab.Screen
        name="Discover"
        component={DealsScreen}
        options={{ tabBarLabel: "Deals" }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: "Messages" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const appColors = useAppColors();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  const navigationTheme = appColors.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: Colors.primary,
          background: appColors.background,
          card: appColors.surface,
          text: appColors.textPrimary,
          border: appColors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: Colors.primary,
          background: appColors.background,
          card: appColors.surface,
          text: appColors.textPrimary,
          border: appColors.border,
        },
      };

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await hasCompletedOnboarding();
      setHasOnboarded(completed);
    };
    checkOnboarding();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && hasOnboarded === false) {
      markOnboardingComplete();
      setHasOnboarded(true);
    }
  }, [isAuthenticated, hasOnboarded]);

  if (isLoading || hasOnboarded === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: appColors.surface,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const showOnboarding = !isAuthenticated && hasOnboarded === false;

  return (
    <NavigationContainer linking={linkingConfig} theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : null}

        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />

            {/* Modal Screens */}
            <Stack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />

            {/* Push Screens */}
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
            <Stack.Screen
              name="Conversation"
              component={ConversationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NewConversation"
              component={NewConversationScreen}
            />
            <Stack.Screen
              name="VoiceCall"
              component={VoiceCallScreen}
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Hashtag" component={HashtagScreen} />
            <Stack.Screen name="Followers" component={FollowersScreen} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />

            {/* Account Management */}
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
            <Stack.Screen
              name="DeleteAccount"
              component={DeleteAccountScreen}
            />
            <Stack.Screen
              name="BiometricSettings"
              component={BiometricSettingsScreen}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
            />
            <Stack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
            />

            {/* Content Detail Screens */}
            <Stack.Screen name="AMADetail" component={AMADetailScreen} />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} />
            <Stack.Screen name="DealDetail" component={DealDetailScreen} />
            <Stack.Screen
              name="LessonPlayer"
              component={LessonPlayerScreen}
              options={{
                animation: "slide_from_right",
              }}
            />

            {/* AI Chat */}
            <Stack.Screen
              name="AIChat"
              component={AIChatScreen}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />

            {/* Additional Settings Screens */}
            <Stack.Screen
              name="AppearanceSettings"
              component={AppearanceSettingsScreen}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
            />
            <Stack.Screen
              name="ContentPreferences"
              component={ContentPreferencesScreen}
            />
            <Stack.Screen name="DataExport" component={DataExportScreen} />
            <Stack.Screen
              name="SavedSearches"
              component={SavedSearchesScreen}
            />

            {/* Post Management */}
            <Stack.Screen name="EditPost" component={EditPostScreen} />
            <Stack.Screen name="Drafts" component={DraftsScreen} />
            <Stack.Screen
              name="Report"
              component={ReportScreen}
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
