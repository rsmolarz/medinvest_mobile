/**
 * In-App Browser Component
 * Open links without leaving the app
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';

interface InAppBrowserProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  title?: string;
}

export default function InAppBrowser({
  visible,
  url,
  onClose,
  title,
}: InAppBrowserProps) {
  const { colors, isDark } = useThemeContext();
  const webViewRef = useRef<WebView>(null);
  
  const [currentUrl, setCurrentUrl] = useState(url);
  const [currentTitle, setCurrentTitle] = useState(title || '');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCurrentUrl(navState.url);
    setCurrentTitle(navState.title || '');
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);
  }, []);

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      haptics.buttonPress();
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      webViewRef.current?.goForward();
      haptics.buttonPress();
    }
  }, [canGoForward]);

  const handleRefresh = useCallback(() => {
    webViewRef.current?.reload();
    haptics.buttonPress();
  }, []);

  const handleShare = useCallback(async () => {
    haptics.buttonPress();
    setShowMenu(false);
    
    try {
      await Share.share({
        message: currentTitle ? `${currentTitle}\n${currentUrl}` : currentUrl,
        url: Platform.OS === 'ios' ? currentUrl : undefined,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [currentUrl, currentTitle]);

  const handleCopyLink = useCallback(async () => {
    haptics.buttonPress();
    setShowMenu(false);
    
    await Clipboard.setStringAsync(currentUrl);
    Alert.alert('Copied', 'Link copied to clipboard');
  }, [currentUrl]);

  const handleOpenInBrowser = useCallback(() => {
    haptics.buttonPress();
    setShowMenu(false);
    
    Linking.openURL(currentUrl);
  }, [currentUrl]);

  const handleClose = useCallback(() => {
    haptics.modalClose();
    onClose();
  }, [onClose]);

  // Extract domain from URL
  const getDomain = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.urlContainer}>
            <Ionicons 
              name="lock-closed" 
              size={12} 
              color={currentUrl.startsWith('https') ? Colors.secondary : colors.textSecondary}
              style={styles.lockIcon}
            />
            <ThemedText style={[styles.urlText, { color: colors.textSecondary }]} numberOfLines={1}>
              {getDomain(currentUrl)}
            </ThemedText>
          </View>
          
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {isLoading && progress < 1 && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  backgroundColor: colors.primary,
                  width: `${progress * 100}%`,
                }
              ]} 
            />
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          allowsBackForwardNavigationGestures
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction
          allowsInlineMediaPlayback
        />

        {/* Bottom Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonDisabled]}
            onPress={handleGoBack}
            disabled={!canGoBack}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={canGoBack ? colors.textPrimary : colors.textTertiary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolbarButton, !canGoForward && styles.toolbarButtonDisabled]}
            onPress={handleGoForward}
            disabled={!canGoForward}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={canGoForward ? colors.textPrimary : colors.textTertiary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton} onPress={handleRefresh}>
            {isLoading ? (
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            ) : (
              <Ionicons name="refresh" size={22} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.menuTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {currentTitle || getDomain(currentUrl)}
                </ThemedText>
                <ThemedText style={[styles.menuUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentUrl}
                </ThemedText>
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
                <Ionicons name="copy-outline" size={22} color={colors.textPrimary} />
                <ThemedText style={[styles.menuItemText, { color: colors.textPrimary }]}>
                  Copy Link
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
                <ThemedText style={[styles.menuItemText, { color: colors.textPrimary }]}>
                  Share
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleOpenInBrowser}>
                <Ionicons name="open-outline" size={22} color={colors.textPrimary} />
                <ThemedText style={[styles.menuItemText, { color: colors.textPrimary }]}>
                  Open in Browser
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuCancel]}
                onPress={() => setShowMenu(false)}
              >
                <ThemedText style={[styles.menuCancelText, { color: colors.error }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

// Hook for managing in-app browser state
export function useInAppBrowser() {
  const [browserState, setBrowserState] = useState<{
    visible: boolean;
    url: string;
    title?: string;
  }>({
    visible: false,
    url: '',
  });

  const openUrl = useCallback((url: string, title?: string) => {
    haptics.modalOpen();
    setBrowserState({
      visible: true,
      url,
      title,
    });
  }, []);

  const closeBrowser = useCallback(() => {
    setBrowserState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    browserState,
    openUrl,
    closeBrowser,
  };
}

// Link handler that opens in-app browser for external links
export function useLinkHandler() {
  const { openUrl, closeBrowser, browserState } = useInAppBrowser();

  const handleLink = useCallback((url: string, title?: string) => {
    // Check if it's an internal app link
    if (url.startsWith('medinvest://') || url.includes('medinvest.com')) {
      // Handle internal navigation
      Linking.openURL(url);
    } else {
      // Open external links in in-app browser
      openUrl(url, title);
    }
  }, [openUrl]);

  return {
    handleLink,
    openUrl,
    closeBrowser,
    browserState,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  urlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  lockIcon: {
    marginRight: 4,
  },
  urlText: {
    ...Typography.caption,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: '100%',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  toolbarButton: {
    padding: Spacing.md,
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },

  // Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
  },
  menuHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  menuTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  menuUrl: {
    ...Typography.small,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.body,
  },
  menuCancel: {
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  menuCancelText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
