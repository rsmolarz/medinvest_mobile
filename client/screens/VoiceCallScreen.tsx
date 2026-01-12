/**
 * Voice/Video Call Screen
 * Simulated call interface for Expo Go compatibility
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { videoCallService, CallType } from '@/lib/video/VideoCallService';

type VoiceCallRouteParams = {
  VoiceCall: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: CallType;
  };
};

type CallStatus = 'connecting' | 'ringing' | 'connected' | 'ended';

export default function VoiceCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<VoiceCallRouteParams, 'VoiceCall'>>();
  const { recipientId, recipientName, recipientAvatar, callType } = route.params;

  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCall();
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connecting' || callStatus === 'ringing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callStatus, pulseAnim]);

  const startCall = async () => {
    setCallStatus('connecting');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCallStatus('ringing');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCallStatus('connected');
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    durationInterval.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const endCall = useCallback(() => {
    setCallStatus('ended');
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    videoCallService.endCall();
    setTimeout(() => {
      navigation.goBack();
    }, 500);
  }, [navigation]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => !prev);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return formatDuration(duration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, '#004d99', '#003366']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.callTypeText}>
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </ThemedText>
        </View>

        <View style={styles.profileSection}>
          <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
            {recipientAvatar ? (
              <Image source={{ uri: recipientAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <ThemedText style={styles.avatarText}>
                  {recipientName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </ThemedText>
              </View>
            )}
          </Animated.View>
          
          <ThemedText style={styles.recipientName}>{recipientName}</ThemedText>
          <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color={isMuted ? Colors.primary : 'white'}
              />
              <ThemedText style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
                {isMuted ? 'Unmute' : 'Mute'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                size={28}
                color={isSpeakerOn ? Colors.primary : 'white'}
              />
              <ThemedText style={[styles.controlLabel, isSpeakerOn && styles.controlLabelActive]}>
                Speaker
              </ThemedText>
            </TouchableOpacity>

            {callType === 'video' && (
              <TouchableOpacity
                style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
                onPress={toggleVideo}
              >
                <Ionicons
                  name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                  size={28}
                  color={!isVideoEnabled ? Colors.primary : 'white'}
                />
                <ThemedText style={[styles.controlLabel, !isVideoEnabled && styles.controlLabelActive]}>
                  Video
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Ionicons name="call" size={32} color="white" style={styles.endCallIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {callType === 'video' 
              ? 'Video calls require a development build for full functionality'
              : 'Voice calls use simulated audio in Expo Go'}
          </ThemedText>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  callTypeText: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '600',
    color: 'white',
  },
  recipientName: {
    ...Typography.title,
    color: 'white',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statusText: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  controlsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing['3xl'],
  },
  controlButton: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 72,
    height: 72,
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'white',
  },
  controlLabel: {
    ...Typography.small,
    color: 'white',
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  controlLabelActive: {
    color: Colors.primary,
  },
  endCallButton: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
