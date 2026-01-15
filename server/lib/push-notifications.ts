/**
 * Push Notification Service (Backend)
 * Send push notifications via Expo's Push API
 */

import { db, pushTokens, notifications } from '../db';
import { eq, and } from 'drizzle-orm';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  async sendToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
      sound?: boolean;
      badge?: number;
      channelId?: string;
    }
  ): Promise<boolean> {
    try {
      // Get user's push tokens
      const tokens = await db
        .select()
        .from(pushTokens)
        .where(eq(pushTokens.userId, userId.toString()));

      if (tokens.length === 0) {
        console.log(`No push tokens found for user ${userId}`);
        return false;
      }

      // Create messages for all tokens
      const messages: ExpoPushMessage[] = tokens.map(token => ({
        to: token.token,
        title,
        body,
        data,
        sound: options?.sound !== false ? 'default' : null,
        badge: options?.badge,
        channelId: options?.channelId || 'default',
        priority: 'high',
      }));

      // Send notifications
      const results = await this.sendPushNotifications(messages);
      
      // Store notification in database
      await db.insert(notifications).values({
        userId: userId.toString(),
        type: 'system' as const,
        title,
        body,
        data: JSON.stringify(data || {}),
        read: false,
      });

      return results.some(r => r.status === 'ok');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Send push notifications to multiple users
   */
  async sendToUsers(
    userIds: number[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
      sound?: boolean;
      channelId?: string;
    }
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const success = await this.sendToUser(userId, title, body, data, options);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Send batch of push notifications via Expo Push API
   */
  private async sendPushNotifications(
    messages: ExpoPushMessage[]
  ): Promise<ExpoPushTicket[]> {
    if (messages.length === 0) {
      return [];
    }

    try {
      // Expo recommends batching up to 100 messages per request
      const chunks = this.chunkArray(messages, 100);
      const allTickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          console.error('Expo Push API error:', response.status, await response.text());
          continue;
        }

        const result = await response.json();
        allTickets.push(...(result.data || []));
      }

      // Handle any failed tokens (invalid or expired)
      await this.handleFailedTokens(messages, allTickets);

      return allTickets;
    } catch (error) {
      console.error('Failed to send push notifications:', error);
      return [];
    }
  }

  /**
   * Remove invalid tokens from database
   */
  private async handleFailedTokens(
    messages: ExpoPushMessage[],
    tickets: ExpoPushTicket[]
  ): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const message = messages[i];

      if (ticket.status === 'error') {
        const errorType = ticket.details?.error;
        
        // Remove invalid tokens
        if (errorType === 'DeviceNotRegistered' || errorType === 'InvalidCredentials') {
          console.log(`Removing invalid token: ${message.to}`);
          await db.delete(pushTokens).where(eq(pushTokens.token, message.to));
        }
      }
    }
  }

  /**
   * Send notification for specific events
   */
  async sendLikeNotification(userId: number, likerName: string, postTitle: string): Promise<void> {
    await this.sendToUser(
      userId,
      'New Like',
      `${likerName} liked your post: "${postTitle.substring(0, 50)}..."`,
      { type: 'like', postTitle },
      { channelId: 'social' }
    );
  }

  async sendCommentNotification(
    userId: number,
    commenterName: string,
    comment: string,
    postId: number
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'New Comment',
      `${commenterName}: "${comment.substring(0, 50)}..."`,
      { type: 'comment', postId },
      { channelId: 'social' }
    );
  }

  async sendFollowNotification(userId: number, followerName: string, followerId: number): Promise<void> {
    await this.sendToUser(
      userId,
      'New Follower',
      `${followerName} started following you`,
      { type: 'follow', followerId },
      { channelId: 'social' }
    );
  }

  async sendMessageNotification(
    userId: number,
    senderName: string,
    message: string,
    conversationId: number
  ): Promise<void> {
    await this.sendToUser(
      userId,
      senderName,
      message.substring(0, 100),
      { type: 'message', conversationId },
      { channelId: 'messages', sound: true }
    );
  }

  async sendDealNotification(userIds: number[], dealTitle: string, dealId: number): Promise<void> {
    await this.sendToUsers(
      userIds,
      'New Investment Deal',
      `Check out: ${dealTitle}`,
      { type: 'deal', dealId },
      { channelId: 'deals' }
    );
  }

  async sendMentionNotification(
    userId: number,
    mentionerName: string,
    postId: number
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'You were mentioned',
      `${mentionerName} mentioned you in a post`,
      { type: 'mention', postId },
      { channelId: 'social' }
    );
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const pushNotificationService = new PushNotificationService();
