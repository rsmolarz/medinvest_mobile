import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import PortfolioScreen from "@/screens/PortfolioScreen";
import TransactionHistoryScreen from "@/screens/main/TransactionHistoryScreen";

export type PortfolioStackParamList = {
  Portfolio: undefined;
  TransactionHistory: { investmentId?: string } | undefined;
};

const Stack = createNativeStackNavigator<PortfolioStackParamList>();

export default function PortfolioStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
