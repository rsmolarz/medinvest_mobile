import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import InvestModalScreen from "@/screens/InvestModalScreen";
import AIChatScreen from "@/screens/AIChatScreen";
import MessagesScreen from "@/screens/MessagesScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import AchievementsScreen from "@/screens/AchievementsScreen";
import RoomsScreen from "@/screens/RoomsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  InvestModal: { opportunityId?: string };
  AIChat: undefined;
  Messages: undefined;
  Leaderboard: undefined;
  Achievements: undefined;
  Rooms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="InvestModal"
            component={InvestModalScreen}
            options={{
              presentation: "modal",
              headerTitle: "Invest",
            }}
          />
          <Stack.Screen
            name="AIChat"
            component={AIChatScreen}
            options={{
              headerTitle: "AI Assistant",
            }}
          />
          <Stack.Screen
            name="Messages"
            component={MessagesScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Rooms"
            component={RoomsScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
