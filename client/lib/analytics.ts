/**
 * Analytics Service
 * Track user events and screen views
 */

import { Platform } from 'react-native';

// Event types for type safety
export type AnalyticsEvent =
  | 'app_open'
  | 'screen_view'
  | 'login'
  | 'logout'
  | 'signup'
  | 'post_create'
  | 'post_view'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'post_bookmark'
  | 'user_follow'
  | 'user_unfollow'
  | 'user_profile_view'
  | 'message_send'
  | 'conversation_start'
  | 'deal_view'
  | 'deal_invest_click'
  | 'ama_view'
  | 'ama_question'
  | 'course_view'
  | 'course_enroll'
  | 'event_view'
  | 'event_rsvp'
  | 'search'
  | 'notification_open'
  | 'ai_chat_message'
  | 'premium_view'
  | 'premium_subscribe'
  | 'room_join'
  | 'room_leave'
  | 'achievement_unlock'
  | 'error';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface UserTraits {
  userId?: number;
  email?: string;
  name?: string;
  specialty?: string;
  isPremium?: boolean;
  level?: number;
  createdAt?: string;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private sessionId: string;
  private queue: Array<{ event: string; properties: AnalyticsProperties; timestamp: number }> = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start periodic flush of queued events
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Identify user for analytics
   */
  identify(userId: string, traits?: UserTraits): void {
    this.userId = userId;
    
    if (!this.isEnabled) return;

    this.queueEvent('identify', {
      userId,
      ...traits,
    });

    // Also send to any third-party analytics
    this.sendToProviders('identify', { userId, traits });
  }

  /**
   * Clear user identity (on logout)
   */
  reset(): void {
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!this.isEnabled) return;

    const enrichedProperties = this.enrichProperties(properties);
    
    this.queueEvent(event, enrichedProperties);
    this.sendToProviders('track', { event, properties: enrichedProperties });
  }

  /**
   * Track screen view
   */
  screen(screenName: string, properties?: AnalyticsProperties): void {
    if (!this.isEnabled) return;

    const enrichedProperties = {
      screen_name: screenName,
      ...this.enrichProperties(properties),
    };

    this.queueEvent('screen_view', enrichedProperties);
    this.sendToProviders('screen', { screenName, properties: enrichedProperties });
  }

  /**
   * Enrich properties with common data
   */
  private enrichProperties(properties?: AnalyticsProperties): AnalyticsProperties {
    return {
      ...properties,
      session_id: this.sessionId,
      user_id: this.userId,
      platform: Platform.OS,
      platform_version: Platform.Version,
      timestamp: Date.now(),
      app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    };
  }

  /**
   * Queue event for batch sending
   */
  private queueEvent(event: string, properties: AnalyticsProperties): void {
    this.queue.push({
      event,
      properties,
      timestamp: Date.now(),
    });

    // Auto-flush if queue is too large
    if (this.queue.length >= 20) {
      this.flush();
    }
  }

  /**
   * Flush queued events to server
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send to your analytics backend
      // await analyticsApi.trackBatch(events);
      
      if (__DEV__) {
        console.log('[Analytics] Flushed', events.length, 'events');
      }
    } catch (error) {
      // Re-queue failed events
      this.queue = [...events, ...this.queue];
      console.error('[Analytics] Flush failed:', error);
    }
  }

  /**
   * Send to third-party analytics providers
   */
  private sendToProviders(
    type: 'identify' | 'track' | 'screen',
    data: Record<string, unknown>
  ): void {
    // Integrate with providers here:
    // - Mixpanel
    // - Amplitude
    // - Segment
    // - Firebase Analytics
    // - etc.

    if (__DEV__) {
      console.log(`[Analytics] ${type}:`, data);
    }
  }

  /**
   * Track timing events
   */
  timing(category: string, variable: string, value: number, label?: string): void {
    this.track('timing' as AnalyticsEvent, {
      timing_category: category,
      timing_variable: variable,
      timing_value: value,
      timing_label: label,
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: AnalyticsProperties): void {
    this.track('error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500),
      ...context,
    });
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Common event tracking helpers
export const analytics = new AnalyticsService();

// Convenience methods
export const trackPostCreate = (postId: number, roomSlug?: string, isAnonymous?: boolean) => {
  analytics.track('post_create', { post_id: postId, room_slug: roomSlug, is_anonymous: isAnonymous });
};

export const trackPostView = (postId: number) => {
  analytics.track('post_view', { post_id: postId });
};

export const trackPostLike = (postId: number) => {
  analytics.track('post_like', { post_id: postId });
};

export const trackPostComment = (postId: number) => {
  analytics.track('post_comment', { post_id: postId });
};

export const trackPostShare = (postId: number, method: string) => {
  analytics.track('post_share', { post_id: postId, share_method: method });
};

export const trackUserFollow = (userId: number) => {
  analytics.track('user_follow', { followed_user_id: userId });
};

export const trackSearch = (query: string, resultCount: number, type: string) => {
  analytics.track('search', { query, result_count: resultCount, search_type: type });
};

export const trackDealView = (dealId: number, category: string) => {
  analytics.track('deal_view', { deal_id: dealId, deal_category: category });
};

export const trackAIChatMessage = (messageLength: number) => {
  analytics.track('ai_chat_message', { message_length: messageLength });
};

export const trackPremiumView = (source: string) => {
  analytics.track('premium_view', { source });
};

export const trackNotificationOpen = (notificationType: string) => {
  analytics.track('notification_open', { notification_type: notificationType });
};
