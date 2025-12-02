import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider, PaymentStatus } from '@/lib/services/payments/types';
import { paymentService } from '@/lib/services/payments/paymentService';
import { paystackService } from '@/lib/services/payments/paystackService';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { PaymentMethod } from '@/lib/services/invoices/types';

/**
 * Paystack Webhook Handler
 * Processes payment notifications from Paystack API
 * 
 * Important: Paystack sends webhooks for various events.
 * We primarily handle 'charge.success' events.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('=== PAYSTACK WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Verify webhook signature
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.text();
    
    console.log('Body length:', body.length);
    console.log('Signature present:', !!signature);
    
    if (!signature) {
      console.error('❌ Missing Paystack signature');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the webhook is from Paystack
    console.log('🔍 Verifying signature...');
    const isValid = paystackService.verifyWebhookSignature(signature, body);
    
    if (!isValid) {
      console.error('❌ Invalid Paystack signature');
      console.error('Expected signature to match:', signature);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Signature verified');

    const webhookData = JSON.parse(body);
    
    console.log('📦 Webhook data:', JSON.stringify(webhookData, null, 2));

    // Process the webhook
    const result = paymentService.processCallback(
      PaymentProvider.PAYSTACK,
      webhookData
    );

    if (result.success && result.status === PaymentStatus.COMPLETED) {
      console.log('✅ Paystack payment successful:', result);
      
      // Extract invoice ID from metadata if available
      const invoiceId = result.metadata?.invoiceId;
      
      console.log('📋 Invoice ID from metadata:', invoiceId);
      console.log('💰 Payment amount:', result.amount);
      
      if (invoiceId && result.amount) {
        // Record payment in invoice
        const paymentResult = await InvoiceService.recordPayment(invoiceId, {
          amount: result.amount,
          method: PaymentMethod.PAYSTACK,
          reference: result.transactionId || result.reference,
          processedAt: new Date(),
          notes: `Paystack card payment - ${result.message || 'Payment successful'}`,
        });

        if (paymentResult.success) {
          console.log('✅ Payment recorded to invoice:', invoiceId);
          console.log('⏱️ Webhook processing time:', Date.now() - startTime, 'ms');
          // TODO: Send email notification to customer
          // TODO: Trigger post-payment workflows (e.g., order fulfillment)
        } else {
          console.error('❌ Failed to record payment to invoice:', paymentResult.error);
        }
      } else {
        console.warn('⚠️ Missing invoice ID or amount. InvoiceId:', invoiceId, 'Amount:', result.amount);
      }
    } else {
      console.error('❌ Paystack payment failed or unsupported event:', result);
    }

    console.log('=== PAYSTACK WEBHOOK COMPLETED ===');
    console.log('Total processing time:', Date.now() - startTime, 'ms');
    
    // Return success response to Paystack
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('❌ PAYSTACK WEBHOOK ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    // Return error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Paystack only sends POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
