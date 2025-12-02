import axios from 'axios';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  MpesaSTKPushRequest,
  MpesaSTKPushResponse,
} from './types';

/**
 * M-Pesa Daraja API Service
 * Handles STK Push (Lipa Na M-Pesa Online) payment requests
 */
export class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private shortcode: string;
  private passkey: string;
  private baseUrl: string;
  private callbackUrl: string;

  constructor() {
    // Load from environment variables
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || '';
    
    // Use sandbox or production based on environment
    this.baseUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Get OAuth access token from M-Pesa API
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('M-Pesa auth error:', error);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Generate M-Pesa password
   */
  private generatePassword(timestamp: string): string {
    const data = `${this.shortcode}${this.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Initiate STK Push payment request
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: 'Phone number is required for M-Pesa payments',
      };
    }

    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const password = this.generatePassword(timestamp);

      // Format phone number (remove + and ensure it starts with 254)
      let phoneNumber = request.phoneNumber.replace(/\D/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.slice(1);
      } else if (phoneNumber.startsWith('254')) {
        phoneNumber = phoneNumber;
      } else if (phoneNumber.startsWith('+254')) {
        phoneNumber = phoneNumber.slice(1);
      }

      const stkPushRequest: MpesaSTKPushRequest = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount / 100), // Convert cents to KES
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: request.reference,
        TransactionDesc: request.description || 'Payment',
      };

      const response = await axios.post<MpesaSTKPushResponse>(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        stkPushRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (data.ResponseCode === '0') {
        return {
          success: true,
          transactionId: data.CheckoutRequestID,
          reference: request.reference,
          status: PaymentStatus.PENDING,
          message: data.CustomerMessage,
        };
      } else {
        return {
          success: false,
          reference: request.reference,
          status: PaymentStatus.FAILED,
          error: data.ResponseDescription,
        };
      }
    } catch (error: any) {
      console.error('M-Pesa STK Push error:', error.response?.data || error.message);
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment',
      };
    }
  }

  /**
   * Query STK Push transaction status
   */
  async queryTransactionStatus(checkoutRequestId: string): Promise<PaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const password = this.generatePassword(timestamp);

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;
      
      // Map M-Pesa result codes to our payment status
      let status: PaymentStatus;
      if (data.ResultCode === '0') {
        status = PaymentStatus.COMPLETED;
      } else if (data.ResultCode === '1032') {
        status = PaymentStatus.CANCELLED; // User cancelled
      } else {
        status = PaymentStatus.FAILED;
      }

      return {
        success: data.ResultCode === '0',
        transactionId: checkoutRequestId,
        reference: data.CheckoutRequestID,
        status,
        message: data.ResultDesc,
      };
    } catch (error: any) {
      console.error('M-Pesa query error:', error.response?.data || error.message);
      return {
        success: false,
        transactionId: checkoutRequestId,
        reference: checkoutRequestId,
        status: PaymentStatus.FAILED,
        error: 'Failed to query transaction status',
      };
    }
  }

  /**
   * Process M-Pesa callback
   */
  processCallback(callbackData: any): PaymentResponse {
    const resultCode = callbackData.Body?.stkCallback?.ResultCode;
    const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;
    const resultDesc = callbackData.Body?.stkCallback?.ResultDesc;

    let status: PaymentStatus;
    if (resultCode === 0) {
      status = PaymentStatus.COMPLETED;
    } else if (resultCode === 1032) {
      status = PaymentStatus.CANCELLED;
    } else {
      status = PaymentStatus.FAILED;
    }

    return {
      success: resultCode === 0,
      transactionId: checkoutRequestId,
      reference: checkoutRequestId,
      status,
      message: resultDesc,
    };
  }
}

export const mpesaService = new MpesaService();
