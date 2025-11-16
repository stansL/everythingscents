/**
 * In-App Notification Service
 * Manages in-app notifications stored in Firestore with real-time updates
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Notification,
  NotificationTemplate,
  NotificationChannel,
  NotificationPriority,
  NotificationResponse,
} from './types';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * In-App Notification Service
 * Handles CRUD operations and real-time listening for in-app notifications
 */
class InAppNotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    template: NotificationTemplate
  ): Promise<NotificationResponse> {
    try {
      const notification: Omit<Notification, 'id'> = {
        userId,
        type: template.type,
        channels: template.channels,
        priority: template.priority,
        title: template.title,
        message: template.message,
        actionUrl: template.actionUrl,
        data: template.data,
        read: false,
        createdAt: new Date(),
        deliveryStatus: {
          [NotificationChannel.IN_APP]: {
            sent: true,
            sentAt: new Date(),
          },
        },
      };

      const docRef = await addDoc(
        collection(db, NOTIFICATIONS_COLLECTION),
        {
          ...notification,
          createdAt: Timestamp.fromDate(notification.createdAt),
        }
      );

      return {
        success: true,
        notificationId: docRef.id,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        errors: {
          [NotificationChannel.IN_APP]: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    maxCount: number = 50
  ): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxCount)
      );

      const snapshot = await getDocs(q);
      return this.mapSnapshotToNotifications(snapshot);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: Timestamp.fromDate(new Date()),
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          read: true,
          readAt: Timestamp.fromDate(new Date()),
        })
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   * Returns an unsubscribe function
   */
  subscribeToNotifications(
    userId: string,
    onUpdate: (notifications: Notification[]) => void,
    maxCount: number = 50
  ): () => void {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = this.mapSnapshotToNotifications(snapshot);
        onUpdate(notifications);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
      }
    );
  }

  /**
   * Subscribe to unread count for a user
   * Returns an unsubscribe function
   */
  subscribeToUnreadCount(
    userId: string,
    onUpdate: (count: number) => void
  ): () => void {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        onUpdate(snapshot.size);
      },
      (error) => {
        console.error('Error in unread count subscription:', error);
      }
    );
  }

  /**
   * Helper: Map Firestore snapshot to Notification array
   */
  private mapSnapshotToNotifications(
    snapshot: QuerySnapshot<DocumentData>
  ): Notification[] {
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        channels: data.channels,
        priority: data.priority,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        data: data.data,
        read: data.read,
        readAt: data.readAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        deliveryStatus: data.deliveryStatus,
      };
    });
  }
}

// Export singleton instance
export const inAppNotificationService = new InAppNotificationService();
