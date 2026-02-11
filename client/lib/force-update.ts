/**
 * Force Update Service
 * Require app update when critical updates are available
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { api } from '@/lib/api';

// Version info from server
interface VersionInfo {
  // Latest available version
  latestVersion: string;
  
  // Minimum required version (force update if below)
  minimumVersion: string;
  
  // Whether update is required
  updateRequired: boolean;
  
  // Whether update is recommended (soft prompt)
  updateRecommended: boolean;
  
  // Release notes
  releaseNotes?: string[];
  
  // Store URLs
  appStoreUrl?: string;
  playStoreUrl?: string;
}

// Update type
export type UpdateType = 'required' | 'recommended' | 'none';

// Store URLs
const STORE_URLS = {
  ios: 'https://apps.apple.com/app/idXXXXXXXXXX',
  android: 'https://play.google.com/store/apps/details?id=app.marketagent.trading',
};

/**
 * Compare semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Force Update Service
 */
class ForceUpdateService {
  private versionInfo: VersionInfo | null = null;
  private lastCheckTime: number = 0;
  private checkInterval = 1000 * 60 * 60; // 1 hour

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    // Expo Application gives us the native version
    return Application.nativeApplicationVersion || 
           Constants.expoConfig?.version || 
           '1.0.0';
  }

  /**
   * Get current build number
   */
  getBuildNumber(): string {
    return Application.nativeBuildVersion || '1';
  }

  /**
   * Check for updates from server
   */
  async checkForUpdates(): Promise<VersionInfo | null> {
    // Rate limit checks
    const now = Date.now();
    if (now - this.lastCheckTime < this.checkInterval && this.versionInfo) {
      return this.versionInfo;
    }

    try {
      const currentVersion = this.getCurrentVersion();
      const platform = Platform.OS;

      const response = await api.get('/app/version', {
        params: {
          currentVersion,
          platform,
          buildNumber: this.getBuildNumber(),
        },
      });

      if (response.data) {
        this.versionInfo = response.data;
        this.lastCheckTime = now;
        return this.versionInfo;
      }
    } catch (error) {
      console.error('[ForceUpdate] Error checking for updates:', error);
      
      // Return mock data for development
      return this.getMockVersionInfo();
    }

    return null;
  }

  /**
   * Mock version info for development
   */
  private getMockVersionInfo(): VersionInfo {
    const currentVersion = this.getCurrentVersion();
    
    return {
      latestVersion: currentVersion,
      minimumVersion: '1.0.0',
      updateRequired: false,
      updateRecommended: false,
      releaseNotes: [],
      appStoreUrl: STORE_URLS.ios,
      playStoreUrl: STORE_URLS.android,
    };
  }

  /**
   * Determine update type needed
   */
  async getUpdateType(): Promise<UpdateType> {
    const versionInfo = await this.checkForUpdates();
    if (!versionInfo) return 'none';

    const currentVersion = this.getCurrentVersion();

    // Check if below minimum required version
    if (compareVersions(currentVersion, versionInfo.minimumVersion) < 0) {
      return 'required';
    }

    // Check if below latest version
    if (compareVersions(currentVersion, versionInfo.latestVersion) < 0) {
      return 'recommended';
    }

    return 'none';
  }

  /**
   * Open app store for update
   */
  async openStore(): Promise<boolean> {
    const url = Platform.OS === 'ios' 
      ? (this.versionInfo?.appStoreUrl || STORE_URLS.ios)
      : (this.versionInfo?.playStoreUrl || STORE_URLS.android);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
    } catch (error) {
      console.error('[ForceUpdate] Error opening store:', error);
    }

    return false;
  }

  /**
   * Get version info
   */
  getVersionInfo(): VersionInfo | null {
    return this.versionInfo;
  }

  /**
   * Get release notes
   */
  getReleaseNotes(): string[] {
    return this.versionInfo?.releaseNotes || [];
  }
}

export const forceUpdateService = new ForceUpdateService();

// =============================================================================
// FORCE UPDATE MODAL
// =============================================================================

interface ForceUpdateModalProps {
  visible: boolean;
  updateType: UpdateType;
  versionInfo: VersionInfo | null;
  onUpdate: () => void;
  onLater?: () => void;
}

export const ForceUpdateModal = memo(function ForceUpdateModal({
  visible,
  updateType,
  versionInfo,
  onUpdate,
  onLater,
}: ForceUpdateModalProps) {
  const { colors } = useThemeContext();

  if (!visible || updateType === 'none') return null;

  const isRequired = updateType === 'required';

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons
              name={isRequired ? 'warning-outline' : 'arrow-up-circle-outline'}
              size={48}
              color={colors.primary}
            />
          </View>

          {/* Title */}
          <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
            {isRequired ? 'Update Required' : 'Update Available'}
          </ThemedText>

          {/* Version info */}
          <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>
            Version {versionInfo?.latestVersion} is available
          </ThemedText>

          {/* Description */}
          <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
            {isRequired
              ? 'A critical update is required to continue using MedInvest. Please update to the latest version.'
              : 'A new version of MedInvest is available with improvements and bug fixes.'}
          </ThemedText>

          {/* Release notes */}
          {versionInfo?.releaseNotes && versionInfo.releaseNotes.length > 0 && (
            <View style={[styles.releaseNotesContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText style={[styles.releaseNotesTitle, { color: colors.textPrimary }]}>
                What's New:
              </ThemedText>
              {versionInfo.releaseNotes.slice(0, 3).map((note, index) => (
                <View key={index} style={styles.releaseNoteItem}>
                  <ThemedText style={[styles.bulletPoint, { color: colors.primary }]}>•</ThemedText>
                  <ThemedText style={[styles.releaseNoteText, { color: colors.textSecondary }]}>
                    {note}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {!isRequired && onLater && (
              <TouchableOpacity
                style={[styles.laterButton, { borderColor: colors.border }]}
                onPress={() => {
                  haptics.buttonPress();
                  onLater();
                }}
              >
                <ThemedText style={[styles.laterButtonText, { color: colors.textPrimary }]}>
                  Later
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.updateButton,
                { backgroundColor: colors.primary },
                isRequired && styles.fullWidthButton,
              ]}
              onPress={() => {
                haptics.buttonPress();
                onUpdate();
              }}
            >
              <Ionicons name="download-outline" size={18} color="white" />
              <ThemedText style={styles.updateButtonText}>
                Update Now
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// =============================================================================
// HOOK
// =============================================================================

export function useForceUpdate() {
  const [showModal, setShowModal] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>('none');
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // Check on mount and app foreground
  useEffect(() => {
    checkForUpdates();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      checkForUpdates();
    }
  };

  const checkForUpdates = async () => {
    const type = await forceUpdateService.getUpdateType();
    const info = forceUpdateService.getVersionInfo();

    setUpdateType(type);
    setVersionInfo(info);

    if (type !== 'none') {
      setShowModal(true);
    }
  };

  const handleUpdate = async () => {
    await forceUpdateService.openStore();
  };

  const handleLater = () => {
    if (updateType !== 'required') {
      setShowModal(false);
    }
  };

  return {
    showModal,
    updateType,
    versionInfo,
    handleUpdate,
    handleLater,
    checkForUpdates,
    ForceUpdateModalComponent: () => (
      <ForceUpdateModal
        visible={showModal}
        updateType={updateType}
        versionInfo={versionInfo}
        onUpdate={handleUpdate}
        onLater={updateType === 'required' ? undefined : handleLater}
      />
    ),
  };
}

// =============================================================================
// VERSION DISPLAY COMPONENT
// =============================================================================

export const VersionDisplay = memo(function VersionDisplay() {
  const { colors } = useThemeContext();
  const version = forceUpdateService.getCurrentVersion();
  const build = forceUpdateService.getBuildNumber();

  return (
    <ThemedText style={[styles.versionDisplay, { color: colors.textSecondary }]}>
      Version {version} ({build})
    </ThemedText>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  versionText: {
    ...Typography.caption,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  releaseNotesContainer: {
    width: '100%',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  releaseNotesTitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  releaseNoteItem: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  bulletPoint: {
    ...Typography.body,
    marginRight: Spacing.sm,
  },
  releaseNoteText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
  },
  laterButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  laterButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  fullWidthButton: {
    flex: 1,
  },
  updateButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  versionDisplay: {
    ...Typography.small,
    textAlign: 'center',
  },
});
