import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, typography, spacing, layout } from '@/theme';

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const paymentMethods = [
    { id: '1', type: 'bank', name: 'Chase Checking', last4: '4567', isDefault: true },
    { id: '2', type: 'card', name: 'Visa', last4: '1234', isDefault: false },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {paymentMethods.map((method) => (
          <Pressable key={method.id} style={styles.paymentItem}>
            <View style={styles.paymentIcon}>
              <Feather
                name={method.type === 'bank' ? 'home' : 'credit-card'}
                size={20}
                color={colors.primary.main}
              />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>{method.name}</Text>
              <Text style={styles.paymentLast4}>•••• {method.last4}</Text>
            </View>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
            <Feather name="chevron-right" size={20} color={colors.text.tertiary} />
          </Pressable>
        ))}

        <Pressable style={styles.addButton}>
          <Feather name="plus" size={20} color={colors.primary.main} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </Pressable>
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
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  paymentLast4: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  defaultBadge: {
    backgroundColor: colors.transparent.primary10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusSmall,
    marginRight: spacing.sm,
  },
  defaultText: {
    ...typography.small,
    color: colors.primary.main,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  addButtonText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
  },
});
