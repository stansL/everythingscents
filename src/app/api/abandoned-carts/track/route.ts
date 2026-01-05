/**
 * Abandoned Cart Tracking API
 * Tracks checkout abandonment and payment intents
 */

import { NextRequest, NextResponse } from 'next/server';
import { abandonedCartService, AbandonmentStage } from '@/lib/services/abandonedCartService';
import { Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'checkout_started': {
        // User reached checkout page
        const result = await abandonedCartService.createAbandonedCart({
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          shippingCost: data.shippingCost,
          total: data.total,
          deliveryMethod: data.deliveryMethod,
          deliveryAddress: data.deliveryAddress,
          stage: AbandonmentStage.CHECKOUT_STARTED,
          checkoutStartedAt: Timestamp.now(),
          lastActivityAt: Timestamp.now(),
          recovered: false,
          remindersSent: 0,
          contactAttempts: 0,
          userAgent: request.headers.get('user-agent') || undefined,
          deviceType: data.deviceType || 'unknown',
        });

        if (result.success) {
          return NextResponse.json({
            success: true,
            cartId: result.data?.id,
          });
        } else {
          return NextResponse.json({
            success: false,
            error: result.error,
          }, { status: 500 });
        }
      }

      case 'payment_initiated': {
        // User clicked Pay button
        let cartId = data.cartId;

        // If no cartId provided, create new abandoned cart
        if (!cartId) {
          const cartResult = await abandonedCartService.createAbandonedCart({
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            items: data.items,
            subtotal: data.subtotal,
            tax: data.tax,
            shippingCost: data.shippingCost,
            total: data.total,
            deliveryMethod: data.deliveryMethod,
            deliveryAddress: data.deliveryAddress,
            stage: AbandonmentStage.PAYMENT_INITIATED,
            checkoutStartedAt: Timestamp.now(),
            lastActivityAt: Timestamp.now(),
            paymentProvider: data.paymentProvider,
            paymentReference: data.paymentReference,
            paymentAmount: data.paymentAmount,
            recovered: false,
            remindersSent: 0,
            contactAttempts: 0,
            userAgent: request.headers.get('user-agent') || undefined,
            deviceType: data.deviceType || 'unknown',
          });

          if (!cartResult.success) {
            return NextResponse.json({
              success: false,
              error: cartResult.error,
            }, { status: 500 });
          }

          cartId = cartResult.data?.id;
        } else {
          // Update existing cart
          await abandonedCartService.updateAbandonedCartStage(
            cartId,
            AbandonmentStage.PAYMENT_INITIATED,
            {
              paymentProvider: data.paymentProvider,
              paymentReference: data.paymentReference,
              paymentAmount: data.paymentAmount,
            }
          );
        }

        // Create payment intent record
        const intentResult = await abandonedCartService.createPaymentIntent({
          customerId: data.customerId,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          provider: data.paymentProvider,
          reference: data.paymentReference,
          amount: data.paymentAmount,
          currency: data.currency || 'KES',
          status: 'pending',
          initiatedAt: Timestamp.now(),
          abandonedCartId: cartId,
          metadata: {
            deliveryMethod: data.deliveryMethod,
            itemCount: data.items?.length || 0,
          },
        });

        return NextResponse.json({
          success: true,
          cartId,
          intentId: intentResult.data?.id,
        });
      }

      case 'payment_redirected': {
        // User was redirected to payment provider
        if (data.cartId) {
          await abandonedCartService.updateAbandonedCartStage(
            data.cartId,
            AbandonmentStage.PAYMENT_REDIRECTED
          );
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error tracking abandoned cart:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// GET endpoint to retrieve abandoned carts for admin follow-up
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursAgo = parseInt(searchParams.get('hoursAgo') || '2');
    const maxReminders = parseInt(searchParams.get('maxReminders') || '3');

    const result = await abandonedCartService.getAbandonedCartsForFollowUp(
      hoursAgo,
      maxReminders
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        carts: result.data,
        count: result.data?.length || 0,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error fetching abandoned carts:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
