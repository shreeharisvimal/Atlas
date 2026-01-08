/**
 * Browser Notification Service
 * Provides system-level notifications that work even when the tab is in background
 * Similar to WhatsApp notifications
 */

import { NotificationType } from '../types';

export interface BrowserNotificationData {
  title: string;
  message: string;
  notificationType: NotificationType;
  ticketId?: number;
  icon?: string;
  badge?: string;
  tag?: string; // Used for grouping/replacing notifications
}

class BrowserNotificationService {
  private permission: NotificationPermission = 'default';
  private notificationClickHandlers: Map<number, () => void> = new Map();

  constructor() {
    // Check current permission status
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    // Always check current permission status
    this.permission = Notification.permission;

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission was previously denied by user');
      console.warn('User needs to enable notifications in browser settings');
      return 'denied';
    }

    try {
      // Request permission (this will show browser's native permission dialog)
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Browser notification permission granted!');
      } else {
        console.warn('❌ Browser notification permission denied');
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported and permitted
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if permission is granted
   */
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  /**
   * Check if the page is currently visible (tab is active)
   */
  isPageVisible(): boolean {
    return !document.hidden;
  }

  /**
   * Show a browser notification
   * Always attempts to show system-level notification (like WhatsApp)
   */
  async showNotification(data: BrowserNotificationData): Promise<Notification | null> {
    // Check if notifications are supported
    if (!this.isSupported()) {
      console.warn('Browser notifications are not supported');
      return null;
    }

    // Always check current permission status (it might have changed)
    this.permission = Notification.permission;
    console.log('📋 Current notification permission:', this.permission);

    // Request permission if not already granted
    if (!this.hasPermission()) {
      // Try to request permission, but don't block if user previously denied
      if (this.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          console.warn('❌ Notification permission not granted. User needs to allow notifications.');
          console.warn('💡 System-level notifications will not work until permission is granted.');
          return null;
        }
        console.log('✅ Permission granted! Showing notification...');
      } else {
        // Permission was denied, can't show notification
        console.warn('❌ Notification permission was denied by user');
        console.warn('💡 To enable system notifications, go to browser settings and allow notifications for this site');
        return null;
      }
    }

    // Create notification options
    const options: NotificationOptions = {
      body: data.message,
      icon: data.icon || '/logo-icon.svg', // Use app logo
      badge: data.badge || '/logo-icon.svg', // Use app logo for badge
      tag: data.tag || `notification-${data.ticketId || 'general'}`,
      requireInteraction: false, // Auto-dismiss after a few seconds (like WhatsApp)
      silent: false, // Play notification sound
      data: {
        ticketId: data.ticketId,
        notificationType: data.notificationType,
      },
      // Note: vibrate is not part of the standard NotificationOptions type
      // It's a Service Worker API feature, so we omit it here
    };

    try {
      // Create the system-level notification
      const notification = new Notification(data.title, options);
      
      console.log('🔔 System-level notification shown:', data.title);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        console.log('Notification clicked, navigating to ticket:', data.ticketId);
        
        // Bring window to front
        window.focus();

        // Navigate to ticket if available
        if (data.ticketId) {
          const handler = this.notificationClickHandlers.get(data.ticketId);
          if (handler) {
            handler();
          } else {
            // Fallback: navigate to ticket page
            if (window.location.pathname !== `/tickets/${data.ticketId}`) {
              window.location.href = `/tickets/${data.ticketId}`;
            }
          }
        }

        notification.close();
      };

      // Handle notification close
      notification.onclose = () => {
        // Clean up click handler
        if (data.ticketId) {
          this.notificationClickHandlers.delete(data.ticketId);
        }
      };

      // Handle notification error
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      // Auto-close after 5 seconds (like WhatsApp)
      setTimeout(() => {
        if (notification) {
          notification.close();
        }
      }, 5000);

      return notification;
    } catch (error) {
      console.error('❌ Error showing system notification:', error);
      console.error('Notification data:', data);
      return null;
    }
  }

  /**
   * Register a click handler for a ticket notification
   */
  registerClickHandler(ticketId: number, handler: () => void): void {
    this.notificationClickHandlers.set(ticketId, handler);
  }

  /**
   * Unregister a click handler
   */
  unregisterClickHandler(ticketId: number): void {
    this.notificationClickHandlers.delete(ticketId);
  }

  /**
   * Close all active notifications
   */
  closeAll(): void {
    // Note: There's no direct API to close all notifications
    // This would need to track active notifications
    console.log('Close all notifications requested');
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(_notificationType: NotificationType): string {
    // You can customize these icons
    return '/logo-icon.svg';
  }

  /**
   * Get notification badge based on type
   */
  getNotificationBadge(_notificationType: NotificationType): string {
    return '/logo-icon.svg';
  }
}

// Export singleton instance
export const browserNotificationService = new BrowserNotificationService();

