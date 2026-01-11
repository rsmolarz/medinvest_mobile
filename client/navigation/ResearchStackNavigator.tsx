import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import ResearchScreen from "@/screens/ResearchScreen";

export type ResearchStackParamList = {
  Research: undefined;
};

const Stack = createNativeStackNavigator<ResearchStackParamList>();

export default function ResearchStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Research"
        component={ResearchScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
