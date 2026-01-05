import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider, PaymentStatus } from '@/lib/services/payments/types';
import { paymentService } from '@/lib/services/payments/paymentService';
import { paystackService } from '@/lib/services/payments/paystackService';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { OrderService } from '@/lib/services/orders/orderService';
import { abandonedCartService } from '@/lib/services/abandonedCartService';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

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
      
      // Extract invoice ID or order ID from metadata
      const invoiceId = result.metadata?.invoiceId;
      const orderId = result.metadata?.orderId;
      
      console.log('📋 Invoice ID from metadata:', invoiceId);
      console.log('📋 Order ID from metadata:', orderId);
      console.log('💰 Payment amount:', result.amount);
      
      // Handle invoice payment (from admin portal)
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
      }
      // Handle order payment (from PWA)
      else if (orderId && result.amount) {
        try {
          console.log('🛒 Looking up PWA order by payment reference:', orderId);
          
          // Query orders by paymentReference (orderId is actually the payment reference)
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentReference', '==', orderId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.log('⏳ Order not created yet - this is expected for webhook-first scenario');
            console.log('✅ Webhook will be processed by PWA after order creation');
            console.log('⏱️ Webhook processing time:', Date.now() - startTime, 'ms');
            return NextResponse.json({ received: true, message: 'Order will be processed by PWA' });
          }
          
          const orderDoc = querySnapshot.docs[0];
          const actualOrderId = orderDoc.id;
          console.log('✅ Found order:', actualOrderId);
          
          // Use OrderService.confirmOrder to automatically generate invoice
          const confirmResult = await OrderService.confirmOrder(actualOrderId, true); // isPaid = true
          
          if (confirmResult.success && confirmResult.data) {
            console.log('✅ PWA order confirmed successfully:', actualOrderId);
            console.log('📄 Invoice auto-generated:', confirmResult.data.invoiceId);
            
            // Update additional payment details that confirmOrder doesn't set
            const orderRef = doc(db, 'orders', actualOrderId);
            await updateDoc(orderRef, {
              paymentTransactionId: result.transactionId || result.reference,
              paymentReference: result.reference,
              paidAt: Timestamp.fromDate(new Date()),
              paymentDetails: {
                provider: 'paystack',
                amount: result.amount,
                fees: result.fees || 0,
                channel: result.metadata?.channel || 'unknown',
                currency: result.metadata?.currency || 'KES',
                paidAt: result.metadata?.paid_at || new Date().toISOString(),
              }
            });
            
            console.log('✅ Payment details updated');
            
            // Mark abandoned cart as recovered and update payment intent
            try {
              await abandonedCartService.markCartRecovered(
                result.reference,
                actualOrderId,
                confirmResult.data.invoiceId
              );
              console.log('✅ Abandoned cart marked as recovered');
            } catch (error) {
              console.error('⚠️ Failed to update abandoned cart:', error);
              // Don't fail the webhook if this fails
            }
            
            console.log('⏱️ Webhook processing time:', Date.now() - startTime, 'ms');
            // TODO: Send email notification to customer
            // TODO: Trigger order fulfillment workflows
          } else {
            console.error('❌ Failed to confirm order:', confirmResult.error);
            
            // Fallback: update order directly without invoice generation
            console.log('⚠️ Falling back to direct order update');
            const orderRef = doc(db, 'orders', actualOrderId);
            await updateDoc(orderRef, {
              status: 'processing',
              isPaid: true,
              paymentStatus: 'paid',
              paymentTransactionId: result.transactionId || result.reference,
              paymentReference: result.reference,
              paidAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
              paymentDetails: {
                provider: 'paystack',
                amount: result.amount,
                fees: result.fees || 0,
                channel: result.metadata?.channel || 'unknown',
                currency: result.metadata?.currency || 'KES',
                paidAt: result.metadata?.paid_at || new Date().toISOString(),
              }
            });
            console.log('✅ Direct order update completed');
          }
        } catch (error: any) {
          console.error('❌ Failed to confirm/update PWA order:', error.message);
          console.error('Stack:', error.stack);
        }
      } else {
        console.warn('⚠️ Missing invoice/order ID or amount. InvoiceId:', invoiceId, 'OrderId:', orderId, 'Amount:', result.amount);
      }
    } else {
      console.error('❌ Paystack payment failed or unsupported event:', result);
      
      // Track failed payment in payment intents
      if (result.reference) {
        try {
          await abandonedCartService.updatePaymentIntent(
            result.reference,
            'failed',
            {
              errorCode: result.status,
              errorMessage: result.message || 'Payment failed',
            }
          );
          console.log('✅ Payment intent marked as failed');
        } catch (error) {
          console.error('⚠️ Failed to update payment intent:', error);
        }
      }
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
