import { Platform } from 'react-native';

export interface WatchMessage {
  type: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export interface WatchConnectivityConfig {
  debug?: boolean;
}

type MessageHandler = (message: WatchMessage) => void;

class WatchConnectivity {
  private debug: boolean;
  private isReachable: boolean = false;
  private isPaired: boolean = false;
  private isWatchAppInstalled: boolean = false;
  private messageHandlers: Set<MessageHandler> = new Set();

  constructor(config: WatchConnectivityConfig = {}) {
    this.debug = config.debug ?? __DEV__;
    
    if (Platform.OS === 'ios') {
      this.log('Watch connectivity initialized (iOS)');
    } else {
      this.log('Watch connectivity not available on this platform');
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[Watch] ${message}`, data ?? '');
    }
  }

  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      this.log('Watch connectivity requires iOS');
      return;
    }

    this.log('Initializing watch connectivity');
    this.isPaired = false;
    this.isWatchAppInstalled = false;
    this.isReachable = false;
  }

  async sendMessage(message: WatchMessage): Promise<void> {
    if (!this.isReachable) {
      this.log('Watch is not reachable');
      return;
    }

    this.log('Sending message to watch', message);
  }

  async sendPortfolioUpdate(portfolioData: {
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
  }): Promise<void> {
    await this.sendMessage({
      type: 'portfolio_update',
      payload: portfolioData,
      timestamp: Date.now(),
    });
  }

  async sendNotification(notification: {
    title: string;
    body: string;
    category?: string;
  }): Promise<void> {
    await this.sendMessage({
      type: 'notification',
      payload: notification,
      timestamp: Date.now(),
    });
  }

  async sendInvestmentAlert(alert: {
    investmentId: string;
    investmentName: string;
    alertType: 'price_change' | 'milestone' | 'deadline';
    message: string;
  }): Promise<void> {
    await this.sendMessage({
      type: 'investment_alert',
      payload: alert,
      timestamp: Date.now(),
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  private handleIncomingMessage(message: WatchMessage): void {
    this.log('Received message from watch', message);
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        this.log('Error in message handler', error);
      }
    });
  }

  getReachabilityStatus(): boolean {
    return this.isReachable;
  }

  getPairedStatus(): boolean {
    return this.isPaired;
  }

  getWatchAppInstalledStatus(): boolean {
    return this.isWatchAppInstalled;
  }

  async transferUserInfo(userInfo: Record<string, unknown>): Promise<void> {
    this.log('Transferring user info to watch', userInfo);
  }

  async updateApplicationContext(context: Record<string, unknown>): Promise<void> {
    this.log('Updating application context', context);
  }
}

export const watchConnectivity = new WatchConnectivity();

export default watchConnectivity;
