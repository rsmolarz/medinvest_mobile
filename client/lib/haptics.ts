/**
 * Haptic Feedback Service
 * Centralized haptic feedback for native feel
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticType = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

class HapticService {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async trigger(type: HapticType = 'medium'): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      console.debug('[Haptics] Failed to trigger:', error);
    }
  }

  buttonPress() {
    return this.trigger('light');
  }

  tabChange() {
    return this.trigger('selection');
  }

  toggle() {
    return this.trigger('medium');
  }

  pullToRefresh() {
    return this.trigger('medium');
  }

  success() {
    return this.trigger('success');
  }

  error() {
    return this.trigger('error');
  }

  warning() {
    return this.trigger('warning');
  }

  selection() {
    return this.trigger('selection');
  }

  longPress() {
    return this.trigger('heavy');
  }

  swipeAction() {
    return this.trigger('medium');
  }

  like() {
    return this.trigger('light');
  }

  modalOpen() {
    return this.trigger('light');
  }

  modalClose() {
    return this.trigger('light');
  }

  navigate() {
    return this.trigger('selection');
  }

  refreshComplete() {
    return this.trigger('success');
  }

  delete() {
    return this.trigger('warning');
  }

  undo() {
    return this.trigger('medium');
  }
}

export const haptics = new HapticService();

export { Haptics };
