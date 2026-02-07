/**
 * Terms of Service Screen
 * Display app terms of service
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';

const TERMS_URL = 'https://medinvest.com/terms';
const SUPPORT_EMAIL = 'legal@medinvest.com';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();

  const handleOpenWebsite = () => {
    Linking.openURL(TERMS_URL);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Terms of Service</ThemedText>
        <TouchableOpacity style={styles.webButton} onPress={handleOpenWebsite}>
          <Ionicons name="open-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={[styles.lastUpdated, { color: appColors.textSecondary }]}>Last updated: January 2026</ThemedText>

        <Section title="1. Agreement to Terms">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            By accessing or using MedInvest, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </ThemedText>
        </Section>

        <Section title="2. Eligibility">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            You must be at least 18 years old to use MedInvest. By using our services, you represent that you meet this requirement and have the legal capacity to enter into this agreement.
          </ThemedText>
        </Section>

        <Section title="3. Your Account">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to:
          </ThemedText>
          <BulletList items={[
            'Provide accurate and complete information',
            'Keep your password secure and confidential',
            'Notify us immediately of any unauthorized access',
            'Not share your account with others',
          ]} />
        </Section>

        <Section title="4. Acceptable Use">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            You agree not to:
          </ThemedText>
          <BulletList items={[
            'Post false, misleading, or fraudulent content',
            'Harass, threaten, or intimidate other users',
            'Share confidential investment information unlawfully',
            'Manipulate or attempt to manipulate markets',
            'Violate any applicable laws or regulations',
            'Impersonate others or misrepresent your credentials',
            'Use automated systems to access the service',
            'Attempt to circumvent security measures',
          ]} />
        </Section>

        <Section title="5. User Content">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            You retain ownership of content you post but grant us a license to use, display, and distribute it on our platform. You are solely responsible for your content and must ensure it does not infringe on others' rights.
          </ThemedText>
        </Section>

        <Section title="6. Investment Disclaimer">
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={24} color={appColors.warning} />
            <ThemedText style={[styles.warningText, { color: appColors.textPrimary }]}>
              MedInvest does not provide investment advice. All investment information is for educational purposes only. Always consult with qualified financial professionals before making investment decisions.
            </ThemedText>
          </View>
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            We do not guarantee the accuracy of any investment-related content posted by users or third parties. Investment in healthcare ventures involves significant risk, including potential loss of capital.
          </ThemedText>
        </Section>

        <Section title="7. Premium Subscription">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            Premium subscriptions are billed according to the plan selected. Subscriptions auto-renew unless cancelled 24 hours before the renewal date. Refunds are subject to our refund policy and app store guidelines.
          </ThemedText>
        </Section>

        <Section title="8. Termination">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            We may suspend or terminate your account for violations of these terms. You may delete your account at any time through the app settings.
          </ThemedText>
        </Section>

        <Section title="9. Limitation of Liability">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            To the maximum extent permitted by law, MedInvest shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
          </ThemedText>
        </Section>

        <Section title="10. Changes to Terms">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            We reserve the right to modify these terms at any time. We will notify you of significant changes. Continued use of the service after changes constitutes acceptance of the new terms.
          </ThemedText>
        </Section>

        <Section title="11. Governing Law">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
          </ThemedText>
        </Section>

        <Section title="12. Contact">
          <ThemedText style={[styles.paragraph, { color: appColors.textSecondary }]}>
            For questions about these terms, contact us at:
          </ThemedText>
          <TouchableOpacity 
            style={styles.contactButton} 
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <ThemedText style={styles.contactText}>{SUPPORT_EMAIL}</ThemedText>
          </TouchableOpacity>
        </Section>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const appColors = useAppColors();
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>{title}</ThemedText>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  const appColors = useAppColors();
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletItem}>
          <View style={styles.bullet} />
          <ThemedText style={[styles.bulletText, { color: appColors.textSecondary }]}>{item}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  webButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  lastUpdated: {
    ...Typography.small,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  paragraph: {
    ...Typography.body,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  bulletList: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: Spacing.md,
  },
  bulletText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  warningText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  contactText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: Spacing['3xl'],
  },
});
