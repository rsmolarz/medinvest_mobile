import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import ResearchScreen from "@/screens/ResearchScreen";
import ArticleDetailScreen from "@/screens/main/ArticleDetailScreen";

export type ResearchStackParamList = {
  Research: undefined;
  ArticleDetail: { articleId: string };
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
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
