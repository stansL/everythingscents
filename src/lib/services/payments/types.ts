// Payment Services Types

export enum PaymentProvider {
  MPESA = 'mpesa',
  AIRTEL_MONEY = 'airtel_money',
  PAYSTACK = 'paystack'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface PaymentRequest {
  amount: number; // In cents
  phoneNumber?: string; // For mobile money (M-Pesa, Airtel Money)
  email?: string; // For Paystack
  currency: string; // KES, USD, etc.
  reference: string; // Unique payment reference
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  reference: string;
  status: PaymentStatus;
  message?: string;
  checkoutUrl?: string; // For Paystack redirect
  error?: string;
}

export interface PaymentCallback {
  transactionId: string;
  reference: string;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// M-Pesa Specific Types
export interface MpesaSTKPushRequest {
  BusinessShortCode: string;
  Password: string;
  Timestamp: string;
  TransactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
  Amount: number;
  PartyA: string; // Phone number
  PartyB: string; // Business shortcode
  PhoneNumber: string;
  CallBackURL: string;
  AccountReference: string;
  TransactionDesc: string;
}

export interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

// Airtel Money Specific Types
export interface AirtelMoneyRequest {
  reference: string;
  subscriber: {
    country: string; // KE for Kenya
    currency: string; // KES
    msisdn: string; // Phone number
  };
  transaction: {
    amount: number;
    country: string;
    currency: string;
    id: string;
  };
}

export interface AirtelMoneyResponse {
  data: {
    transaction: {
      id: string;
      status: string;
    };
  };
  status: {
    code: string;
    message: string;
    result_code: string;
    success: boolean;
  };
}

// Paystack Specific Types
export interface PaystackInitializeRequest {
  email: string;
  amount: number; // In cents
  reference: string;
  currency?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[]; // ['card', 'bank', 'mobile_money']
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    amount: number;
    currency: string;
    transaction_date: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    gateway_response: string;
    channel: string;
    fees: number;
    customer: {
      email: string;
      phone?: string;
    };
  };
}

// Payment Gateway Configuration
export interface PaymentGatewayConfig {
  provider: PaymentProvider;
  enabled: boolean;
  testMode: boolean;
  credentials: {
    // M-Pesa
    mpesaConsumerKey?: string;
    mpesaConsumerSecret?: string;
    mpesaShortcode?: string;
    mpesaPasskey?: string;
    
    // Airtel Money
    airtelClientId?: string;
    airtelClientSecret?: string;
    airtelMerchantId?: string;
    
    // Paystack
    paystackSecretKey?: string;
    paystackPublicKey?: string;
  };
  webhookUrl?: string;
  callbackUrl?: string;
}
