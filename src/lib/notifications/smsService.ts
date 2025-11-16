/**
 * SMS Service
 * Handles SMS notifications via Safaricom SMS API
 */

import { SMSPayload, NotificationResponse, NotificationChannel } from './types';

/**
 * Safaricom SMS API Configuration
 * These environment variables should be set in .env.local
 */
interface SafaricomConfig {
  apiKey: string;
  senderId: string;
  apiUrl: string;
}

class SMSService {
  private config: SafaricomConfig;

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_SAFARICOM_SMS_API_KEY || '',
      senderId: process.env.NEXT_PUBLIC_SAFARICOM_SENDER_ID || 'EverythingScents',
      apiUrl: process.env.NEXT_PUBLIC_SAFARICOM_SMS_API_URL || 'https://api.safaricom.co.ke/sms/v1/send',
    };
  }

  /**
   * Send SMS notification
   */
  async sendSMS(payload: SMSPayload): Promise<NotificationResponse> {
    try {
      // Validate phone number (Kenya format: +254 or 07xx/01xx)
      const formattedPhone = this.formatPhoneNumber(payload.phoneNumber);
      if (!formattedPhone) {
        return {
          success: false,
          errors: {
            [NotificationChannel.SMS]: 'Invalid phone number format',
          },
        };
      }

      // Check if SMS is configured
      if (!this.config.apiKey) {
        console.warn('Safaricom SMS API not configured. SMS not sent.');
        return {
          success: false,
          errors: {
            [NotificationChannel.SMS]: 'SMS service not configured',
          },
        };
      }

      // Prepare request
      const requestBody = {
        apiKey: this.config.apiKey,
        senderId: this.config.senderId,
        recipient: formattedPhone,
        message: payload.message,
        reference: payload.reference,
      };

      // Send SMS via Safaricom API
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SMS send failed:', errorText);
        return {
          success: false,
          errors: {
            [NotificationChannel.SMS]: `SMS API error: ${response.status}`,
          },
        };
      }

      const result = await response.json();
      console.log('SMS sent successfully:', result);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        errors: {
          [NotificationChannel.SMS]: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send bulk SMS notifications
   */
  async sendBulkSMS(payloads: SMSPayload[]): Promise<NotificationResponse[]> {
    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendSMS(payload))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          errors: {
            [NotificationChannel.SMS]: result.reason.message,
          },
        };
      }
    });
  }

  /**
   * Format phone number to Kenya standard (+254)
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove spaces and special characters
    let cleaned = phoneNumber.replace(/[\s\-()]/g, '');

    // Handle different formats
    if (cleaned.startsWith('+254')) {
      // Already in international format
      return cleaned;
    } else if (cleaned.startsWith('254')) {
      // Missing +
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      // Local format (07xx or 01xx)
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      // Missing leading 0
      return `+254${cleaned}`;
    }

    // Invalid format
    return null;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    return this.formatPhoneNumber(phoneNumber) !== null;
  }

  /**
   * Create SMS message from template
   */
  createInvoiceMessage(clientName: string, invoiceNumber: string, amount: number): string {
    return `Hi ${clientName}, your invoice ${invoiceNumber} for KES ${amount.toLocaleString()} has been sent. Please review and make payment. - Everything Scents`;
  }

  createPaymentConfirmationMessage(
    clientName: string,
    amount: number,
    reference: string
  ): string {
    return `Hi ${clientName}, we've received your payment of KES ${amount.toLocaleString()} (Ref: ${reference}). Thank you! - Everything Scents`;
  }

  createDeliveryMessage(
    clientName: string,
    status: 'scheduled' | 'out_for_delivery' | 'delivered'
  ): string {
    const messages = {
      scheduled: `Hi ${clientName}, your order has been scheduled for delivery. We'll notify you when it's on the way. - Everything Scents`,
      out_for_delivery: `Hi ${clientName}, your order is out for delivery and will arrive soon. - Everything Scents`,
      delivered: `Hi ${clientName}, your order has been delivered. Thank you for choosing Everything Scents!`,
    };
    return messages[status];
  }

  createPickupReadyMessage(clientName: string, orderNumber: string): string {
    return `Hi ${clientName}, your order ${orderNumber} is ready for pickup at our location. - Everything Scents`;
  }
}

// Export singleton instance
export const smsService = new SMSService();
