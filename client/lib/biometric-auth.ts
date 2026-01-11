/**
 * Biometric Authentication Service
 * Face ID / Touch ID / Fingerprint support
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  supportedTypes: BiometricType[];
}

export interface StoredCredentials {
  email: string;
  password: string;
}

class BiometricAuthService {
  /**
   * Check if biometric authentication is available on device
   */
  async checkBiometricAvailability(): Promise<BiometricStatus> {
    try {
      // Check if hardware is available
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      
      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Determine primary biometric type
      let biometricType: BiometricType = 'none';
      const typeNames: BiometricType[] = [];
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'facial';
        typeNames.push('facial');
      }
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        if (biometricType === 'none') biometricType = 'fingerprint';
        typeNames.push('fingerprint');
      }
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        if (biometricType === 'none') biometricType = 'iris';
        typeNames.push('iris');
      }

      return {
        isAvailable,
        isEnrolled,
        biometricType,
        supportedTypes: typeNames,
      };
    } catch (error) {
      console.error('[Biometric] Error checking availability:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        biometricType: 'none',
        supportedTypes: [],
      };
    }
  }

  /**
   * Get human-readable name for biometric type
   */
  getBiometricName(type: BiometricType): string {
    switch (type) {
      case 'facial':
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case 'fingerprint':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case 'iris':
        return 'Iris Recognition';
      default:
        return 'Biometric';
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const status = await this.checkBiometricAvailability();
      
      if (!status.isAvailable) {
        return { success: false, error: 'Biometric authentication not available' };
      }
      
      if (!status.isEnrolled) {
        return { success: false, error: 'No biometrics enrolled on this device' };
      }

      const biometricName = this.getBiometricName(status.biometricType);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || `Authenticate with ${biometricName}`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        let errorMessage = 'Authentication failed';
        
        switch (result.error) {
          case 'user_cancel':
            errorMessage = 'Authentication cancelled';
            break;
          case 'user_fallback':
            errorMessage = 'User chose password fallback';
            break;
          case 'system_cancel':
            errorMessage = 'Authentication was cancelled by the system';
            break;
          case 'not_enrolled':
            errorMessage = 'No biometrics enrolled';
            break;
          case 'lockout':
            errorMessage = 'Too many failed attempts. Try again later.';
            break;
          default:
            errorMessage = result.error || 'Authentication failed';
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('[Biometric] Authentication error:', error);
      return { success: false, error: 'An error occurred during authentication' };
    }
  }

  /**
   * Check if biometric login is enabled for the app
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[Biometric] Error checking enabled status:', error);
      return false;
    }
  }

  /**
   * Enable biometric login and store credentials
   */
  async enableBiometricLogin(email: string, password: string): Promise<boolean> {
    try {
      // First authenticate to confirm identity
      const authResult = await this.authenticate('Confirm your identity to enable biometric login');
      
      if (!authResult.success) {
        return false;
      }

      // Store credentials securely
      const credentials: StoredCredentials = { email, password };
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify(credentials),
        {
          keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        }
      );

      // Mark biometric as enabled
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

      return true;
    } catch (error) {
      console.error('[Biometric] Error enabling biometric login:', error);
      return false;
    }
  }

  /**
   * Disable biometric login and clear stored credentials
   */
  async disableBiometricLogin(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      return true;
    } catch (error) {
      console.error('[Biometric] Error disabling biometric login:', error);
      return false;
    }
  }

  /**
   * Get stored credentials after biometric authentication
   */
  async getCredentialsWithBiometric(): Promise<StoredCredentials | null> {
    try {
      // Check if biometric login is enabled
      const isEnabled = await this.isBiometricLoginEnabled();
      if (!isEnabled) {
        return null;
      }

      // Authenticate with biometrics
      const authResult = await this.authenticate('Sign in with biometrics');
      if (!authResult.success) {
        return null;
      }

      // Retrieve stored credentials
      const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!credentialsJson) {
        return null;
      }

      return JSON.parse(credentialsJson) as StoredCredentials;
    } catch (error) {
      console.error('[Biometric] Error getting credentials:', error);
      return null;
    }
  }

  /**
   * Update stored password (e.g., after password change)
   */
  async updateStoredPassword(newPassword: string): Promise<boolean> {
    try {
      const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!credentialsJson) {
        return false;
      }

      const credentials: StoredCredentials = JSON.parse(credentialsJson);
      credentials.password = newPassword;

      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify(credentials),
        {
          keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        }
      );

      return true;
    } catch (error) {
      console.error('[Biometric] Error updating password:', error);
      return false;
    }
  }

  /**
   * Prompt user to enable biometric login
   */
  async promptEnableBiometric(
    email: string,
    password: string,
    onSuccess?: () => void
  ): Promise<void> {
    const status = await this.checkBiometricAvailability();
    
    if (!status.isAvailable || !status.isEnrolled) {
      return;
    }

    const biometricName = this.getBiometricName(status.biometricType);

    Alert.alert(
      `Enable ${biometricName}?`,
      `Would you like to use ${biometricName} to sign in faster next time?`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Enable',
          onPress: async () => {
            const success = await this.enableBiometricLogin(email, password);
            if (success) {
              Alert.alert('Success', `${biometricName} login enabled!`);
              onSuccess?.();
            }
          },
        },
      ]
    );
  }
}

export const biometricAuth = new BiometricAuthService();
