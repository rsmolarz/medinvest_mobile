/**
 * Share Sheet Service
 * Share posts and content externally
 */

import { Share, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { haptics } from '@/lib/haptics';
import { useCallback } from 'react';

export interface ShareContent {
  title?: string;
  message: string;
  url?: string;
}

export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'dismissed' | 'copied';
  activityType?: string;
}

class ShareService {
  async share(content: ShareContent): Promise<ShareResult> {
    try {
      haptics.modalOpen();

      const shareOptions: { message: string; title?: string; url?: string } = {
        message: content.message,
      };

      if (content.title) {
        shareOptions.title = content.title;
      }

      if (content.url) {
        if (Platform.OS === 'ios') {
          shareOptions.url = content.url;
        } else {
          shareOptions.message = `${content.message}\n\n${content.url}`;
        }
      }

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        haptics.success();
        return {
          success: true,
          action: 'shared',
          activityType: result.activityType ?? undefined,
        };
      } else if (result.action === Share.dismissedAction) {
        return {
          success: false,
          action: 'dismissed',
        };
      }

      return { success: false };
    } catch (error) {
      console.error('[Share] Error sharing:', error);
      haptics.error();
      return { success: false };
    }
  }

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(text);
      haptics.success();
      return true;
    } catch (error) {
      console.error('[Share] Error copying to clipboard:', error);
      haptics.error();
      return false;
    }
  }

  async sharePost(post: {
    id: number;
    content: string;
    author: { full_name: string };
  }): Promise<ShareResult> {
    const postUrl = `https://medinvest.com/posts/${post.id}`;
    const truncatedContent = post.content.length > 100 
      ? `${post.content.substring(0, 100)}...` 
      : post.content;

    return this.share({
      title: `Post by ${post.author.full_name} on MedInvest`,
      message: truncatedContent,
      url: postUrl,
    });
  }

  async shareDeal(deal: {
    id: number;
    company_name: string;
    tagline?: string;
  }): Promise<ShareResult> {
    const dealUrl = `https://medinvest.com/deals/${deal.id}`;
    
    return this.share({
      title: deal.company_name,
      message: deal.tagline || `Check out ${deal.company_name} on MedInvest`,
      url: dealUrl,
    });
  }

  async shareProfile(user: {
    id: number;
    full_name: string;
    specialty?: string;
  }): Promise<ShareResult> {
    const profileUrl = `https://medinvest.com/users/${user.id}`;
    const message = user.specialty 
      ? `${user.full_name} - ${user.specialty} on MedInvest`
      : `${user.full_name} on MedInvest`;

    return this.share({
      title: user.full_name,
      message,
      url: profileUrl,
    });
  }

  async shareRoom(room: {
    slug: string;
    name: string;
    member_count?: number;
  }): Promise<ShareResult> {
    const roomUrl = `https://medinvest.com/rooms/${room.slug}`;
    const message = room.member_count 
      ? `Join ${room.name} - ${room.member_count} members on MedInvest`
      : `Join ${room.name} on MedInvest`;

    return this.share({
      title: room.name,
      message,
      url: roomUrl,
    });
  }

  async shareAppInvite(referralCode?: string): Promise<ShareResult> {
    const baseUrl = 'https://medinvest.com';
    const url = referralCode ? `${baseUrl}?ref=${referralCode}` : baseUrl;

    return this.share({
      title: 'Join MedInvest',
      message: 'Join me on MedInvest - the healthcare investment community!',
      url,
    });
  }

  showShareSheet(content: ShareContent, onCopy?: () => void) {
    const options = [
      {
        text: 'Share',
        onPress: () => this.share(content),
      },
      {
        text: 'Copy Link',
        onPress: async () => {
          if (content.url) {
            await this.copyToClipboard(content.url);
            onCopy?.();
          }
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Share', 'How would you like to share?', options);
  }
}

export const shareService = new ShareService();

export function useShare() {
  const share = useCallback((content: ShareContent) => {
    return shareService.share(content);
  }, []);

  const sharePost = useCallback((post: Parameters<typeof shareService.sharePost>[0]) => {
    return shareService.sharePost(post);
  }, []);

  const shareDeal = useCallback((deal: Parameters<typeof shareService.shareDeal>[0]) => {
    return shareService.shareDeal(deal);
  }, []);

  const shareProfile = useCallback((user: Parameters<typeof shareService.shareProfile>[0]) => {
    return shareService.shareProfile(user);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    return shareService.copyToClipboard(text);
  }, []);

  const shareAppInvite = useCallback((referralCode?: string) => {
    return shareService.shareAppInvite(referralCode);
  }, []);

  return {
    share,
    sharePost,
    shareDeal,
    shareProfile,
    copyToClipboard,
    shareAppInvite,
  };
}
