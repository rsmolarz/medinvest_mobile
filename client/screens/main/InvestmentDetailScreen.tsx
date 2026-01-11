import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors, typography, spacing, layout, shadows } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

// Types
interface InvestmentDetail {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: string;
  fundingGoal: number;
  fundingCurrent: number;
  minimumInvestment: number;
  expectedROI: string;
  daysRemaining: number;
  imageUrl?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  investors: number;
  documents: { name: string; type: string }[];
  team: { name: string; role: string }[];
  milestones: { title: string; completed: boolean }[];
}

// Mock data
const MOCK_INVESTMENT: InvestmentDetail = {
  id: '1',
  name: 'NeuroLink Diagnostics',
  description: 'AI-powered early detection of neurological disorders',
  longDescription:
    'NeuroLink Diagnostics is pioneering the use of artificial intelligence for early detection of neurological conditions including Alzheimer\'s, Parkinson\'s, and multiple sclerosis. Our proprietary algorithms analyze brain imaging data with 94% accuracy, enabling intervention years earlier than traditional methods.\n\nThe global neurological diagnostics market is projected to reach $12B by 2028, and NeuroLink is positioned to capture significant market share with our FDA-cleared technology platform.',
  category: 'Digital Health',
  fundingGoal: 2500000,
  fundingCurrent: 1875000,
  minimumInvestment: 1000,
  expectedROI: '15-22%',
  daysRemaining: 45,
  riskLevel: 'Medium',
  investors: 342,
  documents: [
    { name: 'Pitch Deck', type: 'pdf' },
    { name: 'Financial Projections', type: 'xlsx' },
    { name: 'FDA Clearance Letter', type: 'pdf' },
    { name: 'Term Sheet', type: 'pdf' },
  ],
  team: [
    { name: 'Dr. Sarah Chen', role: 'CEO & Co-founder' },
    { name: 'Dr. Michael Park', role: 'CTO & Co-founder' },
    { name: 'Jennifer Liu', role: 'Chief Medical Officer' },
  ],
  milestones: [
    { title: 'FDA 510(k) Clearance', completed: true },
    { title: 'Series A Funding ($5M)', completed: true },
    { title: 'First Hospital Partnership', completed: true },
    { title: '10,000 Scans Processed', completed: false },
    { title: 'Series B Funding', completed: false },
  ],
};

/**
 * Investment Detail Screen
 */
export default function InvestmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'InvestmentDetail'>>();
  
  const [investment] = useState<InvestmentDetail>(MOCK_INVESTMENT);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${investment.name} on MedInvest - ${investment.description}`,
        title: investment.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [investment]);

  const handleInvest = useCallback(() => {
    navigation.navigate('InvestModal', { investmentId: investment.id });
  }, [navigation, investment.id]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const progress = (investment.fundingCurrent / investment.fundingGoal) * 100;

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient
            colors={colors.gradient.colors as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable style={styles.headerButton} onPress={handleBack}>
                <Feather name="arrow-left" size={24} color={colors.text.inverse} />
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleShare}>
                <Feather name="share-2" size={24} color={colors.text.inverse} />
              </Pressable>
            </View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{investment.category}</Text>
              </View>
              <Text style={styles.heroTitle}>{investment.name}</Text>
              <Text style={styles.heroDescription}>{investment.description}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Funding Progress Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.card}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.progressAmount}>
              {formatCurrency(investment.fundingCurrent)}
            </Text>
            <Text style={styles.progressGoal}>
              of {formatCurrency(investment.fundingGoal)} goal
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{progress.toFixed(0)}%</Text>
              <Text style={styles.progressStatLabel}>Funded</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{investment.investors}</Text>
              <Text style={styles.progressStatLabel}>Investors</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{investment.daysRemaining}</Text>
              <Text style={styles.progressStatLabel}>Days Left</Text>
            </View>
          </View>
        </Animated.View>

        {/* Key Metrics Grid */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.metricsGrid}
        >
          <View style={styles.metricCard}>
            <Feather name="trending-up" size={20} color={colors.primary.main} />
            <Text style={styles.metricValue}>{investment.expectedROI}</Text>
            <Text style={styles.metricLabel}>Expected ROI</Text>
          </View>
          <View style={styles.metricCard}>
            <Feather name="dollar-sign" size={20} color={colors.primary.main} />
            <Text style={styles.metricValue}>
              {formatCurrency(investment.minimumInvestment)}
            </Text>
            <Text style={styles.metricLabel}>Min. Investment</Text>
          </View>
          <View style={styles.metricCard}>
            <Feather name="alert-triangle" size={20} color={colors.semantic.warning} />
            <Text style={styles.metricValue}>{investment.riskLevel}</Text>
            <Text style={styles.metricLabel}>Risk Level</Text>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>{investment.longDescription}</Text>
        </Animated.View>

        {/* Team */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Team</Text>
          {investment.team.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <View style={styles.teamAvatar}>
                <Text style={styles.teamAvatarText}>
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
              <View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Milestones */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Milestones</Text>
          {investment.milestones.map((milestone, index) => (
            <View key={index} style={styles.milestone}>
              <View
                style={[
                  styles.milestoneIcon,
                  milestone.completed && styles.milestoneIconCompleted,
                ]}
              >
                {milestone.completed ? (
                  <Feather name="check" size={14} color={colors.text.inverse} />
                ) : (
                  <View style={styles.milestoneIconPending} />
                )}
              </View>
              <Text
                style={[
                  styles.milestoneText,
                  milestone.completed && styles.milestoneTextCompleted,
                ]}
              >
                {milestone.title}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Documents */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(600)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Documents</Text>
          {investment.documents.map((doc, index) => (
            <Pressable key={index} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <Feather name="file-text" size={20} color={colors.primary.main} />
              </View>
              <Text style={styles.documentName}>{doc.name}</Text>
              <Feather name="download" size={20} color={colors.text.tertiary} />
            </Pressable>
          ))}
        </Animated.View>

        {/* Risk Assessment */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(700)}
          style={styles.riskCard}
        >
          <View style={styles.riskHeader}>
            <Feather name="alert-circle" size={20} color={colors.semantic.warning} />
            <Text style={styles.riskTitle}>Risk Assessment</Text>
          </View>
          <Text style={styles.riskText}>
            This investment carries {investment.riskLevel.toLowerCase()} risk. Medical
            technology investments are subject to regulatory approval, market adoption,
            and competitive pressures. Past performance does not guarantee future results.
            Please review all documents carefully before investing.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Floating Invest Button */}
      <View style={[styles.floatingButton, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={handleInvest} style={styles.investButton}>
          <LinearGradient
            colors={colors.gradient.colors as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.investButtonGradient}
          >
            <Text style={styles.investButtonText}>Invest Now</Text>
            <Feather name="arrow-right" size={20} color={colors.text.inverse} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // Hero
  hero: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.transparent.white20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.transparent.white20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusFull,
    marginBottom: spacing.md,
  },
  categoryText: {
    ...typography.caption,
    color: colors.text.inverse,
  },
  heroTitle: {
    ...typography.hero,
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  heroDescription: {
    ...typography.body,
    color: colors.transparent.white50,
  },

  // Card
  card: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    padding: spacing.lg,
    borderRadius: layout.radiusLarge,
    ...shadows.elevated,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  progressAmount: {
    ...typography.title,
    color: colors.text.primary,
  },
  progressGoal: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  progressBar: {
    height: layout.progressBarHeight,
    backgroundColor: colors.border.light,
    borderRadius: layout.progressBarHeight / 2,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: layout.progressBarHeight / 2,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    ...typography.heading,
    color: colors.text.primary,
  },
  progressStatLabel: {
    ...typography.small,
    color: colors.text.secondary,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: layout.radiusMedium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  metricValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  metricLabel: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },

  // Team
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.transparent.primary20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  teamAvatarText: {
    ...typography.captionMedium,
    color: colors.primary.main,
  },
  teamName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  teamRole: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Milestones
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  milestoneIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  milestoneIconCompleted: {
    backgroundColor: colors.semantic.success,
  },
  milestoneIconPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary,
  },
  milestoneText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  milestoneTextCompleted: {
    color: colors.text.primary,
  },

  // Documents
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },

  // Risk Card
  riskCard: {
    backgroundColor: colors.transparent.black10,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  riskTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  riskText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  investButton: {
    borderRadius: layout.radiusMedium,
    overflow: 'hidden',
  },
  investButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  investButtonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
