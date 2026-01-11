/**
 * Video Player Component
 * Full-featured video player using expo-video with event listeners
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface VideoPlayerProps {
  uri: string;
  posterUri?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onClose?: () => void;
  isFullscreen?: boolean;
  style?: object;
  onProgress?: (progress: number) => void;
  onEnd?: () => void;
}

export default function VideoPlayer({
  uri,
  posterUri,
  autoPlay = false,
  showControls = true,
  onClose,
  isFullscreen = false,
  style,
  onProgress,
  onEnd,
}: VideoPlayerProps) {
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const controlsOpacity = React.useRef(new Animated.Value(1)).current;
  const controlsTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.playbackRate = playbackSpeed;
    player.timeUpdateEventInterval = 0.25;
    if (autoPlay) {
      player.play();
      setHasStarted(true);
    }
  });

  const { currentTime, bufferedPosition } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEventListener(player, 'playToEnd', () => {
    onEnd?.();
  });

  const duration = player.duration || 0;
  const displayTime = isSeeking ? seekValue * duration : currentTime;
  const progress = duration > 0 ? displayTime / duration : 0;
  const isLoading = status === 'loading';
  const isMuted = player.muted;

  useEffect(() => {
    if (duration > 0 && !isSeeking) {
      onProgress?.(currentTime / duration);
    }
  }, [currentTime, duration, isSeeking, onProgress]);

  useEffect(() => {
    player.playbackRate = playbackSpeed;
  }, [player, playbackSpeed]);

  const formatTime = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying && !showSpeedPicker) {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControlsOverlay(false));
      }
    }, 3000);
  }, [isPlaying, showSpeedPicker, controlsOpacity]);

  const showControlsWithTimeout = useCallback(() => {
    setShowControlsOverlay(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    hideControlsAfterDelay();
  }, [controlsOpacity, hideControlsAfterDelay]);

  const togglePlayPause = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
      setHasStarted(true);
    }
    showControlsWithTimeout();
  }, [player, showControlsWithTimeout]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
  }, [player]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreenMode(!isFullscreenMode);
  }, [isFullscreenMode]);

  const handlePress = useCallback(() => {
    if (showSpeedPicker) {
      setShowSpeedPicker(false);
      return;
    }
    if (showControlsOverlay) {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowControlsOverlay(false));
    } else {
      showControlsWithTimeout();
    }
  }, [showControlsOverlay, showSpeedPicker, controlsOpacity, showControlsWithTimeout]);

  const handleSliderSlidingStart = useCallback(() => {
    setIsSeeking(true);
    setSeekValue(progress);
  }, [progress]);

  const handleSliderSlidingComplete = useCallback((value: number) => {
    player.currentTime = value * duration;
    setIsSeeking(false);
    showControlsWithTimeout();
  }, [player, duration, showControlsWithTimeout]);

  const handleSliderValueChange = useCallback((value: number) => {
    if (isSeeking) {
      setSeekValue(value);
    }
  }, [isSeeking]);

  const seek = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    player.currentTime = newTime;
    showControlsWithTimeout();
  }, [player, currentTime, duration, showControlsWithTimeout]);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    setShowSpeedPicker(false);
    showControlsWithTimeout();
  }, [showControlsWithTimeout]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const renderSpeedPicker = () => (
    <View style={styles.speedPicker}>
      {PLAYBACK_SPEEDS.map((speed) => (
        <TouchableOpacity
          key={speed}
          style={[
            styles.speedOption,
            playbackSpeed === speed && styles.speedOptionActive,
          ]}
          onPress={() => handleSpeedChange(speed)}
        >
          <ThemedText
            style={[
              styles.speedText,
              playbackSpeed === speed && styles.speedTextActive,
            ]}
          >
            {speed}x
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderControls = () => (
    <Animated.View
      style={[
        styles.controlsOverlay,
        { opacity: controlsOpacity },
        !showControlsOverlay && styles.hidden,
      ]}
    >
      {onClose ? (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      ) : null}

      <View style={styles.centerControls}>
        <TouchableOpacity style={styles.seekButton} onPress={() => seek(-10)}>
          <Ionicons name="play-back" size={24} color="white" />
          <ThemedText style={styles.seekLabel}>10</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={40}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.seekButton} onPress={() => seek(10)}>
          <Ionicons name="play-forward" size={24} color="white" />
          <ThemedText style={styles.seekLabel}>10</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <View style={styles.timeRow}>
          <ThemedText style={styles.timeText}>
            {formatTime(displayTime)}
          </ThemedText>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={isSeeking ? seekValue : progress}
              onSlidingStart={handleSliderSlidingStart}
              onSlidingComplete={handleSliderSlidingComplete}
              onValueChange={handleSliderValueChange}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor={Colors.primary}
            />
          </View>
          <ThemedText style={styles.timeText}>
            {formatTime(duration)}
          </ThemedText>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSpeedPicker(!showSpeedPicker)}
          >
            <ThemedText style={styles.speedLabel}>{playbackSpeed}x</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={22}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
            <Ionicons
              name={isFullscreenMode ? 'contract' : 'expand'}
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {showSpeedPicker ? renderSpeedPicker() : null}
    </Animated.View>
  );

  const renderPoster = () => (
    <TouchableWithoutFeedback onPress={togglePlayPause}>
      <View style={styles.posterContainer}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={styles.posterPlaceholder} />
        )}
        <View style={styles.posterOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={48} color="white" />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  const videoContent = (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View
        style={[
          styles.container,
          isFullscreenMode && styles.fullscreenContainer,
          style,
        ]}
      >
        {!hasStarted ? (
          renderPoster()
        ) : (
          <VideoView
            style={styles.video}
            player={player}
            contentFit="contain"
            nativeControls={false}
          />
        )}

        {isLoading && hasStarted ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : null}

        {showControls && hasStarted ? renderControls() : null}
      </View>
    </TouchableWithoutFeedback>
  );

  if (isFullscreenMode) {
    return (
      <Modal
        visible={isFullscreenMode}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={toggleFullscreen}
      >
        <StatusBar hidden />
        {videoContent}
      </Modal>
    );
  }

  return videoContent;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: BorderRadius.sm,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderRadius: 0,
    aspectRatio: undefined,
  },
  video: {
    flex: 1,
  },
  posterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  posterPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  hidden: {
    display: 'none',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.full,
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing['3xl'],
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekLabel: {
    color: 'white',
    fontSize: 10,
    marginTop: -4,
  },
  bottomControls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    minWidth: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.md,
  },
  controlButton: {
    padding: Spacing.sm,
  },
  speedLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  speedPicker: {
    position: 'absolute',
    bottom: 80,
    right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  speedOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  speedOptionActive: {
    backgroundColor: Colors.primary,
  },
  speedText: {
    color: 'white',
    fontSize: 14,
  },
  speedTextActive: {
    fontWeight: '600',
  },
});
