/**
 * App Rating Prompt
 * Smart prompts to ask users to rate the app
 */

import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

// Configuration
const CONFIG = {
  // Minimum days since install before showing prompt
  MIN_DAYS_SINCE_INSTALL: 3,
  
  // Minimum app launches before showing prompt
  MIN_LAUNCHES: 5,
  
  // Minimum positive actions (posts, comments, likes) before prompting
  MIN_POSITIVE_ACTIONS: 10,
  
  // Days between prompts if user dismisses
  DAYS_BETWEEN_PROMPTS: 30,
  
  // Maximum times to prompt (ever)
  MAX_PROMPTS: 3,
  
  // Store URLs
  APP_STORE_URL: 'https://apps.apple.com/app/idXXXXXXXXXX?action=write-review',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.medinvest.app',
};

// Storage keys
const STORAGE_KEYS = {
  INSTALL_DATE: 'rating_install_date',
  LAUNCH_COUNT: 'rating_launch_count',
  ACTION_COUNT: 'rating_action_count',
  LAST_PROMPT_DATE: 'rating_last_prompt_date',
  PROMPT_COUNT: 'rating_prompt_count',
  HAS_RATED: 'rating_has_rated',
  NEVER_ASK: 'rating_never_ask',
};

// Rating prompt result
export type RatingResult = 'rated' | 'later' | 'never' | 'error';

/**
 * App Rating Service
 */
class AppRatingService {
  private initialized = false;
  private installDate: Date | null = null;
  private launchCount = 0;
  private actionCount = 0;
  private lastPromptDate: Date | null = null;
  private promptCount = 0;
  private hasRated = false;
  private neverAsk = false;

  /**
   * Initialize the service (call on app start)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load stored values
      const [
        installDateStr,
        launchCountStr,
        actionCountStr,
        lastPromptDateStr,
        promptCountStr,
        hasRatedStr,
        neverAskStr,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INSTALL_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.LAUNCH_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.ACTION_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_RATED),
        AsyncStorage.getItem(STORAGE_KEYS.NEVER_ASK),
      ]);

      // Set install date if first launch
      if (!installDateStr) {
        this.installDate = new Date();
        await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_DATE, this.installDate.toISOString());
      } else {
        this.installDate = new Date(installDateStr);
      }

      this.launchCount = parseInt(launchCountStr || '0', 10);
      this.actionCount = parseInt(actionCountStr || '0', 10);
      this.lastPromptDate = lastPromptDateStr ? new Date(lastPromptDateStr) : null;
      this.promptCount = parseInt(promptCountStr || '0', 10);
      this.hasRated = hasRatedStr === 'true';
      this.neverAsk = neverAskStr === 'true';

      // Increment launch count
      this.launchCount++;
      await AsyncStorage.setItem(STORAGE_KEYS.LAUNCH_COUNT, this.launchCount.toString());

      this.initialized = true;
    } catch (error) {
      console.error('[AppRating] Error initializing:', error);
    }
  }

  /**
   * Track a positive action (call after user does something good)
   */
  async trackPositiveAction(): Promise<void> {
    this.actionCount++;
    await AsyncStorage.setItem(STORAGE_KEYS.ACTION_COUNT, this.actionCount.toString());
  }

  /**
   * Check if we should show the rating prompt
   */
  shouldShowPrompt(): boolean {
    if (!this.initialized) return false;
    if (this.hasRated) return false;
    if (this.neverAsk) return false;
    if (this.promptCount >= CONFIG.MAX_PROMPTS) return false;

    // Check minimum launches
    if (this.launchCount < CONFIG.MIN_LAUNCHES) return false;

    // Check minimum actions
    if (this.actionCount < CONFIG.MIN_POSITIVE_ACTIONS) return false;

    // Check minimum days since install
    if (this.installDate) {
      const daysSinceInstall = this.getDaysSince(this.installDate);
      if (daysSinceInstall < CONFIG.MIN_DAYS_SINCE_INSTALL) return false;
    }

    // Check days since last prompt
    if (this.lastPromptDate) {
      const daysSincePrompt = this.getDaysSince(this.lastPromptDate);
      if (daysSincePrompt < CONFIG.DAYS_BETWEEN_PROMPTS) return false;
    }

    return true;
  }

  /**
   * Show the native rating prompt
   */
  async showNativePrompt(): Promise<boolean> {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        await StoreReview.requestReview();
        await this.recordPromptShown();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AppRating] Error showing native prompt:', error);
      return false;
    }
  }

  /**
   * Show custom rating dialog
   */
  async showCustomPrompt(): Promise<RatingResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Enjoying MedInvest?',
        'If you\'re finding MedInvest helpful, would you mind taking a moment to rate us? It really helps!',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => {
              this.recordPromptShown();
              resolve('later');
            },
          },
          {
            text: 'Never Ask',
            style: 'destructive',
            onPress: () => {
              this.setNeverAsk();
              resolve('never');
            },
          },
          {
            text: 'Rate Now',
            onPress: async () => {
              const success = await this.openStoreForRating();
              if (success) {
                this.setHasRated();
                resolve('rated');
              } else {
                resolve('error');
              }
            },
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Show a satisfaction check before rating
   */
  async showSatisfactionCheck(): Promise<RatingResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'How\'s your experience?',
        'Are you enjoying MedInvest?',
        [
          {
            text: 'Not Really',
            style: 'cancel',
            onPress: () => {
              this.showFeedbackPrompt();
              resolve('later');
            },
          },
          {
            text: 'Yes!',
            onPress: () => {
              this.showRatingPrompt().then(resolve);
            },
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Show rating prompt after positive response
   */
  private async showRatingPrompt(): Promise<RatingResult> {
    // Try native prompt first
    const nativeShown = await this.showNativePrompt();
    
    if (!nativeShown) {
      // Fall back to custom prompt
      return this.showCustomPrompt();
    }

    // Assume user might have rated
    this.recordPromptShown();
    return 'later';
  }

  /**
   * Show feedback prompt for unhappy users
   */
  private showFeedbackPrompt(): void {
    Alert.alert(
      'We\'d love to hear from you',
      'Would you like to tell us how we can improve?',
      [
        {
          text: 'No Thanks',
          style: 'cancel',
          onPress: () => {
            this.recordPromptShown();
          },
        },
        {
          text: 'Send Feedback',
          onPress: () => {
            // Navigate to feedback screen or open email
            const email = 'feedback@medinvest.com';
            const subject = 'MedInvest App Feedback';
            Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
          },
        },
      ]
    );
  }

  /**
   * Open app store for rating
   */
  async openStoreForRating(): Promise<boolean> {
    try {
      const url = Platform.OS === 'ios' ? CONFIG.APP_STORE_URL : CONFIG.PLAY_STORE_URL;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AppRating] Error opening store:', error);
      return false;
    }
  }

  /**
   * Record that a prompt was shown
   */
  private async recordPromptShown(): Promise<void> {
    this.promptCount++;
    this.lastPromptDate = new Date();
    
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.PROMPT_COUNT, this.promptCount.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT_DATE, this.lastPromptDate.toISOString()),
    ]);
  }

  /**
   * Set that user has rated
   */
  private async setHasRated(): Promise<void> {
    this.hasRated = true;
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_RATED, 'true');
  }

  /**
   * Set that user never wants to be asked
   */
  private async setNeverAsk(): Promise<void> {
    this.neverAsk = true;
    await AsyncStorage.setItem(STORAGE_KEYS.NEVER_ASK, 'true');
  }

  /**
   * Calculate days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Reset all rating data (for testing)
   */
  async reset(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.INSTALL_DATE),
      AsyncStorage.removeItem(STORAGE_KEYS.LAUNCH_COUNT),
      AsyncStorage.removeItem(STORAGE_KEYS.ACTION_COUNT),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_PROMPT_DATE),
      AsyncStorage.removeItem(STORAGE_KEYS.PROMPT_COUNT),
      AsyncStorage.removeItem(STORAGE_KEYS.HAS_RATED),
      AsyncStorage.removeItem(STORAGE_KEYS.NEVER_ASK),
    ]);

    this.initialized = false;
    this.launchCount = 0;
    this.actionCount = 0;
    this.promptCount = 0;
    this.hasRated = false;
    this.neverAsk = false;
    this.lastPromptDate = null;
    this.installDate = null;
  }

  /**
   * Get current stats (for debugging)
   */
  getStats() {
    return {
      installDate: this.installDate,
      launchCount: this.launchCount,
      actionCount: this.actionCount,
      promptCount: this.promptCount,
      lastPromptDate: this.lastPromptDate,
      hasRated: this.hasRated,
      neverAsk: this.neverAsk,
      shouldShow: this.shouldShowPrompt(),
    };
  }
}

export const appRatingService = new AppRatingService();

/**
 * Hook for app rating
 */
export function useAppRating() {
  const checkAndPrompt = async () => {
    await appRatingService.initialize();
    
    if (appRatingService.shouldShowPrompt()) {
      await appRatingService.showSatisfactionCheck();
    }
  };

  const trackAction = () => {
    appRatingService.trackPositiveAction();
  };

  const forcePrompt = () => {
    return appRatingService.showSatisfactionCheck();
  };

  return {
    checkAndPrompt,
    trackAction,
    forcePrompt,
    shouldShow: () => appRatingService.shouldShowPrompt(),
    getStats: () => appRatingService.getStats(),
  };
}

/**
 * Convenience function to track positive actions
 * Call this after: creating post, liking, commenting, completing investment, etc.
 */
export const trackPositiveAction = () => {
  appRatingService.trackPositiveAction();
};
