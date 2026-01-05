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
 * Airtel Money Callback Handler
 * Processes payment notifications from Airtel Money API
 * Handles both invoice payments (admin B2B) and order payments (PWA)
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
      
      // Extract invoice ID or order ID from metadata
      const invoiceId = result.metadata?.invoiceId;
      const orderId = result.metadata?.orderId;
      
      if (invoiceId && result.amount) {
        // Scenario 1: Invoice payment (Admin B2B workflow)
        console.log('📄 Processing invoice payment:', invoiceId);
        const paymentResult = await InvoiceService.recordPayment(invoiceId, {
          amount: result.amount,
          method: PaymentMethod.AIRTEL_MONEY,
          reference: result.transactionId || result.reference,
          processedAt: new Date(),
          notes: `Airtel Money payment - ${result.message || 'Payment successful'}`,
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
              status: {
                code: '200',
                message: 'Payment received, order will be processed by PWA',
                success: true,
              },
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
                provider: PaymentProvider.AIRTEL_MONEY,
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
      console.error('Airtel Money payment failed:', result);
      
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
