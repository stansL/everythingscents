/**
 * Firebase Cloud Messaging Service
 * Handles push notifications for PWA users
 */

import { PushPayload, NotificationResponse, NotificationChannel } from './types';

/**
 * FCM Configuration
 */
interface FCMConfig {
  enabled: boolean;
  vapidKey?: string;
  serverKey?: string;
}

class FCMService {
  private config: FCMConfig;

  constructor() {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_FCM_ENABLED === 'true',
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      serverKey: process.env.NEXT_PUBLIC_FCM_SERVER_KEY,
    };
  }

  /**
   * Request notification permission from user
   * Only works in browser context
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Push notifications not supported in this environment');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token for the current device
   * Requires Firebase Messaging to be initialized
   */
  async getToken(): Promise<string | null> {
    if (!this.config.enabled) {
      console.warn('FCM not enabled');
      return null;
    }

    try {
      // TODO: Initialize Firebase Messaging and get token
      // This requires firebase/messaging which is only available in browser
      // For now, return null
      console.log('FCM token retrieval not yet implemented');
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to user profile in Firestore
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveTokenToUser(userId: string, _token: string): Promise<boolean> {
    try {
      // TODO: Save token to user's Firestore document
      console.log('Saving FCM token for user:', userId);
      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  /**
   * Send push notification to device
   */
  async sendPushNotification(payload: PushPayload): Promise<NotificationResponse> {
    try {
      if (!this.config.enabled) {
        console.warn('FCM not enabled. Push notification not sent.');
        return {
          success: false,
          errors: {
            [NotificationChannel.PUSH]: 'FCM service not configured',
          },
        };
      }

      if (!payload.token) {
        return {
          success: false,
          errors: {
            [NotificationChannel.PUSH]: 'No FCM token provided',
          },
        };
      }

      // TODO: Implement actual FCM push via Firebase Admin SDK
      // This should be done server-side via API route
      console.log('Push notification would be sent:', {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
          image: payload.imageUrl,
        },
        data: payload.data,
      });

      // Simulated successful send
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        errors: {
          [NotificationChannel.PUSH]: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendBulkPushNotifications(payloads: PushPayload[]): Promise<NotificationResponse[]> {
    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendPushNotification(payload))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          errors: {
            [NotificationChannel.PUSH]: result.reason.message,
          },
        };
      }
    });
  }

  /**
   * Subscribe to topic for grouped notifications
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      // TODO: Implement topic subscription via Firebase Admin SDK
      console.log(`Subscribing ${token} to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      // TODO: Implement topic unsubscription via Firebase Admin SDK
      console.log(`Unsubscribing ${token} from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  /**
   * Create push notification payload for invoice sent
   */
  createInvoicePushPayload(
    token: string,
    invoiceNumber: string,
    amount: number,
    invoiceUrl: string
  ): PushPayload {
    return {
      token,
      title: `Invoice ${invoiceNumber} Sent`,
      body: `Your invoice for KES ${amount.toLocaleString()} is ready for review`,
      data: {
        type: 'invoice',
        invoiceNumber,
        url: invoiceUrl,
      },
      clickAction: invoiceUrl,
    };
  }

  /**
   * Create push notification payload for payment received
   */
  createPaymentPushPayload(
    token: string,
    amount: number,
    reference: string
  ): PushPayload {
    return {
      token,
      title: 'Payment Received',
      body: `Payment of KES ${amount.toLocaleString()} has been confirmed (Ref: ${reference})`,
      data: {
        type: 'payment',
        reference,
      },
    };
  }

  /**
   * Create push notification payload for delivery update
   */
  createDeliveryPushPayload(
    token: string,
    orderNumber: string,
    status: 'scheduled' | 'out_for_delivery' | 'delivered'
  ): PushPayload {
    const messages = {
      scheduled: 'Your delivery has been scheduled',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered',
    };

    return {
      token,
      title: `Delivery Update - ${orderNumber}`,
      body: messages[status],
      data: {
        type: 'delivery',
        orderNumber,
        status,
      },
    };
  }
}

// Export singleton instance
export const fcmService = new FCMService();
