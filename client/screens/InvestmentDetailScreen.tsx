import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useAppColors } from '@/hooks/useAppColors';
import { investmentOpportunities } from "@/lib/mockData";
import { DiscoverStackParamList } from "@/navigation/DiscoverStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteParams = RouteProp<DiscoverStackParamList, "InvestmentDetail">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function InvestmentDetailScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const appColors = useAppColors();
  const scale = useSharedValue(1);

  const opportunity = investmentOpportunities.find(
    (opp) => opp.id === route.params.id
  );

  if (!opportunity) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Opportunity not found</ThemedText>
      </ThemedView>
    );
  }

  const progress = (opportunity.fundingRaised / opportunity.fundingGoal) * 100;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this investment opportunity: ${opportunity.title} by ${opportunity.company}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleInvest = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate("InvestModal", { opportunityId: opportunity.id });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getRiskColor = () => {
    switch (opportunity.riskLevel) {
      case "low":
        return Colors.secondary;
      case "medium":
        return appColors.warning;
      case "high":
        return appColors.error;
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleShare} hitSlop={8}>
          <Feather name="share" size={22} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        <Image
          source={require("../../assets/images/investment-hero-placeholder.png")}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View
              style={[styles.categoryBadge, { backgroundColor: Colors.primary + "15" }]}
            >
              <ThemedText
                type="small"
                style={[styles.categoryText, { color: Colors.primary }]}
              >
                {opportunity.category.replace("-", " ").toUpperCase()}
              </ThemedText>
            </View>
            <View
              style={[styles.riskBadge, { backgroundColor: getRiskColor() + "15" }]}
            >
              <ThemedText
                type="small"
                style={[styles.riskText, { color: getRiskColor() }]}
              >
                {opportunity.riskLevel.toUpperCase()} RISK
              </ThemedText>
            </View>
          </View>

          <ThemedText type="title" style={styles.title}>
            {opportunity.title}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.company, { color: theme.textSecondary }]}
          >
            by {opportunity.company}
          </ThemedText>

          <View
            style={[styles.fundingCard, { backgroundColor: theme.backgroundDefault }, Shadows.card]}
          >
            <View style={styles.fundingHeader}>
              <View>
                <ThemedText type="hero" style={{ color: Colors.primary }}>
                  ${(opportunity.fundingRaised / 1000000).toFixed(2)}M
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  raised of ${(opportunity.fundingGoal / 1000000).toFixed(0)}M goal
                </ThemedText>
              </View>
              <View style={styles.daysContainer}>
                <ThemedText type="heading" style={{ color: appColors.warning }}>
                  {opportunity.daysRemaining}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  days left
                </ThemedText>
              </View>
            </View>

            <View style={[styles.progressBar, { backgroundColor: appColors.border }]}>
              <LinearGradient
                colors={[Colors.gradient.start, Colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard
              label="Expected ROI"
              value={opportunity.expectedROI}
              icon="trending-up"
            />
            <MetricCard
              label="Investors"
              value="247"
              icon="users"
            />
            <MetricCard
              label="Min. Investment"
              value="$1,000"
              icon="dollar-sign"
            />
            <MetricCard
              label="Risk Level"
              value={opportunity.riskLevel}
              icon="shield"
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              About
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {opportunity.description}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Key Highlights
            </ThemedText>
            {opportunity.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <View
                  style={[styles.highlightDot, { backgroundColor: Colors.secondary }]}
                />
                <ThemedText type="body">{highlight}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Documents
            </ThemedText>
            {opportunity.documents.map((doc, index) => (
              <Pressable
                key={index}
                style={[styles.documentItem, { backgroundColor: theme.backgroundDefault }]}
              >
                <Feather name="file-text" size={20} color={Colors.primary} />
                <ThemedText type="body" style={styles.documentName}>
                  {doc.name}
                </ThemedText>
                <Feather name="download" size={18} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

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
        <AnimatedPressable
          onPress={handleInvest}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.investButton, animatedStyle]}
        >
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.investButtonGradient}
          >
            <ThemedText type="body" style={styles.investButtonText}>
              Invest Now
            </ThemedText>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.backgroundDefault }]}>
      <Feather name={icon as any} size={20} color={Colors.primary} />
      <ThemedText type="heading" style={styles.metricValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 200,
  },
  content: {
    padding: Spacing.xl,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontWeight: "600",
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  riskText: {
    fontWeight: "600",
  },
  title: {
    marginBottom: Spacing.xs,
  },
  company: {
    marginBottom: Spacing.xl,
  },
  fundingCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  fundingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  daysContainer: {
    alignItems: "flex-end",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricValue: {
    textTransform: "capitalize",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  documentName: {
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  investButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  investButtonGradient: {
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  investButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
