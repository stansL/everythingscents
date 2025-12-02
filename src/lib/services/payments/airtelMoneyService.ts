import axios from 'axios';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  AirtelMoneyRequest,
  AirtelMoneyResponse,
} from './types';

/**
 * Airtel Money API Service
 * Handles mobile money payment requests via Airtel Money
 */
export class AirtelMoneyService {
  private clientId: string;
  private clientSecret: string;
  private merchantId: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    // Load from environment variables
    this.clientId = process.env.AIRTEL_CLIENT_ID || '';
    this.clientSecret = process.env.AIRTEL_CLIENT_SECRET || '';
    this.merchantId = process.env.AIRTEL_MERCHANT_ID || '';
    
    // Use staging or production based on environment
    this.baseUrl = process.env.AIRTEL_ENV === 'production'
      ? 'https://openapiuat.airtel.africa'
      : 'https://openapiuat.airtel.africa'; // Airtel uses UAT for testing
  }

  /**
   * Get OAuth access token from Airtel Money API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/oauth2/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Airtel tokens typically expire in 3600 seconds (1 hour)
      this.tokenExpiry = new Date(Date.now() + 3500 * 1000); // Refresh 100s before expiry
      
      return this.accessToken;
    } catch (error) {
      console.error('Airtel Money auth error:', error);
      throw new Error('Failed to authenticate with Airtel Money');
    }
  }

  /**
   * Initiate Airtel Money payment request
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: 'Phone number is required for Airtel Money payments',
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      // Format phone number (remove + and country code prefix)
      let phoneNumber = request.phoneNumber.replace(/\D/g, '');
      if (phoneNumber.startsWith('254')) {
        phoneNumber = phoneNumber.slice(3);
      } else if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.slice(1);
      }

      const airtelRequest: AirtelMoneyRequest = {
        reference: request.reference,
        subscriber: {
          country: 'KE', // Kenya
          currency: request.currency || 'KES',
          msisdn: phoneNumber,
        },
        transaction: {
          amount: (request.amount / 100).toFixed(2), // Convert cents to decimal
          country: 'KE',
          currency: request.currency || 'KES',
          id: request.reference,
        },
      };

      const response = await axios.post<AirtelMoneyResponse>(
        `${this.baseUrl}/merchant/v1/payments/`,
        airtelRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'KE',
            'X-Currency': request.currency || 'KES',
          },
        }
      );

      const data = response.data;

      // Airtel returns status in data.status.code
      if (data.status?.code === '200' || data.status?.success) {
        return {
          success: true,
          transactionId: data.data?.transaction?.id || request.reference,
          reference: request.reference,
          status: PaymentStatus.PENDING,
          message: data.status?.message || 'Payment initiated successfully',
        };
      } else {
        return {
          success: false,
          reference: request.reference,
          status: PaymentStatus.FAILED,
          error: data.status?.message || 'Payment initiation failed',
        };
      }
    } catch (error: any) {
      console.error('Airtel Money payment error:', error.response?.data || error.message);
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: error.response?.data?.status?.message || 'Failed to initiate Airtel Money payment',
      };
    }
  }

  /**
   * Query Airtel Money transaction status
   */
  async queryTransactionStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': 'KE',
            'X-Currency': 'KES',
          },
        }
      );

      const data = response.data;
      
      // Map Airtel status to our payment status
      let status: PaymentStatus;
      const airtelStatus = data.data?.transaction?.status?.toLowerCase();
      
      switch (airtelStatus) {
        case 'ts':
        case 'success':
          status = PaymentStatus.COMPLETED;
          break;
        case 'tp':
        case 'pending':
          status = PaymentStatus.PENDING;
          break;
        case 'tf':
        case 'failed':
          status = PaymentStatus.FAILED;
          break;
        case 'ta':
        case 'timeout':
          status = PaymentStatus.CANCELLED;
          break;
        default:
          status = PaymentStatus.PENDING;
      }

      return {
        success: status === PaymentStatus.COMPLETED,
        transactionId,
        reference: data.data?.transaction?.id,
        status,
        message: data.status?.message,
      };
    } catch (error: any) {
      console.error('Airtel Money query error:', error.response?.data || error.message);
      return {
        success: false,
        transactionId,
        reference: transactionId,
        status: PaymentStatus.FAILED,
        error: 'Failed to query transaction status',
      };
    }
  }

  /**
   * Process Airtel Money callback/webhook
   */
  processCallback(callbackData: any): PaymentResponse {
    const transaction = callbackData.transaction;
    const transactionStatus = transaction?.status?.toLowerCase();

    let status: PaymentStatus;
    switch (transactionStatus) {
      case 'ts':
      case 'success':
        status = PaymentStatus.COMPLETED;
        break;
      case 'tf':
      case 'failed':
        status = PaymentStatus.FAILED;
        break;
      case 'ta':
      case 'timeout':
        status = PaymentStatus.CANCELLED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    return {
      success: status === PaymentStatus.COMPLETED,
      transactionId: transaction?.id,
      reference: transaction?.id,
      status,
      message: transaction?.message,
    };
  }
}

export const airtelMoneyService = new AirtelMoneyService();
