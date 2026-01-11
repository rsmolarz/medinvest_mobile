import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, typography, spacing, layout } from '@/theme';

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const legalOptions = [
    { id: '1', title: 'Terms of Service', url: 'https://medinvest.app/terms' },
    { id: '2', title: 'Privacy Policy', url: 'https://medinvest.app/privacy' },
    { id: '3', title: 'Investment Disclosure', url: 'https://medinvest.app/disclosure' },
    { id: '4', title: 'Risk Disclaimer', url: 'https://medinvest.app/risk' },
    { id: '5', title: 'Cookie Policy', url: 'https://medinvest.app/cookies' },
  ];

  const handlePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {legalOptions.map((option) => (
          <Pressable
            key={option.id}
            style={styles.optionItem}
            onPress={() => handlePress(option.url)}
          >
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Feather name="external-link" size={18} color={colors.text.tertiary} />
          </Pressable>
        ))}

        <Text style={styles.footerText}>
          MedInvest is a registered investment platform. All investments carry risk
          and past performance does not guarantee future results. Please read all
          disclosures carefully before investing.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionTitle: {
    ...typography.body,
    color: colors.text.primary,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 20,
  },
});
