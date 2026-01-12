/**
 * Real-time Messaging Service
 * WebSocket-based typing indicators and message sync
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface TypingUser {
  id: number;
  full_name: string;
}

export interface TypingEvent {
  conversationId: number;
  user: TypingUser;
  isTyping: boolean;
}

export interface MessageReadEvent {
  conversationId: number;
  messageId: number;
  userId: number;
  readAt: string;
}

export interface NewMessageEvent {
  conversationId: number;
  message: {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
  };
}

type EventType = 'typing' | 'message_read' | 'new_message' | 'user_online' | 'user_offline';

interface WebSocketMessage {
  type: EventType | 'ping';
  data: any;
}

type TypingCallback = (event: TypingEvent) => void;
type MessageReadCallback = (event: MessageReadEvent) => void;
type NewMessageCallback = (event: NewMessageEvent) => void;
type ConnectionCallback = (connected: boolean) => void;

class RealtimeMessagingService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private typingCallbacks: Map<number, TypingCallback[]> = new Map();
  private messageReadCallbacks: Map<number, MessageReadCallback[]> = new Map();
  private newMessageCallbacks: NewMessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private currentUserId: number | null = null;
  private authToken: string | null = null;

  initialize(userId: number, token: string) {
    this.currentUserId = userId;
    this.authToken = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authToken) {
        reject(new Error('Not authenticated'));
        return;
      }

      try {
        this.simulateConnection();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private simulateConnection() {
    console.log('[RealtimeMessaging] Simulating WebSocket connection');
    this.notifyConnectionChange(true);
    this.startHeartbeat();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.notifyConnectionChange(false);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', data: {} });
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendTyping(conversationId: number, isTyping: boolean) {
    this.send({
      type: 'typing',
      data: { conversationId, isTyping },
    });
  }

  sendMessageRead(conversationId: number, messageId: number) {
    this.send({
      type: 'message_read',
      data: { conversationId, messageId },
    });
  }

  subscribeToTyping(conversationId: number, callback: TypingCallback): () => void {
    const callbacks = this.typingCallbacks.get(conversationId) || [];
    callbacks.push(callback);
    this.typingCallbacks.set(conversationId, callbacks);

    return () => {
      const updated = this.typingCallbacks.get(conversationId)?.filter(cb => cb !== callback) || [];
      this.typingCallbacks.set(conversationId, updated);
    };
  }

  subscribeToMessageRead(conversationId: number, callback: MessageReadCallback): () => void {
    const callbacks = this.messageReadCallbacks.get(conversationId) || [];
    callbacks.push(callback);
    this.messageReadCallbacks.set(conversationId, callbacks);

    return () => {
      const updated = this.messageReadCallbacks.get(conversationId)?.filter(cb => cb !== callback) || [];
      this.messageReadCallbacks.set(conversationId, updated);
    };
  }

  subscribeToNewMessages(callback: NewMessageCallback): () => void {
    this.newMessageCallbacks.push(callback);

    return () => {
      this.newMessageCallbacks = this.newMessageCallbacks.filter(cb => cb !== callback);
    };
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);

    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }
}

export const realtimeMessaging = new RealtimeMessagingService();

export function useTypingIndicator(conversationId: number) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const unsubscribe = realtimeMessaging.subscribeToTyping(conversationId, (event) => {
      if (event.isTyping) {
        setTypingUsers(prev => {
          if (prev.some(u => u.id === event.user.id)) return prev;
          return [...prev, event.user];
        });

        const existingTimeout = typingTimeoutRef.current.get(event.user.id);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.id !== event.user.id));
          typingTimeoutRef.current.delete(event.user.id);
        }, 3000);

        typingTimeoutRef.current.set(event.user.id, timeout);
      } else {
        setTypingUsers(prev => prev.filter(u => u.id !== event.user.id));
        const timeout = typingTimeoutRef.current.get(event.user.id);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeoutRef.current.delete(event.user.id);
        }
      }
    });

    return () => {
      unsubscribe();
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [conversationId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    realtimeMessaging.sendTyping(conversationId, isTyping);
  }, [conversationId]);

  return { typingUsers, sendTyping };
}

export function useReadReceipts(conversationId: number) {
  const [readReceipts, setReadReceipts] = useState<Map<number, MessageReadEvent>>(new Map());

  useEffect(() => {
    const unsubscribe = realtimeMessaging.subscribeToMessageRead(conversationId, (event) => {
      setReadReceipts(prev => new Map(prev).set(event.messageId, event));
    });

    return unsubscribe;
  }, [conversationId]);

  const markAsRead = useCallback((messageId: number) => {
    realtimeMessaging.sendMessageRead(conversationId, messageId);
  }, [conversationId]);

  const getReadStatus = useCallback((messageId: number) => {
    return readReceipts.get(messageId);
  }, [readReceipts]);

  return { readReceipts, markAsRead, getReadStatus };
}

export function useRealtimeConnection(userId: number | null, token: string | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;

    realtimeMessaging.initialize(userId, token);
    realtimeMessaging.connect();

    const unsubscribe = realtimeMessaging.subscribeToConnection(setIsConnected);

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        realtimeMessaging.connect();
      } else if (state === 'background') {
        realtimeMessaging.disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      subscription.remove();
      realtimeMessaging.disconnect();
    };
  }, [userId, token]);

  return { isConnected };
}
