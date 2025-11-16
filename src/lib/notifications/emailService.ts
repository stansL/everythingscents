/**
 * Email Service
 * Handles email notifications with templates
 */

import { EmailPayload, NotificationResponse, NotificationChannel } from './types';

/**
 * Email Service Configuration
 * Uses environment variables for SMTP or email API credentials
 */
interface EmailConfig {
  enabled: boolean;
  from: string;
  replyTo: string;
  apiKey?: string;
  apiUrl?: string;
}

class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true',
      from: process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@everythingscents.co.ke',
      replyTo: process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || 'info@everythingscents.co.ke',
      apiKey: process.env.NEXT_PUBLIC_EMAIL_API_KEY,
      apiUrl: process.env.NEXT_PUBLIC_EMAIL_API_URL,
    };
  }

  /**
   * Send email notification
   */
  async sendEmail(payload: EmailPayload): Promise<NotificationResponse> {
    try {
      if (!this.config.enabled) {
        console.warn('Email service not enabled. Email not sent.');
        return {
          success: false,
          errors: {
            [NotificationChannel.EMAIL]: 'Email service not configured',
          },
        };
      }

      // Validate email address
      if (!this.validateEmail(payload.to)) {
        return {
          success: false,
          errors: {
            [NotificationChannel.EMAIL]: 'Invalid email address',
          },
        };
      }

      // TODO: Implement actual email sending via API (SendGrid, Mailgun, etc.)
      // For now, log the email
      console.log('Email would be sent:', {
        from: this.config.from,
        to: payload.to,
        subject: payload.subject,
        body: payload.htmlBody || payload.textBody,
      });

      // Simulated successful send
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        errors: {
          [NotificationChannel.EMAIL]: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(payloads: EmailPayload[]): Promise<NotificationResponse[]> {
    const results = await Promise.allSettled(
      payloads.map((payload) => this.sendEmail(payload))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          errors: {
            [NotificationChannel.EMAIL]: result.reason.message,
          },
        };
      }
    });
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Email Templates
   */

  /**
   * Invoice sent email template
   */
  createInvoiceEmail(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    invoiceUrl: string
  ): EmailPayload {
    const subject = `Invoice ${invoiceNumber} - Everything Scents`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9fafb; }
            .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Everything Scents</h1>
            </div>
            <div class="content">
              <h2>Hi ${clientName},</h2>
              <p>Your invoice is ready for review.</p>
              
              <div class="invoice-details">
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Amount Due:</strong> KES ${amount.toLocaleString()}</p>
                <p><strong>Due Date:</strong> ${dueDate}</p>
              </div>
              
              <p>Please review your invoice and make payment at your earliest convenience.</p>
              
              <a href="${invoiceUrl}" class="button">View Invoice</a>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Everything Scents<br>
              Email: ${this.config.replyTo}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hi ${clientName},

Your invoice is ready for review.

Invoice Number: ${invoiceNumber}
Amount Due: KES ${amount.toLocaleString()}
Due Date: ${dueDate}

View your invoice: ${invoiceUrl}

Please review your invoice and make payment at your earliest convenience.

If you have any questions, please contact us at ${this.config.replyTo}.

- Everything Scents
    `;

    return {
      to,
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Payment confirmation email template
   */
  createPaymentConfirmationEmail(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    paymentMethod: string,
    reference: string
  ): EmailPayload {
    const subject = `Payment Confirmation - Invoice ${invoiceNumber}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9fafb; }
            .payment-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received!</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2>Thank you, ${clientName}!</h2>
              <p>We've successfully received your payment.</p>
              
              <div class="payment-details">
                <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p><strong>Amount Paid:</strong> KES ${amount.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Reference:</strong> ${reference}</p>
              </div>
              
              <p>Your payment has been processed and applied to your account.</p>
              <p>We appreciate your business!</p>
            </div>
            <div class="footer">
              <p>Everything Scents<br>
              Email: ${this.config.replyTo}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Payment Received!

Thank you, ${clientName}!

We've successfully received your payment.

Invoice Number: ${invoiceNumber}
Amount Paid: KES ${amount.toLocaleString()}
Payment Method: ${paymentMethod}
Reference: ${reference}

Your payment has been processed and applied to your account.

We appreciate your business!

- Everything Scents
${this.config.replyTo}
    `;

    return {
      to,
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Delivery notification email template
   */
  createDeliveryEmail(
    to: string,
    clientName: string,
    orderNumber: string,
    status: 'scheduled' | 'out_for_delivery' | 'delivered',
    trackingInfo?: string
  ): EmailPayload {
    const statusMessages = {
      scheduled: 'Your delivery has been scheduled',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered',
    };

    const subject = `${statusMessages[status]} - Order ${orderNumber}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Delivery Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9fafb; }
            .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Delivery Update</h1>
            </div>
            <div class="content">
              <h2>Hi ${clientName},</h2>
              <p><strong>${statusMessages[status]}</strong></p>
              
              <div class="order-details">
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                ${trackingInfo ? `<p><strong>Tracking:</strong> ${trackingInfo}</p>` : ''}
              </div>
              
              ${status === 'delivered' 
                ? '<p>Thank you for choosing Everything Scents. We hope you enjoy your purchase!</p>' 
                : '<p>We\'ll keep you updated on your delivery status.</p>'}
            </div>
            <div class="footer">
              <p>Everything Scents<br>
              Email: ${this.config.replyTo}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hi ${clientName},

${statusMessages[status]}

Order Number: ${orderNumber}
${trackingInfo ? `Tracking: ${trackingInfo}` : ''}

${status === 'delivered' 
  ? 'Thank you for choosing Everything Scents. We hope you enjoy your purchase!' 
  : 'We\'ll keep you updated on your delivery status.'}

- Everything Scents
${this.config.replyTo}
    `;

    return {
      to,
      subject,
      htmlBody,
      textBody,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
