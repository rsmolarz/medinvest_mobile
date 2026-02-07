import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";
import { useAppColors } from '@/hooks/useAppColors';
import { investmentOpportunities } from "@/lib/mockData";
import { storage } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = RouteProp<RootStackParamList, "InvestModal">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const presetAmounts = [1000, 2500, 5000, 10000];

export default function InvestModalScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const appColors = useAppColors();

  const [amount, setAmount] = useState("");
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const buttonScale = useSharedValue(1);
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  const opportunity = route.params?.opportunityId
    ? investmentOpportunities.find((opp) => opp.id === route.params.opportunityId)
    : investmentOpportunities[0];

  const amountValue = parseFloat(amount.replace(/,/g, "")) || 0;
  const isValid = amountValue >= 1000 && riskAcknowledged && termsAccepted;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ThemedText type="body" style={{ color: Colors.primary }}>
            Cancel
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation]);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned) {
      setAmount(parseInt(cleaned, 10).toLocaleString());
    } else {
      setAmount("");
    }
  };

  const handlePresetAmount = (value: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAmount(value.toLocaleString());
  };

  const handleSubmit = async () => {
    if (!isValid || !opportunity) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    await storage.saveInvestment({
      id: `inv-${Date.now()}`,
      opportunityId: opportunity.id,
      amount: amountValue,
      date: new Date().toISOString(),
      status: "active",
    });

    setShowSuccess(true);
    successScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    successOpacity.value = withTiming(1, { duration: 300 });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const handlePressIn = () => {
    if (isValid) {
      buttonScale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  if (showSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Animated.View style={[styles.successContent, successAnimatedStyle]}>
          <View style={styles.successIcon}>
            <LinearGradient
              colors={[Colors.gradient.start, Colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successIconGradient}
            >
              <Feather name="check" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <ThemedText type="title" style={styles.successTitle}>
            Investment Submitted
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.successText, { color: theme.textSecondary }]}
          >
            Your ${amountValue.toLocaleString()} investment in{" "}
            {opportunity?.title} has been submitted successfully.
          </ThemedText>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {opportunity ? (
          <View
            style={[
              styles.opportunityCard,
              { backgroundColor: theme.backgroundDefault },
              Shadows.card,
            ]}
          >
            <ThemedText type="heading">{opportunity.title}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              by {opportunity.company}
            </ThemedText>
            <View style={styles.opportunityMeta}>
              <View style={styles.metaItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Expected ROI
                </ThemedText>
                <ThemedText type="body" style={{ color: Colors.secondary, fontWeight: "600" }}>
                  {opportunity.expectedROI}
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Risk Level
                </ThemedText>
                <ThemedText
                  type="body"
                  style={{
                    color:
                      opportunity.riskLevel === "high"
                        ? appColors.error
                        : opportunity.riskLevel === "medium"
                        ? appColors.warning
                        : Colors.secondary,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {opportunity.riskLevel}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Investment Amount
          </ThemedText>
          <View
            style={[
              styles.amountInput,
              { backgroundColor: theme.backgroundDefault, borderColor: appColors.border },
            ]}
          >
            <ThemedText type="title" style={{ color: theme.textSecondary }}>
              $
            </ThemedText>
            <TextInput
              style={[styles.amountTextInput, { color: theme.text }]}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
            />
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Minimum investment: $1,000
          </ThemedText>

          <View style={styles.presetAmounts}>
            {presetAmounts.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => handlePresetAmount(preset)}
                style={[
                  styles.presetButton,
                  {
                    backgroundColor:
                      amountValue === preset
                        ? Colors.primary
                        : theme.backgroundSecondary,
                  },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: amountValue === preset ? "#FFFFFF" : theme.text,
                    fontWeight: "500",
                  }}
                >
                  ${preset.toLocaleString()}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Payment Method
          </ThemedText>
          <Pressable
            style={[
              styles.paymentMethod,
              { backgroundColor: theme.backgroundDefault },
              Shadows.card,
            ]}
          >
            <View style={[styles.paymentIcon, { backgroundColor: Colors.primary + "15" }]}>
              <Feather name="credit-card" size={20} color={Colors.primary} />
            </View>
            <View style={styles.paymentInfo}>
              <ThemedText type="body">Bank Account</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                **** 4242
              </ThemedText>
            </View>
            <Feather name="check" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Acknowledgments
          </ThemedText>

          <Pressable
            onPress={() => setRiskAcknowledged(!riskAcknowledged)}
            style={styles.checkboxRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: riskAcknowledged
                    ? Colors.primary
                    : "transparent",
                  borderColor: riskAcknowledged ? Colors.primary : appColors.border,
                },
              ]}
            >
              {riskAcknowledged ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <ThemedText type="caption" style={styles.checkboxLabel}>
              I understand that this investment carries risks and I may lose some
              or all of my investment.
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={styles.checkboxRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: termsAccepted
                    ? Colors.primary
                    : "transparent",
                  borderColor: termsAccepted ? Colors.primary : appColors.border,
                },
              ]}
            >
              {termsAccepted ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
            <ThemedText type="caption" style={styles.checkboxLabel}>
              I agree to the Terms of Service and Privacy Policy.
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.lg,
            borderTopColor: appColors.border,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Total Investment
          </ThemedText>
          <ThemedText type="title">${amountValue.toLocaleString()}</ThemedText>
        </View>

        <AnimatedPressable
          onPress={handleSubmit}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isValid || isSubmitting}
          style={[styles.submitButton, buttonAnimatedStyle, !isValid && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            <ThemedText type="body" style={styles.submitButtonText}>
              {isSubmitting ? "Processing..." : "Confirm Investment"}
            </ThemedText>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  opportunityCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  opportunityMeta: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.xl,
  },
  metaItem: {
    gap: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  amountTextInput: {
    flex: 1,
    ...Typography.title,
  },
  presetAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  presetButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
  },
  bottomBar: {
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  submitButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  submitButtonGradient: {
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  successContent: {
    alignItems: "center",
  },
  successIcon: {
    marginBottom: Spacing.xl,
  },
  successIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  successText: {
    textAlign: "center",
  },
});
