/**
 * Notification System Types
 * Defines interfaces and enums for multi-channel notification system
 */

/**
 * Supported notification delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'in_app',        // Admin dashboard & PWA notifications
  SMS = 'sms',              // Safaricom SMS API
  EMAIL = 'email',          // Email service
  PUSH = 'push',            // Firebase Cloud Messaging (PWA)
  WHATSAPP = 'whatsapp'     // WhatsApp Business API (future)
}

/**
 * Types of notifications triggered by workflow events
 */
export enum NotificationType {
  // Invoice events
  INVOICE_CREATED = 'invoice_created',
  INVOICE_SENT = 'invoice_sent',
  INVOICE_OVERDUE = 'invoice_overdue',
  
  // Payment events
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_PARTIAL = 'payment_partial',
  PAYMENT_COMPLETE = 'payment_complete',
  PAYMENT_FAILED = 'payment_failed',
  
  // Delivery events
  DELIVERY_SCHEDULED = 'delivery_scheduled',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  READY_FOR_PICKUP = 'ready_for_pickup',
  DELIVERY_COMPLETED = 'delivery_completed',
  
  // Order events
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_CREATED = 'order_created',
  
  // System events
  SYSTEM_ALERT = 'system_alert',
  RECONCILIATION_COMPLETE = 'reconciliation_complete'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Core notification interface stored in Firestore
 */
export interface Notification {
  id: string;
  userId: string;                          // Recipient user ID
  type: NotificationType;
  channels: NotificationChannel[];         // Delivery channels for this notification
  priority: NotificationPriority;
  
  // Content
  title: string;
  message: string;
  actionUrl?: string;                      // Optional link for "View Details"
  
  // Metadata
  data?: Record<string, any>;              // Additional data (invoiceId, orderId, etc.)
  
  // Status tracking
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  
  // Delivery tracking per channel
  deliveryStatus?: {
    [K in NotificationChannel]?: {
      sent: boolean;
      sentAt?: Date;
      error?: string;
    };
  };
}

/**
 * Template for creating new notifications
 */
export interface NotificationTemplate {
  type: NotificationType;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

/**
 * User notification preferences (extends UserPreferences)
 */
export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  
  // Channel-specific preferences
  notifyOnInvoice: boolean;
  notifyOnPayment: boolean;
  notifyOnDelivery: boolean;
  notifyOnOrder: boolean;
}

/**
 * SMS notification payload
 */
export interface SMSPayload {
  phoneNumber: string;
  message: string;
  reference?: string;  // Transaction reference for tracking
}

/**
 * Email notification payload
 */
export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

/**
 * Push notification payload (FCM)
 */
export interface PushPayload {
  token: string;                    // FCM device token
  title: string;
  body: string;
  data?: Record<string, string>;    // Custom data payload
  imageUrl?: string;
  clickAction?: string;             // URL to open on click
}

/**
 * Notification service response
 */
export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  errors?: {
    [K in NotificationChannel]?: string;
  };
}
