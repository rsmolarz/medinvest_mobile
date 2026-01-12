import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type EventProperties = Record<string, string | number | boolean | undefined>;

interface UserProperties {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  provider?: string;
  isVerified?: boolean;
  isAccredited?: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface AnalyticsConfig {
  debug?: boolean;
  enabled?: boolean;
}

class Analytics {
  private debug: boolean;
  private enabled: boolean;
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private sessionId: string;
  private sessionStartTime: number;

  constructor(config: AnalyticsConfig = {}) {
    this.debug = config.debug ?? __DEV__;
    this.enabled = config.enabled ?? true;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[Analytics] ${message}`, data ?? '');
    }
  }

  private getDeviceInfo() {
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      deviceBrand: Device.brand,
      deviceModel: Device.modelName,
      deviceType: Device.deviceType,
      isDevice: Device.isDevice,
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
      appName: Constants.expoConfig?.name ?? 'MedInvest',
    };
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.enabled) return;

    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties };
    
    this.log('User identified', { userId, properties });
  }

  setUserProperties(properties: UserProperties): void {
    if (!this.enabled) return;

    this.userProperties = { ...this.userProperties, ...properties };
    this.log('User properties updated', properties);
  }

  track(eventName: string, properties?: EventProperties): void {
    if (!this.enabled) return;

    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        ...properties,
        ...this.getDeviceInfo(),
      },
    };

    this.log(`Event: ${eventName}`, event);
  }

  screen(screenName: string, properties?: EventProperties): void {
    this.track('Screen View', {
      screen_name: screenName,
      ...properties,
    });
  }

  trackInvestmentView(investmentId: string, investmentName: string): void {
    this.track('Investment Viewed', {
      investment_id: investmentId,
      investment_name: investmentName,
    });
  }

  trackInvestmentStarted(investmentId: string, amount: number): void {
    this.track('Investment Started', {
      investment_id: investmentId,
      amount,
    });
  }

  trackInvestmentCompleted(investmentId: string, amount: number): void {
    this.track('Investment Completed', {
      investment_id: investmentId,
      amount,
    });
  }

  trackArticleRead(articleId: string, articleTitle: string, readTime?: number): void {
    this.track('Article Read', {
      article_id: articleId,
      article_title: articleTitle,
      read_time_seconds: readTime,
    });
  }

  trackSearch(query: string, resultsCount: number, category?: string): void {
    this.track('Search Performed', {
      query,
      results_count: resultsCount,
      category,
    });
  }

  trackSignIn(provider: string): void {
    this.track('Sign In', { provider });
  }

  trackSignOut(): void {
    this.track('Sign Out');
  }

  trackError(error: Error, context?: string): void {
    this.track('Error', {
      error_message: error.message,
      error_name: error.name,
      context,
    });
  }

  trackButtonPress(buttonName: string, screen?: string): void {
    this.track('Button Press', {
      button_name: buttonName,
      screen,
    });
  }

  startSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.track('Session Started');
  }

  endSession(): void {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    this.track('Session Ended', {
      session_duration_seconds: sessionDuration,
    });
  }

  reset(): void {
    this.userId = null;
    this.userProperties = {};
    this.startSession();
    this.log('Analytics reset');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
  }
}

export const analytics = new Analytics();

export default analytics;
