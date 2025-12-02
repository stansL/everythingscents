import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider, PaymentStatus } from '@/lib/services/payments/types';
import { paymentService } from '@/lib/services/payments/paymentService';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { PaymentMethod } from '@/lib/services/invoices/types';

/**
 * M-Pesa STK Push Callback Handler
 * Processes payment notifications from Safaricom Daraja API
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    // Process the callback
    const result = paymentService.processCallback(
      PaymentProvider.MPESA,
      callbackData
    );

    if (result.success && result.status === PaymentStatus.SUCCESS) {
      console.log('M-Pesa payment successful:', result);
      
      // Extract invoice ID from metadata if available
      const invoiceId = result.metadata?.invoiceId;
      
      if (invoiceId && result.amount) {
        // Record payment in invoice
        const paymentResult = await InvoiceService.recordPayment(invoiceId, {
          amount: result.amount,
          method: PaymentMethod.MPESA,
          reference: result.transactionId || result.reference,
          processedAt: new Date(),
          notes: `M-Pesa payment - ${result.message || 'Payment successful'}`,
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
      console.error('M-Pesa payment failed:', result);
    }

    // Always return success to M-Pesa to acknowledge receipt
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received successfully',
    });
  } catch (error: any) {
    console.error('M-Pesa callback error:', error.message);
    
    // Still return success to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received',
    });
  }
}

// M-Pesa only sends POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
