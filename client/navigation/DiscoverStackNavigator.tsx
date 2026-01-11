import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import DiscoverScreen from "@/screens/DiscoverScreen";
import InvestmentDetailScreen from "@/screens/InvestmentDetailScreen";

export type DiscoverStackParamList = {
  Discover: undefined;
  InvestmentDetail: { id: string };
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export default function DiscoverStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InvestmentDetail"
        component={InvestmentDetailScreen}
        options={{ headerTitle: "" }}
      />
    </Stack.Navigator>
  );
}
