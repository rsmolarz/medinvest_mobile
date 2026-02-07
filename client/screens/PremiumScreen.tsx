/**
 * Premium Screen
 * Subscription upgrade and features display
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { subscriptionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  {
    icon: 'analytics-outline',
    title: 'Advanced Analytics',
    description: 'Deep insights into market trends and investment performance',
  },
  {
    icon: 'rocket-outline',
    title: 'Early Access',
    description: 'Be first to see new deals and investment opportunities',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified Badge',
    description: 'Stand out with a premium verification badge on your profile',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Priority Support',
    description: '24/7 dedicated support from our expert team',
  },
  {
    icon: 'document-text-outline',
    title: 'Exclusive Content',
    description: 'Access premium research reports and expert analysis',
  },
  {
    icon: 'eye-off-outline',
    title: 'Ad-Free Experience',
    description: 'Enjoy MedInvest without any advertisements',
  },
];

const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$29',
    period: '/month',
    savings: null,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$199',
    period: '/year',
    savings: 'Save 43%',
    popular: true,
  },
];

export default function PremiumScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const appColors = useAppColors();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await subscriptionApi.createCheckoutSession();
      if (!response.success || !response.data?.checkout_url) {
        throw new Error('Failed to create checkout session');
      }
      return response.data.checkout_url;
    },
    onSuccess: (checkoutUrl) => {
      Linking.openURL(checkoutUrl);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to start checkout');
    },
  });

  const handleSubscribe = () => {
    checkoutMutation.mutate();
  };

  const renderFeature = (feature: typeof PREMIUM_FEATURES[0], index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={feature.icon as any} size={24} color={Colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={[styles.featureTitle, { color: appColors.textPrimary }]}>{feature.title}</ThemedText>
        <ThemedText style={[styles.featureDescription, { color: appColors.textSecondary }]}>{feature.description}</ThemedText>
      </View>
    </View>
  );

  const renderPricingPlan = (plan: typeof PRICING_PLANS[0]) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.pricingCard,
        selectedPlan === plan.id && styles.pricingCardSelected,
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <ThemedText style={styles.popularText}>Most Popular</ThemedText>
        </View>
      )}
      <View style={styles.pricingContent}>
        <ThemedText style={[styles.planName, { color: appColors.textSecondary }]}>{plan.name}</ThemedText>
        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { color: appColors.textPrimary }]}>{plan.price}</ThemedText>
          <ThemedText style={[styles.period, { color: appColors.textSecondary }]}>{plan.period}</ThemedText>
        </View>
        {plan.savings && (
          <ThemedText style={styles.savings}>{plan.savings}</ThemedText>
        )}
      </View>
      <View style={[
        styles.radioButton,
        { borderColor: appColors.border },
        selectedPlan === plan.id && styles.radioButtonSelected,
      ]}>
        {selectedPlan === plan.id && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.surface }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.crownContainer}
          >
            <MaterialCommunityIcons name="crown" size={48} color="white" />
          </LinearGradient>
          <ThemedText style={[styles.heroTitle, { color: appColors.textPrimary }]}>Upgrade to Premium</ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: appColors.textSecondary }]}>
            Unlock the full potential of MedInvest and accelerate your healthcare investment journey
          </ThemedText>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Premium Benefits</ThemedText>
          {PREMIUM_FEATURES.map(renderFeature)}
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Choose Your Plan</ThemedText>
          <View style={styles.pricingCards}>
            {PRICING_PLANS.map(renderPricingPlan)}
          </View>
        </View>

        {/* Guarantee */}
        <View style={styles.guaranteeSection}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.secondary} />
          <ThemedText style={[styles.guaranteeText, { color: appColors.textSecondary }]}>
            7-day money-back guarantee. Cancel anytime.
          </ThemedText>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialSection}>
          <View style={styles.testimonialCard}>
            <ThemedText style={[styles.testimonialText, { color: appColors.textPrimary }]}>
              "Premium gave me access to deals I never would have found otherwise. Already seeing 3x returns on my first investment!"
            </ThemedText>
            <ThemedText style={[styles.testimonialAuthor, { color: appColors.textSecondary }]}>
              — Dr. Sarah Chen, Cardiologist
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Subscribe Button */}
      <View style={[styles.footer, { backgroundColor: appColors.surface, borderTopColor: appColors.border }]}>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={checkoutMutation.isPending}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeGradient}
          >
            {checkoutMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <ThemedText style={styles.subscribeText}>
                  Start Premium {selectedPlan === 'yearly' ? '- $199/year' : '- $29/month'}
                </ThemedText>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <ThemedText style={[styles.footerNote, { color: appColors.textSecondary }]}>
          Subscription auto-renews. Cancel anytime.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
  },
  crownContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  featuresSection: {
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  featureItem: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...Typography.caption,
    lineHeight: 20,
  },
  pricingSection: {
    paddingVertical: Spacing.xl,
  },
  pricingCards: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.lg,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  popularText: {
    ...Typography.small,
    color: 'white',
    fontWeight: '600',
  },
  pricingContent: {
    flex: 1,
  },
  planName: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.xs,
  },
  price: {
    ...Typography.title,
  },
  period: {
    ...Typography.body,
    marginLeft: Spacing.xs,
  },
  savings: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  guaranteeText: {
    ...Typography.caption,
  },
  testimonialSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  testimonialCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  testimonialText: {
    ...Typography.body,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  testimonialAuthor: {
    ...Typography.caption,
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
  },
  subscribeButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.button,
  },
  subscribeGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
  footerNote: {
    ...Typography.small,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
