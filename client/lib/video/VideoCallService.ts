/**
 * Video Call Service
 * 
 * NOTE: This is a stub implementation for Expo Go compatibility.
 * Real video calling requires native SDKs (Twilio, Agora, etc.) which
 * are not available in Expo Go. This service provides:
 * 
 * 1. Interface for future native implementation
 * 2. External meeting link support (openExternalCall)
 * 3. State management patterns for video calls
 * 
 * For production: Replace with Twilio SDK or similar in a development build.
 */

import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export type CallType = 'audio' | 'video';

export interface CallParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
}

export interface CallSession {
  id: string;
  type: CallType;
  participants: CallParticipant[];
  startTime: Date;
  endTime?: Date;
  status: 'connecting' | 'connected' | 'ended' | 'failed';
}

export interface VideoCallConfig {
  apiKey?: string;
  debug?: boolean;
}

export type CallEventType = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'participantJoined'
  | 'participantLeft'
  | 'error';

type CallEventListener = (event: { type: CallEventType; data?: unknown }) => void;

class VideoCallService {
  private debug: boolean;
  private currentSession: CallSession | null = null;
  private listeners: Map<CallEventType, Set<CallEventListener>> = new Map();

  constructor(config: VideoCallConfig = {}) {
    this.debug = config.debug ?? __DEV__;
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[VideoCall] ${message}`, data ?? '');
    }
  }

  private emit(type: CallEventType, data?: unknown): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => listener({ type, data }));
    }
  }

  on(eventType: CallEventType, listener: CallEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  off(eventType: CallEventType, listener: CallEventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }

  async startCall(
    participants: { id: string; name: string }[],
    type: CallType = 'video'
  ): Promise<CallSession> {
    this.log('Starting call', { participants, type });
    
    this.emit('connecting');

    const session: CallSession = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      participants: participants.map(p => ({
        ...p,
        isMuted: false,
        isVideoEnabled: type === 'video',
      })),
      startTime: new Date(),
      status: 'connecting',
    };

    this.currentSession = session;

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    session.status = 'connected';
    this.emit('connected', session);
    this.log('Call connected', session);

    return session;
  }

  async joinCall(callId: string): Promise<CallSession | null> {
    this.log('Joining call', { callId });
    
    this.emit('connecting');

    const session: CallSession = {
      id: callId,
      type: 'video',
      participants: [],
      startTime: new Date(),
      status: 'connecting',
    };

    this.currentSession = session;

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    session.status = 'connected';
    this.emit('connected', session);

    return session;
  }

  async endCall(): Promise<void> {
    if (!this.currentSession) {
      this.log('No active call to end');
      return;
    }

    this.log('Ending call', { sessionId: this.currentSession.id });
    
    this.currentSession.status = 'ended';
    this.currentSession.endTime = new Date();
    
    this.emit('disconnected', this.currentSession);
    this.currentSession = null;
  }

  async toggleMute(): Promise<boolean> {
    if (!this.currentSession) return false;
    
    const localParticipant = this.currentSession.participants[0];
    if (localParticipant) {
      localParticipant.isMuted = !localParticipant.isMuted;
      this.log('Mute toggled', { isMuted: localParticipant.isMuted });
      return localParticipant.isMuted;
    }
    
    return false;
  }

  async toggleVideo(): Promise<boolean> {
    if (!this.currentSession) return false;
    
    const localParticipant = this.currentSession.participants[0];
    if (localParticipant) {
      localParticipant.isVideoEnabled = !localParticipant.isVideoEnabled;
      this.log('Video toggled', { isVideoEnabled: localParticipant.isVideoEnabled });
      return localParticipant.isVideoEnabled;
    }
    
    return false;
  }

  async switchCamera(): Promise<void> {
    this.log('Switching camera');
  }

  getCurrentSession(): CallSession | null {
    return this.currentSession;
  }

  isInCall(): boolean {
    return this.currentSession?.status === 'connected';
  }

  async openExternalCall(meetingUrl: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        window.open(meetingUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(meetingUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open video call link');
      this.log('Failed to open external call', error);
    }
  }

  async requestPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
    this.log('Permissions would be requested in a native build');
    return { camera: true, microphone: true };
  }
}

export const videoCallService = new VideoCallService();

export default videoCallService;
