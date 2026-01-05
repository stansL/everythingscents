import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider, PaymentStatus } from '@/lib/services/payments/types';
import { paymentService } from '@/lib/services/payments/paymentService';
import { InvoiceService } from '@/lib/services/invoices/invoiceService';
import { OrderService } from '@/lib/services/orders/orderService';
import { abandonedCartService } from '@/lib/services/abandonedCartService';
import { PaymentMethod } from '@/lib/services/invoices/types';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';

/**
 * M-Pesa STK Push Callback Handler
 * Processes payment notifications from Safaricom Daraja API
 * Handles both invoice payments (admin B2B) and order payments (PWA)
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
      
      // Extract invoice ID or order ID from metadata
      const invoiceId = result.metadata?.invoiceId;
      const orderId = result.metadata?.orderId;
      
      if (invoiceId && result.amount) {
        // Scenario 1: Invoice payment (Admin B2B workflow)
        console.log('📄 Processing invoice payment:', invoiceId);
        const paymentResult = await InvoiceService.recordPayment(invoiceId, {
          amount: result.amount,
          method: PaymentMethod.MPESA,
          reference: result.transactionId || result.reference,
          processedAt: new Date(),
          notes: `M-Pesa payment - ${result.message || 'Payment successful'}`,
        });

        if (paymentResult.success) {
          console.log('✅ Payment recorded to invoice:', invoiceId);
        } else {
          console.error('❌ Failed to record payment to invoice:', paymentResult.error);
        }
      } else if (orderId && result.amount) {
        // Scenario 2: Order payment (PWA workflow)
        console.log('🛍️ Processing order payment by reference:', orderId);
        
        try {
          // Query orders by paymentReference (orderId is actually the payment reference)
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentReference', '==', orderId), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.log('⏳ Order not created yet - webhook arrived before PWA order creation');
            console.log('✅ PWA will handle via confirmOrder API after creating order');
            return NextResponse.json({
              ResultCode: 0,
              ResultDesc: 'Payment received, order will be processed by PWA',
            });
          }
          
          const orderDoc = querySnapshot.docs[0];
          const actualOrderId = orderDoc.id;
          console.log('✅ Found order:', actualOrderId);
          
          // Confirm order and auto-generate paid invoice
          const confirmResult = await OrderService.confirmOrder(actualOrderId, true);
          
          if (confirmResult.success) {
            console.log('✅ Order confirmed and invoice generated:', confirmResult.data?.invoiceId);
            
            // Update additional payment details in Firestore
            const orderRef = doc(db, 'orders', actualOrderId);
            await updateDoc(orderRef, {
              paymentTransactionId: result.transactionId || result.reference,
              paidAt: Timestamp.now(),
              paymentDetails: {
                provider: PaymentProvider.MPESA,
                amount: result.amount,
                reference: result.reference,
                transactionId: result.transactionId,
              phoneNumber: result.metadata?.phoneNumber,
            },
          });
          
          // Mark abandoned cart as recovered
          try {
            await abandonedCartService.markCartRecovered(
              result.reference,
              actualOrderId,
              confirmResult.data?.invoiceId
            );
            console.log('✅ Abandoned cart marked as recovered');
          } catch (error) {
            console.error('⚠️ Failed to update abandoned cart:', error);
          }
          } else {
            console.error('❌ Failed to confirm order:', confirmResult.error);
          }
        } catch (error) {
          console.error('💥 Order confirmation error:', error);
        }
      } else {
        console.warn('⚠️ No invoice ID or order ID in callback metadata');
      }
    } else {
      console.error('M-Pesa payment failed:', result);
      
      // Track failed payment
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
