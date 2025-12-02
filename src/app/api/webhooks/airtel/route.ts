import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider, PaymentStatus } from '@/lib/services/payments/types';
import { paymentService } from '@/lib/services/payments/paymentService';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { PaymentMethod } from '@/lib/services/invoices/types';

/**
 * Airtel Money Callback Handler
 * Processes payment notifications from Airtel Money API
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    
    console.log('Airtel Money callback received:', JSON.stringify(callbackData, null, 2));

    // Process the callback
    const result = paymentService.processCallback(
      PaymentProvider.AIRTEL_MONEY,
      callbackData
    );

    if (result.success && result.status === PaymentStatus.SUCCESS) {
      console.log('Airtel Money payment successful:', result);
      
      // Extract invoice ID from metadata if available
      const invoiceId = result.metadata?.invoiceId;
      
      if (invoiceId && result.amount) {
        // Record payment in invoice
        const paymentResult = await InvoiceService.recordPayment(invoiceId, {
          amount: result.amount,
          method: PaymentMethod.AIRTEL_MONEY,
          reference: result.transactionId || result.reference,
          processedAt: new Date(),
          notes: `Airtel Money payment - ${result.message || 'Payment successful'}`,
        });

        if (paymentResult.success) {
          console.log('Payment recorded to invoice:', invoiceId);
          // TODO: Send SMS/email notification to customer
          // TODO: Trigger post-payment workflows (e.g., order fulfillment)
        } else {
          console.error('Failed to record payment to invoice:', paymentResult.error);
        }
      } else {
        console.warn('No invoice ID in callback metadata');
      }
    } else {
      console.error('Airtel Money payment failed:', result);
    }

    // Return success response to Airtel
    return NextResponse.json({
      status: {
        code: '200',
        message: 'Callback received successfully',
        success: true,
      },
    });
  } catch (error: any) {
    console.error('Airtel Money callback error:', error.message);
    
    // Return error response
    return NextResponse.json(
      {
        status: {
          code: '500',
          message: 'Internal server error',
          success: false,
        },
      },
      { status: 500 }
    );
  }
}

// Airtel Money only sends POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
