/**
 * Admin Abandoned Cart Management API
 * Retrieve and manage abandoned carts for customer follow-up
 */

import { NextRequest, NextResponse } from 'next/server';
import { abandonedCartService } from '@/lib/services/abandonedCartService';

// GET: Retrieve abandoned carts for follow-up
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

// POST: Record reminder or contact attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cartId, notes } = body;

    if (!cartId) {
      return NextResponse.json({
        success: false,
        error: 'Cart ID is required',
      }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'reminder_sent':
        result = await abandonedCartService.recordReminderSent(cartId);
        break;

      case 'contact_attempt':
        result = await abandonedCartService.recordContactAttempt(cartId, notes);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "reminder_sent" or "contact_attempt"',
        }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${action} recorded successfully`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error recording action:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
