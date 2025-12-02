import { PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus } from './types';
import { mpesaService } from './mpesaService';
import { airtelMoneyService } from './airtelMoneyService';
import { paystackService } from './paystackService';

/**
 * Unified Payment Service
 * Routes payment requests to the appropriate provider
 */
export class PaymentService {
  /**
   * Process a payment using the specified provider
   */
  async processPayment(
    provider: PaymentProvider,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      switch (provider) {
        case PaymentProvider.MPESA:
          return await mpesaService.initiatePayment(request);
        
        case PaymentProvider.AIRTEL_MONEY:
          return await airtelMoneyService.initiatePayment(request);
        
        case PaymentProvider.PAYSTACK:
          return await paystackService.initiatePayment(request);
        
        default:
          return {
            success: false,
            reference: request.reference,
            status: PaymentStatus.FAILED,
            error: `Unsupported payment provider: ${provider}`,
          };
      }
    } catch (error: any) {
      console.error(`Payment processing error [${provider}]:`, error.message);
      return {
        success: false,
        reference: request.reference,
        status: PaymentStatus.FAILED,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(
    provider: PaymentProvider,
    transactionId: string
  ): Promise<PaymentResponse> {
    try {
      switch (provider) {
        case PaymentProvider.MPESA:
          return await mpesaService.queryTransactionStatus(transactionId);
        
        case PaymentProvider.AIRTEL_MONEY:
          return await airtelMoneyService.queryTransactionStatus(transactionId);
        
        case PaymentProvider.PAYSTACK:
          return await paystackService.verifyPayment(transactionId);
        
        default:
          return {
            success: false,
            transactionId,
            reference: transactionId,
            status: PaymentStatus.FAILED,
            error: `Unsupported payment provider: ${provider}`,
          };
      }
    } catch (error: any) {
      console.error(`Payment verification error [${provider}]:`, error.message);
      return {
        success: false,
        transactionId,
        reference: transactionId,
        status: PaymentStatus.FAILED,
        error: error.message || 'Payment verification failed',
      };
    }
  }

  /**
   * Process a payment callback/webhook
   */
  processCallback(
    provider: PaymentProvider,
    callbackData: any
  ): PaymentResponse {
    try {
      switch (provider) {
        case PaymentProvider.MPESA:
          return mpesaService.processCallback(callbackData);
        
        case PaymentProvider.AIRTEL_MONEY:
          return airtelMoneyService.processCallback(callbackData);
        
        case PaymentProvider.PAYSTACK:
          return paystackService.processWebhook(callbackData);
        
        default:
          return {
            success: false,
            reference: '',
            status: PaymentStatus.FAILED,
            error: `Unsupported payment provider: ${provider}`,
          };
      }
    } catch (error: any) {
      console.error(`Callback processing error [${provider}]:`, error.message);
      return {
        success: false,
        reference: '',
        status: PaymentStatus.FAILED,
        error: error.message || 'Callback processing failed',
      };
    }
  }

  /**
   * Get available payment providers based on configuration
   */
  getAvailableProviders(): PaymentProvider[] {
    const providers: PaymentProvider[] = [];

    // Check if each provider is configured
    // For client-side, we check for NEXT_PUBLIC_ prefixed vars
    // For server-side, we check for the secret keys
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // Client-side: check for public keys only
      if (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        providers.push(PaymentProvider.PAYSTACK);
      }
      // M-Pesa and Airtel don't have client-side public keys
      // We'll assume they're available if Paystack is (admin will configure all)
      // Or we can add feature flags
      if (process.env.NEXT_PUBLIC_ENABLE_MPESA === 'true') {
        providers.push(PaymentProvider.MPESA);
      }
      if (process.env.NEXT_PUBLIC_ENABLE_AIRTEL === 'true') {
        providers.push(PaymentProvider.AIRTEL_MONEY);
      }
    } else {
      // Server-side: check for secret keys
      if (process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET) {
        providers.push(PaymentProvider.MPESA);
      }

      if (process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET) {
        providers.push(PaymentProvider.AIRTEL_MONEY);
      }

      if (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY) {
        providers.push(PaymentProvider.PAYSTACK);
      }
    }

    return providers;
  }

  /**
   * Determine the best payment provider based on phone number or email
   */
  suggestProvider(phoneNumber?: string, email?: string): PaymentProvider | null {
    const available = this.getAvailableProviders();

    if (available.length === 0) {
      return null;
    }

    // If phone number provided, prefer mobile money
    if (phoneNumber) {
      const number = phoneNumber.replace(/\D/g, '');
      
      // Kenyan numbers - check network
      if (number.startsWith('254') || number.startsWith('0')) {
        const prefix = number.slice(-9, -7); // Get network prefix
        
        // Safaricom prefixes: 70, 71, 72, 74, 79
        if (['70', '71', '72', '74', '79'].includes(prefix)) {
          if (available.includes(PaymentProvider.MPESA)) {
            return PaymentProvider.MPESA;
          }
        }
        
        // Airtel prefixes: 73, 78
        if (['73', '78'].includes(prefix)) {
          if (available.includes(PaymentProvider.AIRTEL_MONEY)) {
            return PaymentProvider.AIRTEL_MONEY;
          }
        }
      }
    }

    // If email provided and Paystack available, suggest Paystack (supports cards)
    if (email && available.includes(PaymentProvider.PAYSTACK)) {
      return PaymentProvider.PAYSTACK;
    }

    // Return first available provider as fallback
    return available[0];
  }

  /**
   * Format amount for display (cents to currency)
   */
  formatAmount(amount: number, currency: string = 'KES'): string {
    const value = (amount / 100).toFixed(2);
    return `${currency} ${value}`;
  }

  /**
   * Get Paystack public key for frontend integration
   */
  getPaystackPublicKey(): string | null {
    if (this.getAvailableProviders().includes(PaymentProvider.PAYSTACK)) {
      return paystackService.getPublicKey();
    }
    return null;
  }
}

export const paymentService = new PaymentService();
