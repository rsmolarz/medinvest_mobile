/**
 * Video Player Component
 * Full-featured video player with controls
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  posterUri?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onClose?: () => void;
  isFullscreen?: boolean;
  style?: object;
}

export default function VideoPlayer({
  uri,
  posterUri,
  autoPlay = false,
  showControls = true,
  onClose,
  isFullscreen = false,
  style,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen);
  const [isMuted, setIsMuted] = useState(false);

  const isBuffering = status?.isLoaded && status.isBuffering;
  const duration = status?.isLoaded ? status.durationMillis || 0 : 0;
  const position = status?.isLoaded ? status.positionMillis || 0 : 0;
  const progress = duration > 0 ? position / duration : 0;

  // Format time (mm:ss)
  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Hide controls after delay
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControlsOverlay(false));
      }
    }, 3000);
  }, [isPlaying, controlsOpacity]);

  // Show controls
  const showControlsWithTimeout = useCallback(() => {
    setShowControlsOverlay(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    hideControlsAfterDelay();
  }, [controlsOpacity, hideControlsAfterDelay]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
    showControlsWithTimeout();
  }, [isPlaying, showControlsWithTimeout]);

  // Seek
  const handleSeek = useCallback(async (value: number) => {
    if (!videoRef.current || !status?.isLoaded) return;
    await videoRef.current.setPositionAsync(value * duration);
  }, [duration, status]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreenMode(!isFullscreenMode);
  }, [isFullscreenMode]);

  // Skip forward/backward
  const skip = useCallback(async (seconds: number) => {
    if (!videoRef.current || !status?.isLoaded) return;
    const newPosition = Math.max(0, Math.min(position + seconds * 1000, duration));
    await videoRef.current.setPositionAsync(newPosition);
  }, [position, duration, status]);

  // Handle playback status update
  const handlePlaybackStatusUpdate = useCallback((newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setIsLoading(false);
      setIsPlaying(newStatus.isPlaying);
      
      // Video ended
      if (newStatus.didJustFinish) {
        setIsPlaying(false);
        setShowControlsOverlay(true);
        Animated.timing(controlsOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [controlsOpacity]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const renderControls = () => (
    <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        )}
        <View style={styles.topBarSpacer} />
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Ionicons 
            name={isMuted ? 'volume-mute' : 'volume-high'} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Center controls */}
      <View style={styles.centerControls}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => skip(-10)}
        >
          <Ionicons name="play-back" size={32} color="white" />
          <ThemedText style={styles.skipText}>10</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.playPauseButton} 
          onPress={togglePlayPause}
        >
          {isLoading || isBuffering ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={48} 
              color="white" 
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => skip(10)}
        >
          <Ionicons name="play-forward" size={32} color="white" />
          <ThemedText style={styles.skipText}>10</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <ThemedText style={styles.timeText}>{formatTime(position)}</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor={Colors.primary}
        />
        <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
        {!isFullscreen && (
          <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
            <Ionicons 
              name={isFullscreenMode ? 'contract' : 'expand'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const videoContent = (
    <TouchableWithoutFeedback onPress={showControlsWithTimeout}>
      <View style={[
        styles.container, 
        isFullscreenMode && styles.fullscreenContainer,
        style
      ]}>
        <Video
          ref={videoRef}
          source={{ uri }}
          posterSource={posterUri ? { uri: posterUri } : undefined}
          usePoster={!!posterUri}
          posterStyle={styles.poster}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {showControls && showControlsOverlay && renderControls()}

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  // Fullscreen mode
  if (isFullscreenMode && !isFullscreen) {
    return (
      <Modal
        visible={isFullscreenMode}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={toggleFullscreen}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenModal}>
          {videoContent}
        </View>
      </Modal>
    );
  }

  return videoContent;
}

// Inline/Feed video player (smaller, no fullscreen)
export function InlineVideoPlayer({ 
  uri, 
  posterUri,
  style 
}: { 
  uri: string; 
  posterUri?: string;
  style?: object;
}) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <TouchableWithoutFeedback onPress={togglePlay}>
      <View style={[styles.inlineContainer, style]}>
        <Video
          ref={videoRef}
          source={{ uri }}
          posterSource={posterUri ? { uri: posterUri } : undefined}
          usePoster={!!posterUri}
          style={styles.inlineVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping
          isMuted={isMuted}
        />
        
        {!isPlaying && (
          <View style={styles.inlinePlayOverlay}>
            <View style={styles.inlinePlayButton}>
              <Ionicons name="play" size={32} color="white" />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.inlineMuteButton}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons 
            name={isMuted ? 'volume-mute' : 'volume-high'} 
            size={16} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    aspectRatio: 16 / 9,
    width: '100%',
  },
  fullscreenContainer: {
    flex: 1,
    aspectRatio: undefined,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  video: {
    flex: 1,
  },
  poster: {
    resizeMode: 'cover',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  topBarSpacer: {
    flex: 1,
  },
  controlButton: {
    padding: Spacing.sm,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  skipText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    minWidth: 40,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  fullscreenButton: {
    padding: Spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  // Inline player styles
  inlineContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  inlineVideo: {
    flex: 1,
  },
  inlinePlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  inlinePlayButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineMuteButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
