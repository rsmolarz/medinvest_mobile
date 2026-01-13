import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import NotificationsScreen from "@/screens/NotificationsScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";

export type NotificationsStackParamList = {
  Notifications: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export default function NotificationsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerTitle: "Notification Settings" }}
      />
    </Stack.Navigator>
  );
}
