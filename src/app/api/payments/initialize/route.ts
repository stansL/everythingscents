import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payments/paymentService';
import { PaymentProvider, PaymentRequest } from '@/lib/services/payments/types';

/**
 * POST /api/payments/initialize
 * Initialize a payment transaction with the specified provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, paymentRequest } = body as {
      provider: PaymentProvider;
      paymentRequest: PaymentRequest;
    };

    if (!provider || !paymentRequest) {
      return NextResponse.json(
        { error: 'Provider and payment request are required' },
        { status: 400 }
      );
    }

    // Process payment through the service (server-side has access to env vars)
    const result = await paymentService.processPayment(provider, paymentRequest);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize payment',
      },
      { status: 500 }
    );
  }
}
