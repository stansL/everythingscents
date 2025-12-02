import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook Test Endpoint
 * Use this to verify that your webhook URL is accessible
 * 
 * Test with:
 * curl -X POST https://your-domain.com/api/webhooks/test
 */
export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK TEST ENDPOINT HIT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    const body = await request.text();
    console.log('Body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
      receivedData: body ? JSON.parse(body) : null,
    });
  } catch (error: any) {
    console.error('Error parsing body:', error.message);
    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint is accessible (body parse error)',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}

export async function GET() {
  console.log('=== WEBHOOK TEST ENDPOINT (GET) ===');
  console.log('Timestamp:', new Date().toISOString());
  
  return NextResponse.json({
    success: true,
    message: 'Webhook test endpoint is running',
    timestamp: new Date().toISOString(),
    instructions: 'Send a POST request to test webhook delivery',
  });
}
