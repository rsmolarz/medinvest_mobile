/**
 * Privacy Policy Screen
 * Display app privacy policy
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

const PRIVACY_POLICY_URL = 'https://medinvest.com/privacy';
const SUPPORT_EMAIL = 'privacy@medinvest.com';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();

  const handleOpenWebsite = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const handleContactPrivacy = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Privacy Policy</ThemedText>
        <TouchableOpacity style={styles.webButton} onPress={handleOpenWebsite}>
          <Ionicons name="open-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.lastUpdated}>Last updated: January 2026</ThemedText>

        {/* Introduction */}
        <Section title="Introduction">
          <ThemedText style={styles.paragraph}>
            MedInvest ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </ThemedText>
        </Section>

        {/* Information We Collect */}
        <Section title="Information We Collect">
          <ThemedText style={styles.subheading}>Personal Information</ThemedText>
          <ThemedText style={styles.paragraph}>
            When you create an account, we collect:
          </ThemedText>
          <BulletList items={[
            'Name and email address',
            'Professional specialty and credentials',
            'Profile photo (optional)',
            'Account preferences',
          ]} />

          <ThemedText style={styles.subheading}>Usage Information</ThemedText>
          <ThemedText style={styles.paragraph}>
            We automatically collect:
          </ThemedText>
          <BulletList items={[
            'Device information (model, OS version)',
            'App usage and interaction data',
            'IP address and general location',
            'Crash reports and performance data',
          ]} />

          <ThemedText style={styles.subheading}>User Content</ThemedText>
          <ThemedText style={styles.paragraph}>
            Content you create on the platform:
          </ThemedText>
          <BulletList items={[
            'Posts, comments, and messages',
            'Photos and videos you upload',
            'Reactions and bookmarks',
          ]} />
        </Section>

        {/* How We Use Information */}
        <Section title="How We Use Your Information">
          <BulletList items={[
            'Provide and maintain our services',
            'Personalize your experience and content',
            'Send notifications and updates',
            'Analyze usage to improve our platform',
            'Prevent fraud and ensure security',
            'Comply with legal obligations',
          ]} />
        </Section>

        {/* Sharing Information */}
        <Section title="Sharing Your Information">
          <ThemedText style={styles.paragraph}>
            We do not sell your personal information. We may share data with:
          </ThemedText>
          <BulletList items={[
            'Service providers (hosting, analytics, support)',
            'Legal authorities when required by law',
            'Business partners with your consent',
          ]} />
        </Section>

        {/* Data Security */}
        <Section title="Data Security">
          <ThemedText style={styles.paragraph}>
            We implement industry-standard security measures including encryption, secure data centers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
          </ThemedText>
        </Section>

        {/* Your Rights */}
        <Section title="Your Rights">
          <ThemedText style={styles.paragraph}>
            You have the right to:
          </ThemedText>
          <BulletList items={[
            'Access your personal data',
            'Correct inaccurate information',
            'Delete your account and data',
            'Export your data',
            'Opt-out of marketing communications',
            'Restrict certain data processing',
          ]} />
        </Section>

        {/* Data Retention */}
        <Section title="Data Retention">
          <ThemedText style={styles.paragraph}>
            We retain your data for as long as your account is active or as needed to provide services. You can request deletion at any time through account settings.
          </ThemedText>
        </Section>

        {/* Children's Privacy */}
        <Section title="Children's Privacy">
          <ThemedText style={styles.paragraph}>
            Our service is not intended for users under 18 years of age. We do not knowingly collect information from children.
          </ThemedText>
        </Section>

        {/* Changes */}
        <Section title="Changes to This Policy">
          <ThemedText style={styles.paragraph}>
            We may update this policy periodically. We will notify you of significant changes through the app or via email.
          </ThemedText>
        </Section>

        {/* Contact */}
        <Section title="Contact Us">
          <ThemedText style={styles.paragraph}>
            For privacy-related questions or requests:
          </ThemedText>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactPrivacy}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <ThemedText style={styles.contactText}>{SUPPORT_EMAIL}</ThemedText>
          </TouchableOpacity>
        </Section>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );
}

// Bullet list component
function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletItem}>
          <View style={styles.bullet} />
          <ThemedText style={styles.bulletText}>{item}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subheading: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  bulletList: {
    marginLeft: Spacing.sm,
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
    color: Colors.textSecondary,
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
