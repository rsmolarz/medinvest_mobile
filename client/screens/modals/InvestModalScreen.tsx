import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, typography, spacing, layout, shadows } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

// Types
interface PaymentMethod {
  id: string;
  type: 'bank' | 'card';
  name: string;
  last4: string;
  isDefault: boolean;
}

// Mock data
const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: '1', type: 'bank', name: 'Chase Checking', last4: '4567', isDefault: true },
  { id: '2', type: 'card', name: 'Visa', last4: '1234', isDefault: false },
];

const MOCK_INVESTMENT = {
  id: '1',
  name: 'NeuroLink Diagnostics',
  category: 'Digital Health',
  minimumInvestment: 1000,
  expectedROI: '15-22%',
};

// Preset amounts
const PRESET_AMOUNTS = [1000, 5000, 10000, 25000];

/**
 * Invest Modal Screen
 */
export default function InvestModalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'InvestModal'>>();

  const [amount, setAmount] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState(
    MOCK_PAYMENT_METHODS.find((p) => p.isDefault)?.id || ''
  );
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
  const isValidAmount = numericAmount >= MOCK_INVESTMENT.minimumInvestment;
  const canSubmit = isValidAmount && selectedPaymentId && riskAcknowledged && termsAccepted;

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters except decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimals
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setAmount(formatted);
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit investment to API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        'Investment Submitted!',
        `Your investment of $${numericAmount.toLocaleString()} in ${MOCK_INVESTMENT.name} has been submitted for processing.`,
        [
          {
            text: 'View Portfolio',
            onPress: () => {
              navigation.goBack();
              // Navigate to portfolio
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit investment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, numericAmount, navigation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={handleClose}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Invest</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          <Text
            style={[
              styles.reviewButton,
              (!canSubmit || isSubmitting) && styles.reviewButtonDisabled,
            ]}
          >
            {isSubmitting ? 'Processing...' : 'Review'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Project Summary */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIcon}>
            <Feather name="activity" size={24} color={colors.primary.main} />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryName}>{MOCK_INVESTMENT.name}</Text>
            <Text style={styles.summaryCategory}>{MOCK_INVESTMENT.category}</Text>
          </View>
          <View style={styles.summaryROI}>
            <Text style={styles.roiLabel}>Expected ROI</Text>
            <Text style={styles.roiValue}>{MOCK_INVESTMENT.expectedROI}</Text>
          </View>
        </Animated.View>

        {/* Amount Input */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Investment Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
          <Text style={styles.minimumText}>
            Minimum investment: {formatCurrency(MOCK_INVESTMENT.minimumInvestment)}
          </Text>

          {/* Preset Amounts */}
          <View style={styles.presetContainer}>
            {PRESET_AMOUNTS.map((preset) => (
              <Pressable
                key={preset}
                style={[
                  styles.presetButton,
                  numericAmount === preset && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetAmount(preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    numericAmount === preset && styles.presetTextActive,
                  ]}
                >
                  {formatCurrency(preset)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {MOCK_PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentId === method.id && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentId(method.id)}
            >
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
              <View
                style={[
                  styles.radioOuter,
                  selectedPaymentId === method.id && styles.radioOuterSelected,
                ]}
              >
                {selectedPaymentId === method.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </Pressable>
          ))}
          <Pressable style={styles.addPaymentButton}>
            <Feather name="plus" size={20} color={colors.primary.main} />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </Pressable>
        </Animated.View>

        {/* Acknowledgements */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Acknowledgements</Text>
          
          {/* Risk Acknowledgment */}
          <View style={styles.checkboxRow}>
            <Switch
              value={riskAcknowledged}
              onValueChange={setRiskAcknowledged}
              trackColor={{
                false: colors.border.medium,
                true: colors.primary.light,
              }}
              thumbColor={riskAcknowledged ? colors.primary.main : colors.surface.primary}
            />
            <Text style={styles.checkboxText}>
              I understand that this investment carries risk and I may lose some or all of my investment.
            </Text>
          </View>

          {/* Terms Acceptance */}
          <View style={styles.checkboxRow}>
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{
                false: colors.border.medium,
                true: colors.primary.light,
              }}
              thumbColor={termsAccepted ? colors.primary.main : colors.surface.primary}
            />
            <Text style={styles.checkboxText}>
              I have read and agree to the{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Investment Agreement</Text>.
            </Text>
          </View>
        </Animated.View>

        {/* Summary */}
        {isValidAmount && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(500)}
            style={styles.totalCard}
          >
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Investment Amount</Text>
              <Text style={styles.totalValue}>{formatCurrency(numericAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Processing Fee</Text>
              <Text style={styles.totalValue}>$0</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabelBold}>Total</Text>
              <Text style={styles.totalValueBold}>{formatCurrency(numericAmount)}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  cancelButton: {
    ...typography.body,
    color: colors.text.secondary,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  reviewButton: {
    ...typography.bodyMedium,
    color: colors.primary.main,
  },
  reviewButtonDisabled: {
    color: colors.text.tertiary,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Summary Card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.xl,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  summaryCategory: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  summaryROI: {
    alignItems: 'flex-end',
  },
  roiLabel: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  roiValue: {
    ...typography.bodyMedium,
    color: colors.semantic.success,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusMedium,
    borderWidth: 2,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currencySymbol: {
    ...typography.hero,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    ...typography.hero,
    color: colors.text.primary,
  },
  minimumText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  presetButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: layout.radiusFull,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  presetButtonActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.transparent.primary10,
  },
  presetText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  presetTextActive: {
    color: colors.primary.main,
  },

  // Payment Method
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  paymentMethodSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.transparent.primary10,
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
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary.main,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.main,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.primary.main,
    borderStyle: 'dashed',
  },
  addPaymentText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
  },

  // Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  checkboxText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.md,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },

  // Total Card
  totalCard: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  totalValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },
  totalLabelBold: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  totalValueBold: {
    ...typography.heading,
    color: colors.text.primary,
  },
});
