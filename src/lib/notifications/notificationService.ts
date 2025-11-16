/**
 * Unified Notification Service
 * Dispatches notifications across multiple channels (in-app, SMS, email, push)
 */

import { inAppNotificationService } from './inAppNotificationService';
import { smsService } from './smsService';
import { emailService } from './emailService';
import { fcmService } from './fcmService';
import {
  NotificationTemplate,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationResponse,
  SMSPayload,
  EmailPayload,
  PushPayload,
} from './types';

/**
 * Notification dispatch request
 */
export interface NotificationRequest {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  fcmToken?: string;
  type: NotificationType;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

/**
 * Multi-channel notification dispatch result
 */
export interface NotificationDispatchResult {
  success: boolean;
  channelResults: {
    [K in NotificationChannel]?: NotificationResponse;
  };
}

class NotificationService {
  /**
   * Send notification across multiple channels
   */
  async send(request: NotificationRequest): Promise<NotificationDispatchResult> {
    const results: NotificationDispatchResult = {
      success: true,
      channelResults: {},
    };

    // Dispatch to each requested channel
    const dispatchPromises = request.channels.map(async (channel) => {
      let result: NotificationResponse;

      switch (channel) {
        case NotificationChannel.IN_APP:
          result = await this.sendInApp(request);
          break;

        case NotificationChannel.SMS:
          result = await this.sendSMS(request);
          break;

        case NotificationChannel.EMAIL:
          result = await this.sendEmail(request);
          break;

        case NotificationChannel.PUSH:
          result = await this.sendPush(request);
          break;

        default:
          result = {
            success: false,
            errors: { [channel]: 'Unsupported channel' },
          };
      }

      results.channelResults[channel] = result;

      if (!result.success) {
        results.success = false;
      }

      return result;
    });

    await Promise.allSettled(dispatchPromises);

    return results;
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(request: NotificationRequest): Promise<NotificationResponse> {
    const template: NotificationTemplate = {
      type: request.type,
      channels: [NotificationChannel.IN_APP],
      priority: request.priority,
      title: request.title,
      message: request.message,
      actionUrl: request.actionUrl,
      data: request.data,
    };

    return await inAppNotificationService.createNotification(request.userId, template);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(request: NotificationRequest): Promise<NotificationResponse> {
    if (!request.userPhone) {
      return {
        success: false,
        errors: {
          [NotificationChannel.SMS]: 'No phone number provided',
        },
      };
    }

    const payload: SMSPayload = {
      phoneNumber: request.userPhone,
      message: `${request.title}\n\n${request.message}`,
      reference: request.data?.reference as string | undefined,
    };

    return await smsService.sendSMS(payload);
  }

  /**
   * Send email notification
   */
  private async sendEmail(request: NotificationRequest): Promise<NotificationResponse> {
    if (!request.userEmail) {
      return {
        success: false,
        errors: {
          [NotificationChannel.EMAIL]: 'No email address provided',
        },
      };
    }

    const payload: EmailPayload = {
      to: request.userEmail,
      subject: request.title,
      htmlBody: `<p>${request.message}</p>`,
      textBody: request.message,
    };

    return await emailService.sendEmail(payload);
  }

  /**
   * Send push notification
   */
  private async sendPush(request: NotificationRequest): Promise<NotificationResponse> {
    if (!request.fcmToken) {
      return {
        success: false,
        errors: {
          [NotificationChannel.PUSH]: 'No FCM token provided',
        },
      };
    }

    const payload: PushPayload = {
      token: request.fcmToken,
      title: request.title,
      body: request.message,
      data: request.data ? Object.fromEntries(
        Object.entries(request.data).map(([k, v]) => [k, String(v)])
      ) : undefined,
      clickAction: request.actionUrl,
    };

    return await fcmService.sendPushNotification(payload);
  }

  /**
   * Convenience methods for common notification scenarios
   */

  /**
   * Send invoice sent notification
   */
  async notifyInvoiceSent(
    userId: string,
    userEmail: string,
    userPhone: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    invoiceUrl: string
  ): Promise<NotificationDispatchResult> {
    // Send in-app notification
    await this.send({
      userId,
      userEmail,
      userPhone,
      type: NotificationType.INVOICE_SENT,
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
      title: `Invoice ${invoiceNumber} Sent`,
      message: `Invoice for KES ${amount.toLocaleString()} has been sent to ${clientName}`,
      actionUrl: invoiceUrl,
      data: { invoiceNumber, amount },
    });

    // Send email with custom template
    const emailPayload = emailService.createInvoiceEmail(
      userEmail,
      clientName,
      invoiceNumber,
      amount,
      dueDate,
      invoiceUrl
    );
    await emailService.sendEmail(emailPayload);

    // Send SMS
    const smsMessage = smsService.createInvoiceMessage(clientName, invoiceNumber, amount);
    await smsService.sendSMS({ phoneNumber: userPhone, message: smsMessage });

    return {
      success: true,
      channelResults: {},
    };
  }

  /**
   * Send payment received notification
   */
  async notifyPaymentReceived(
    userId: string,
    userEmail: string,
    userPhone: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    paymentMethod: string,
    reference: string
  ): Promise<NotificationDispatchResult> {
    // Send in-app notification
    await this.send({
      userId,
      userEmail,
      userPhone,
      type: NotificationType.PAYMENT_RECEIVED,
      channels: [NotificationChannel.IN_APP],
      priority: NotificationPriority.HIGH,
      title: 'Payment Received',
      message: `Payment of KES ${amount.toLocaleString()} received for Invoice ${invoiceNumber}`,
      data: { invoiceNumber, amount, reference },
    });

    // Send email confirmation
    const emailPayload = emailService.createPaymentConfirmationEmail(
      userEmail,
      clientName,
      invoiceNumber,
      amount,
      paymentMethod,
      reference
    );
    await emailService.sendEmail(emailPayload);

    // Send SMS confirmation
    const smsMessage = smsService.createPaymentConfirmationMessage(
      clientName,
      amount,
      reference
    );
    await smsService.sendSMS({ phoneNumber: userPhone, message: smsMessage });

    return {
      success: true,
      channelResults: {},
    };
  }

  /**
   * Send delivery notification
   */
  async notifyDelivery(
    userId: string,
    userEmail: string,
    userPhone: string,
    fcmToken: string | undefined,
    clientName: string,
    orderNumber: string,
    status: 'scheduled' | 'out_for_delivery' | 'delivered'
  ): Promise<NotificationDispatchResult> {
    const statusTitles = {
      scheduled: 'Delivery Scheduled',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Order Delivered',
    };

    // Determine priority
    const priority = status === 'delivered' 
      ? NotificationPriority.HIGH 
      : NotificationPriority.NORMAL;

    // Send in-app notification
    await this.send({
      userId,
      userEmail,
      userPhone,
      fcmToken,
      type: NotificationType.OUT_FOR_DELIVERY,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority,
      title: statusTitles[status],
      message: `Order ${orderNumber} - ${statusTitles[status]}`,
      data: { orderNumber, status },
    });

    // Send email
    const emailPayload = emailService.createDeliveryEmail(
      userEmail,
      clientName,
      orderNumber,
      status
    );
    await emailService.sendEmail(emailPayload);

    // Send SMS
    const smsMessage = smsService.createDeliveryMessage(clientName, status);
    await smsService.sendSMS({ phoneNumber: userPhone, message: smsMessage });

    return {
      success: true,
      channelResults: {},
    };
  }

  /**
   * Send order confirmed notification
   */
  async notifyOrderConfirmed(
    userId: string,
    userEmail: string,
    userPhone: string,
    clientName: string,
    orderNumber: string,
    amount: number
  ): Promise<NotificationDispatchResult> {
    return await this.send({
      userId,
      userEmail,
      userPhone,
      type: NotificationType.ORDER_CONFIRMED,
      channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
      priority: NotificationPriority.NORMAL,
      title: 'Order Confirmed',
      message: `Order ${orderNumber} for KES ${amount.toLocaleString()} has been confirmed`,
      data: { orderNumber, amount },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
