/**
 * DealDetail Screen
 * View investment deal details and invest
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { dealsApi } from '@/lib/api';
import { Deal } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

type DealDetailRouteParams = {
  DealDetail: {
    dealId: number;
  };
};

export default function DealDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<DealDetailRouteParams, 'DealDetail'>>();
  const { dealId } = route.params;
  const appColors = useAppColors();

  const {
    data: deal,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const response = await dealsApi.getDeal(dealId);
      return response.data;
    },
  });

  const handleInvest = useCallback(() => {
    if (deal?.investment_url) {
      Linking.openURL(deal.investment_url);
    }
  }, [deal]);

  const handleDocumentPress = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.secondary;
      case 'closing_soon': return appColors.warning;
      case 'funded': return Colors.primary;
      case 'closed': return appColors.textSecondary;
      default: return Colors.primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open for Investment';
      case 'closing_soon': return 'Closing Soon';
      case 'funded': return 'Fully Funded';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!deal) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ThemedText>Deal not found</ThemedText>
      </SafeAreaView>
    );
  }

  const fundingProgress = (deal.raised_amount / deal.funding_goal) * 100;
  const daysLeft = deal.closing_date 
    ? Math.max(0, Math.ceil((new Date(deal.closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Deal Details</ThemedText>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header */}
        <View style={[styles.companyHeader, { backgroundColor: appColors.surface }]}>
          {deal.company_logo ? (
            <Image source={{ uri: deal.company_logo }} style={styles.companyLogo} />
          ) : (
            <View style={[styles.companyLogo, styles.logoPlaceholder]}>
              <MaterialCommunityIcons name="domain" size={32} color={Colors.primary} />
            </View>
          )}
          <View style={styles.companyInfo}>
            <ThemedText style={[styles.companyName, { color: appColors.textPrimary }]}>{deal.company_name}</ThemedText>
            <View style={styles.categoryBadge}>
              <ThemedText style={styles.categoryText}>{deal.category}</ThemedText>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.status) + '20' }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(deal.status) }]}>
              {getStatusText(deal.status)}
            </ThemedText>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={[styles.metricsCard, { backgroundColor: appColors.surface }]}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: appColors.textSecondary }]}>Funding Goal</ThemedText>
              <ThemedText style={[styles.metricValue, { color: appColors.textPrimary }]}>
                {formatCurrency(deal.funding_goal)}
              </ThemedText>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: appColors.border }]} />
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: appColors.textSecondary }]}>Raised</ThemedText>
              <ThemedText style={[styles.metricValue, { color: Colors.secondary }]}>
                {formatCurrency(deal.raised_amount)}
              </ThemedText>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(fundingProgress, 100)}%` }]} />
            </View>
            <ThemedText style={[styles.progressText, { color: appColors.textSecondary }]}>{Math.round(fundingProgress)}% funded</ThemedText>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: appColors.textSecondary }]}>Min Investment</ThemedText>
              <ThemedText style={[styles.metricValue, { color: appColors.textPrimary }]}>
                {formatCurrency(deal.min_investment)}
              </ThemedText>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: appColors.border }]} />
            <View style={styles.metricItem}>
              <ThemedText style={[styles.metricLabel, { color: appColors.textSecondary }]}>Investors</ThemedText>
              <ThemedText style={[styles.metricValue, { color: appColors.textPrimary }]}>
                {formatNumber(deal.investors_count)}
              </ThemedText>
            </View>
            {daysLeft !== null && (
              <>
                <View style={[styles.metricDivider, { backgroundColor: appColors.border }]} />
                <View style={styles.metricItem}>
                  <ThemedText style={[styles.metricLabel, { color: appColors.textSecondary }]}>Days Left</ThemedText>
                  <ThemedText style={[styles.metricValue, { color: appColors.textPrimary }, daysLeft < 7 && { color: appColors.warning }]}>
                    {daysLeft}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: appColors.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>About</ThemedText>
          <ThemedText style={[styles.descriptionText, { color: appColors.textSecondary }]}>{deal.description}</ThemedText>
        </View>

        {/* Highlights */}
        {deal.highlights && deal.highlights.length > 0 && (
          <View style={[styles.section, { backgroundColor: appColors.surface }]}>
            <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Investment Highlights</ThemedText>
            {deal.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
                <ThemedText style={[styles.highlightText, { color: appColors.textPrimary }]}>{highlight}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Team */}
        {deal.team && deal.team.length > 0 && (
          <View style={[styles.section, { backgroundColor: appColors.surface }]}>
            <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Leadership Team</ThemedText>
            {deal.team.map((member, index) => (
              <View key={index} style={[styles.teamMember, { borderBottomColor: appColors.border }]}>
                {member.avatar_url ? (
                  <Image source={{ uri: member.avatar_url }} style={styles.teamAvatar} />
                ) : (
                  <View style={[styles.teamAvatar, styles.teamAvatarPlaceholder]}>
                    <ThemedText style={styles.teamAvatarText}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.teamInfo}>
                  <ThemedText style={[styles.teamName, { color: appColors.textPrimary }]}>{member.name}</ThemedText>
                  <ThemedText style={[styles.teamRole, { color: appColors.textSecondary }]}>{member.role}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Documents */}
        {deal.documents && deal.documents.length > 0 && (
          <View style={[styles.section, { backgroundColor: appColors.surface }]}>
            <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Documents</ThemedText>
            {deal.documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.documentItem, { borderBottomColor: appColors.border }]}
                onPress={() => handleDocumentPress(doc.url)}
              >
                <View style={styles.documentIcon}>
                  <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.documentInfo}>
                  <ThemedText style={[styles.documentName, { color: appColors.textPrimary }]}>{doc.name}</ThemedText>
                  <ThemedText style={[styles.documentType, { color: appColors.textSecondary }]}>{doc.type}</ThemedText>
                </View>
                <Ionicons name="download-outline" size={20} color={appColors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Risk Disclosure */}
        <View style={styles.riskSection}>
          <View style={styles.riskHeader}>
            <Ionicons name="warning-outline" size={20} color={appColors.warning} />
            <ThemedText style={[styles.riskTitle, { color: appColors.warning }]}>Risk Disclosure</ThemedText>
          </View>
          <ThemedText style={[styles.riskText, { color: appColors.textSecondary }]}>
            Investing in startups and early-stage companies involves substantial risk, including 
            the risk of loss of your entire investment. Past performance is not indicative of 
            future results. Please invest responsibly and consult with a financial advisor.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Invest Button */}
      {deal.status === 'open' || deal.status === 'closing_soon' ? (
        <View style={[styles.footer, { backgroundColor: appColors.surface, borderTopColor: appColors.border }]}>
          <View style={styles.footerInfo}>
            <ThemedText style={[styles.footerLabel, { color: appColors.textSecondary }]}>Min Investment</ThemedText>
            <ThemedText style={[styles.footerValue, { color: appColors.textPrimary }]}>{formatCurrency(deal.min_investment)}</ThemedText>
          </View>
          <TouchableOpacity style={styles.investButton} onPress={handleInvest}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.investGradient}
            >
              <ThemedText style={styles.investButtonText}>Invest Now</ThemedText>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  shareButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  companyLogo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  logoPlaceholder: {
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    ...Typography.title,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  categoryText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
  },
  metricsCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 40,
  },
  metricLabel: {
    ...Typography.small,
  },
  metricValue: {
    ...Typography.heading,
    marginTop: 2,
  },
  progressContainer: {
    marginVertical: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.small,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    ...Typography.body,
    lineHeight: 24,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  highlightText: {
    ...Typography.body,
    flex: 1,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  teamAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...Typography.body,
    fontWeight: '600',
  },
  teamRole: {
    ...Typography.caption,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...Typography.body,
    fontWeight: '500',
  },
  documentType: {
    ...Typography.small,
  },
  riskSection: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.warning + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    marginBottom: Spacing.xl,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  riskTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  riskText: {
    ...Typography.small,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  footerInfo: {
    marginRight: Spacing.lg,
  },
  footerLabel: {
    ...Typography.small,
  },
  footerValue: {
    ...Typography.heading,
  },
  investButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.button,
  },
  investGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  investButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
});
