/**
 * Register Screen
 * New user registration with validation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail, validatePassword } from '@/lib/utils';
import { getApiUrl } from '@/lib/query-client';

const SPECIALTIES = [
  'Select your specialty',
  // Primary Care
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Emergency Medicine',
  'Geriatric Medicine',
  // Medical Specialties
  'Allergy & Immunology',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Infectious Disease',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Pulmonology',
  'Rheumatology',
  // Surgical Specialties
  'General Surgery',
  'Cardiothoracic Surgery',
  'Colorectal Surgery',
  'Neurological Surgery',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'Oral & Maxillofacial Surgery',
  'Orthopedic Surgery',
  'Otolaryngology (ENT)',
  'Pediatric Surgery',
  'Plastic Surgery',
  'Transplant Surgery',
  'Trauma Surgery',
  'Urology',
  'Vascular Surgery',
  // Diagnostic Specialties
  'Pathology',
  'Radiology',
  'Nuclear Medicine',
  // Other Medical Specialties
  'Anesthesiology',
  'Critical Care Medicine',
  'Hospice & Palliative Medicine',
  'Pain Medicine',
  'Physical Medicine & Rehabilitation',
  'Preventive Medicine',
  'Sleep Medicine',
  'Sports Medicine',
  // Psychiatry & Mental Health
  'Psychiatry',
  'Child & Adolescent Psychiatry',
  'Addiction Medicine',
  // Other Healthcare
  'Neonatology',
  'Genetics & Genomics',
  'Medical Toxicology',
  'Aerospace Medicine',
  'Occupational Medicine',
  // Non-Clinical Roles
  'Investor',
  'Venture Capital',
  'Private Equity',
  'Healthcare Executive',
  'Hospital Administrator',
  'Pharmaceutical Industry',
  'Medical Device Industry',
  'Biotechnology',
  'Researcher',
  'Academic Medicine',
  'Public Health',
  'Health Policy',
  'Medical Student',
  'Resident/Fellow',
  'Nurse Practitioner',
  'Physician Assistant',
  'Other Healthcare Professional',
  'Other',
];

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  const { register, isLoading, error, clearError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    clearError();

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const success = await register({
      email,
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      specialty: specialty && specialty !== 'Select your specialty' ? specialty : undefined,
      referral_code: referralCode.trim() || undefined,
    });

    if (!success && error) {
      Alert.alert('Registration Failed', error);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const openTerms = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      await WebBrowser.openBrowserAsync(`${baseUrl}terms`);
    } catch (err) {
      console.error('Failed to open Terms of Service:', err);
    }
  }, []);

  const openPrivacy = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      await WebBrowser.openBrowserAsync(`${baseUrl}privacy`);
    } catch (err) {
      console.error('Failed to open Privacy Policy:', err);
    }
  }, []);

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
            </TouchableOpacity>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Ionicons name="medical" size={32} color="white" />
            </LinearGradient>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Create Account</ThemedText>
            <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>
              Join the MedInvest community
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>First Name</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: appColors.background }, errors.firstName && { borderColor: appColors.error }]}>
                  <TextInput
                    style={[styles.input, { color: appColors.textPrimary }]}
                    placeholder="First"
                    placeholderTextColor={appColors.textSecondary}
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      clearFieldError('firstName');
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.firstName && (
                  <ThemedText style={[styles.errorText, { color: appColors.error }]}>{errors.firstName}</ThemedText>
                )}
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: Spacing.md }]}>
                <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Last Name</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: appColors.background }, errors.lastName && { borderColor: appColors.error }]}>
                  <TextInput
                    style={[styles.input, { color: appColors.textPrimary }]}
                    placeholder="Last"
                    placeholderTextColor={appColors.textSecondary}
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      clearFieldError('lastName');
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.lastName && (
                  <ThemedText style={[styles.errorText, { color: appColors.error }]}>{errors.lastName}</ThemedText>
                )}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Email</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: appColors.background }, errors.email && { borderColor: appColors.error }]}>
                <Ionicons name="mail-outline" size={20} color={appColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: appColors.textPrimary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={appColors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearFieldError('email');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <ThemedText style={[styles.errorText, { color: appColors.error }]}>{errors.email}</ThemedText>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: appColors.background }, errors.password && { borderColor: appColors.error }]}>
                <Ionicons name="lock-closed-outline" size={20} color={appColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: appColors.textPrimary }]}
                  placeholder="Create a password"
                  placeholderTextColor={appColors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearFieldError('password');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={appColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <ThemedText style={[styles.errorText, { color: appColors.error }]}>{errors.password}</ThemedText>
              )}
              <ThemedText style={[styles.passwordHint, { color: appColors.textSecondary }]}>
                Min 8 chars, uppercase, lowercase, and number
              </ThemedText>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Confirm Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: appColors.background }, errors.confirmPassword && { borderColor: appColors.error }]}>
                <Ionicons name="lock-closed-outline" size={20} color={appColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: appColors.textPrimary }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={appColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearFieldError('confirmPassword');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={appColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <ThemedText style={[styles.errorText, { color: appColors.error }]}>{errors.confirmPassword}</ThemedText>
              )}
            </View>

            {/* Specialty */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Specialty (Optional)</ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, { backgroundColor: appColors.background }]}
                onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
              >
                <Ionicons name="briefcase-outline" size={20} color={appColors.textSecondary} />
                <ThemedText style={[styles.pickerText, !specialty && { color: appColors.textSecondary }, specialty ? { color: appColors.textPrimary } : null]}>
                  {specialty || 'Select your specialty'}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color={appColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showSpecialtyPicker ? (
              <View style={[styles.pickerContainer, { backgroundColor: appColors.background }]}>
                <Picker
                  selectedValue={specialty}
                  onValueChange={(value) => {
                    setSpecialty(value);
                    setShowSpecialtyPicker(false);
                  }}
                >
                  {SPECIALTIES.map((s) => (
                    <Picker.Item key={s} label={s} value={s === 'Select your specialty' ? '' : s} />
                  ))}
                </Picker>
              </View>
            ) : null}

            {/* Referral Code */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Referral Code (Optional)</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: appColors.background }]}>
                <Ionicons name="gift-outline" size={20} color={appColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: appColors.textPrimary }]}
                  placeholder="Enter referral code"
                  placeholderTextColor={appColors.textSecondary}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.registerButtonText}>Create Account</ThemedText>
              )}
            </TouchableOpacity>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <ThemedText style={[styles.terms, { color: appColors.textSecondary }]}>
                By creating an account, you agree to our{' '}
              </ThemedText>
              <TouchableOpacity onPress={openTerms} testID="link-terms">
                <ThemedText style={[styles.terms, styles.termsLink]}>Terms of Service</ThemedText>
              </TouchableOpacity>
              <ThemedText style={[styles.terms, { color: appColors.textSecondary }]}> and </ThemedText>
              <TouchableOpacity onPress={openPrivacy} testID="link-privacy">
                <ThemedText style={[styles.terms, styles.termsLink]}>Privacy Policy</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: appColors.textSecondary }]}>Already have an account?</ThemedText>
            <TouchableOpacity onPress={handleLogin}>
              <ThemedText style={styles.loginText}> Sign In</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.sm,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: '100%',
  },
  pickerText: {
    flex: 1,
    ...Typography.body,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  passwordHint: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    ...Shadows.button,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  terms: {
    ...Typography.small,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  footerText: {
    ...Typography.body,
  },
  loginText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});
