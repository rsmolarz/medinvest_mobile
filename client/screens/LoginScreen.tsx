import React from "react";
import { View, StyleSheet, Image, Platform, Alert, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useAppColors } from '@/hooks/useAppColors';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const appColors = useAppColors();
  const navigation = useNavigation<any>();
  const { signInWithApple, signInWithGoogle, isAppleAuthAvailable, isLoading, error } = useAuth();

  const handleAppleSignIn = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await signInWithApple();
  };

  const handleGoogleSignIn = async () => {
    console.log('handleGoogleSignIn clicked!');
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await signInWithGoogle();
  };

  const handleEmailSignIn = () => {
    navigation.navigate('Register');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Image
              source={require("../../assets/images/splash-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </LinearGradient>
        </View>

        <ThemedText type="hero" style={styles.title}>
          MedInvest
        </ThemedText>
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Invest in the future of healthcare
        </ThemedText>

        <View style={styles.features}>
          <FeatureItem
            icon="compass"
            text="Discover groundbreaking medical innovations"
          />
          <FeatureItem
            icon="pie-chart"
            text="Build a portfolio in healthcare ventures"
          />
          <FeatureItem
            icon="trending-up"
            text="Track your investments and returns"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isAppleAuthAvailable && Platform.OS === 'ios' ? (
          <Button onPress={handleAppleSignIn} style={styles.signInButton} disabled={isLoading}>
            {"Sign In with Apple"}
          </Button>
        ) : null}
        <Pressable
          onPress={handleGoogleSignIn}
          style={[styles.googleButton, { backgroundColor: theme.backgroundSecondary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderColor: appColors.border }]}
          disabled={isLoading}
        >
          <Text style={{ color: theme.text, fontSize: 16 }}>
            {isLoading ? 'Signing in...' : 'Sign In with Google'}
          </Text>
        </Pressable>
        <Button
          onPress={handleEmailSignIn}
          style={[styles.googleButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: appColors.border }]}
        >
          {"Sign Up with Email"}
        </Button>

        {error ? (
          <ThemedText type="small" style={[styles.errorText, { color: appColors.error }]}>
            {error}
          </ThemedText>
        ) : null}

        <ThemedText
          type="small"
          style={[styles.terms, { color: theme.textSecondary }]}
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  const { theme } = useTheme();
  const Feather = require("@expo/vector-icons").Feather;

  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: Colors.primary + "15" }]}>
        <Feather name={icon} size={20} color={Colors.primary} />
      </View>
      <ThemedText type="caption" style={[styles.featureText, { color: theme.textSecondary }]}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: Spacing["3xl"],
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: "#FFFFFF",
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["4xl"],
  },
  features: {
    width: "100%",
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  signInButton: {
    backgroundColor: Colors.primary,
  },
  googleButton: {
    borderWidth: 1,
  },
  terms: {
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  errorText: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
