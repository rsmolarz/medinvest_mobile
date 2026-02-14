import React from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  useColorScheme,
} from "react-native";
import { Spacing, BorderRadius } from "@/constants/theme";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

const lightColors = {
  background: "#FFFFFF",
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  buttonBg: "#007AFF",
  buttonText: "#FFFFFF",
};

const darkColors = {
  background: "#1C1C1E",
  text: "#F2F2F7",
  textSecondary: "#8E8E93",
  buttonBg: "#0A84FF",
  buttonText: "#FFFFFF",
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          MedInvest encountered an unexpected issue. Please restart to continue.
        </Text>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.buttonBg,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Restart MedInvest
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 40,
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing["2xl"],
    minWidth: 200,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});
