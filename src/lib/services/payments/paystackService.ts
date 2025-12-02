import axios from 'axios';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaystackInitializeRequest,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from './types';

/**
 * Paystack API Service
 * Handles card and bank payment processing via Paystack
 */
export class PaystackService {
  private secretKey: string;
  private publicKey: string;
  private baseUrl: string;

  constructor() {
    // Load from environment variables
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
    this.baseUrl = 'https://api.paystack.co';
  }

  /**
   * Initialize a payment transaction
   * Returns a checkout URL for the customer to complete payment
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.email) {
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: 'Email is required for Paystack payments',
      };
    }

    try {
      const paystackRequest: PaystackInitializeRequest = {
        email: request.email,
        amount: Math.round(request.amount), // Paystack expects amount in kobo (cents)
        reference: request.reference,
        currency: request.currency || 'KES',
        callback_url: request.callbackUrl,
        metadata: {
          ...request.metadata,
          phoneNumber: request.phoneNumber,
        },
        channels: request.channels || ['card', 'bank', 'mobile_money', 'bank_transfer'],
      };

      const response = await axios.post<{ status: boolean; message: string; data: PaystackInitializeResponse }>(
        `${this.baseUrl}/transaction/initialize`,
        paystackRequest,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.status) {
        return {
          success: true,
          transactionId: data.data.reference,
          reference: data.data.reference,
          status: PaymentStatus.PENDING,
          checkoutUrl: data.data.authorization_url,
          message: 'Payment initialized successfully',
        };
      } else {
        return {
          success: false,
          reference: request.reference,
          status: PaymentStatus.FAILED,
          error: data.message,
        };
      }
    } catch (error: any) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: error.response?.data?.message || 'Failed to initialize Paystack payment',
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get<{ status: boolean; message: string; data: PaystackVerifyResponse }>(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.status && data.data) {
        // Map Paystack status to our payment status
        let status: PaymentStatus;
        switch (data.data.status) {
          case 'success':
            status = PaymentStatus.COMPLETED;
            break;
          case 'failed':
            status = PaymentStatus.FAILED;
            break;
          case 'abandoned':
            status = PaymentStatus.CANCELLED;
            break;
          default:
            status = PaymentStatus.PENDING;
        }

        return {
          success: data.data.status === 'success',
          transactionId: data.data.reference,
          reference: data.data.reference,
          status,
          amount: data.data.amount, // Already in kobo (cents)
          fees: data.data.fees,
          message: data.data.gateway_response,
          metadata: {
            channel: data.data.channel,
            currency: data.data.currency,
            ip_address: data.data.ip_address,
            paid_at: data.data.paid_at,
          },
        };
      } else {
        return {
          success: false,
          reference,
          status: PaymentStatus.FAILED,
          error: data.message || 'Verification failed',
        };
      }
    } catch (error: any) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      return {
        success: false,
        reference,
        status: PaymentStatus.FAILED,
        error: error.response?.data?.message || 'Failed to verify payment',
      };
    }
  }

  /**
   * List transactions with optional filters
   */
  async listTransactions(options?: {
    perPage?: number;
    page?: number;
    customer?: string;
    status?: 'success' | 'failed' | 'abandoned';
    from?: string;
    to?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options?.perPage) params.append('perPage', options.perPage.toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.customer) params.append('customer', options.customer);
      if (options?.status) params.append('status', options.status);
      if (options?.from) params.append('from', options.from);
      if (options?.to) params.append('to', options.to);

      const response = await axios.get(
        `${this.baseUrl}/transaction?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Paystack list transactions error:', error.response?.data || error.message);
      throw new Error('Failed to list transactions');
    }
  }

  /**
   * Process Paystack webhook
   */
  processWebhook(webhookData: any): PaymentResponse {
    const event = webhookData.event;
    const data = webhookData.data;

    // Only process charge.success events
    if (event !== 'charge.success') {
      return {
        success: false,
        reference: data?.reference,
        status: PaymentStatus.FAILED,
        error: `Unsupported event type: ${event}`,
      };
    }

    // Map Paystack status to our payment status
    let status: PaymentStatus;
    switch (data?.status) {
      case 'success':
        status = PaymentStatus.COMPLETED;
        break;
      case 'failed':
        status = PaymentStatus.FAILED;
        break;
      case 'abandoned':
        status = PaymentStatus.CANCELLED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    return {
      success: data?.status === 'success',
      transactionId: data?.reference,
      reference: data?.reference,
      status,
      amount: data?.amount,
      fees: data?.fees,
      message: data?.gateway_response,
      metadata: {
        ...data?.metadata, // Include original metadata (invoiceId, customerId, etc.)
        channel: data?.channel,
        currency: data?.currency,
        paid_at: data?.paid_at,
      },
    };
  }

  /**
   * Get public key for frontend integration
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  }
}

export const paystackService = new PaystackService();
