import { NotificationItem } from '../../types';

export class NotificationManager {
  private notifications: NotificationItem[] = [];

  notify(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
    };

    this.notifications.push(item);
    console.log(`[NotificationManager] ${type.toUpperCase()}: ${title} - ${message}`);

    // Trigger native Chrome system notification if available
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      try {
        chrome.notifications.create(item.id, {
          type: 'basic',
          iconUrl: 'assets/logo.svg',
          title,
          message,
        });
      } catch (e) {
        // Fallback
      }
    }
  }

  getNotifications(): NotificationItem[] {
    return this.notifications;
  }
}

export const notificationManager = new NotificationManager();
