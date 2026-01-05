import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/orders/orderService';

/**
 * Order Confirmation API
 * Confirms a pending order and auto-generates an invoice
 * 
 * This endpoint is called by the PWA after successful payment
 * or when confirming Pay on Delivery/Pickup orders
 */

// CORS headers for PWA access
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_PWA_URL || 'http://localhost:3001',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== ORDER CONFIRMATION API CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Parse request body
    const body = await request.json();
    const { orderId, isPaid } = body;
    
    console.log('Order ID:', orderId);
    console.log('Is Paid:', isPaid);
    
    // Validate required fields
    if (!orderId) {
      console.error('❌ Missing orderId in request body');
      return NextResponse.json(
        { 
          success: false,
          error: 'orderId is required' 
        },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Confirm the order (this will auto-generate invoice)
    console.log('🔄 Confirming order...');
    const result = await OrderService.confirmOrder(orderId, isPaid ?? false);
    
    if (!result.success) {
      console.error('❌ Order confirmation failed:', result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to confirm order'
        },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log('✅ Order confirmed successfully');
    console.log('Order status:', result.data?.status);
    console.log('Invoice ID:', result.data?.invoiceId);
    
    return NextResponse.json({
      success: true,
      message: 'Order confirmed and invoice generated',
      data: {
        orderId: result.data?.id,
        orderNumber: result.data?.orderNumber,
        status: result.data?.status,
        invoiceId: result.data?.invoiceId,
        convertedAt: result.data?.convertedAt
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('💥 Order confirmation API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET endpoint for testing/health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/orders/confirm',
    method: 'POST',
    description: 'Confirms a pending order and generates an invoice',
    requiredFields: {
      orderId: 'string (required)',
      isPaid: 'boolean (optional, default: false)'
    },
    example: {
      orderId: 'ABC123',
      isPaid: true
    }
  });
}
