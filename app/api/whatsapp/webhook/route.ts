/**
 * WAHA Webhook Handler
 * POST /api/whatsapp/webhook
 *
 * Receives incoming WhatsApp messages from WAHA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  WAHAWebhookEvent,
  verifyWebhookEvent,
  extractPhoneFromChatId,
  parseDriverResponse,
} from '@/lib/waha';
import { processDriverResponse } from '@/lib/order-automation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body as WAHAWebhookEvent;

    // Verify the webhook event
    if (!verifyWebhookEvent(event)) {
      console.error('Invalid webhook event:', event);
      return NextResponse.json({ error: 'Invalid webhook event' }, { status: 400 });
    }

    // Only process incoming messages (not sent by us)
    if (event.payload.fromMe) {
      return NextResponse.json({ success: true, message: 'Ignored outgoing message' });
    }

    // Extract phone number from chat ID
    const phoneNumber = extractPhoneFromChatId(event.payload.from);
    const messageBody = event.payload.body;

    console.log(`Received WhatsApp message from ${phoneNumber}: ${messageBody}`);

    // Log the incoming message
    const supabase = await createServerSupabaseClient();
    await supabase.from('whatsapp_messages').insert({
      recipient_phone: phoneNumber,
      message_type: 'incoming',
      message_content: messageBody,
      status: 'received',
      sent_at: new Date(event.payload.timestamp).toISOString(),
    });

    // Check if this is a driver response
    const response = parseDriverResponse(messageBody);

    if (response) {
      // This is a driver response (1 or 2)
      // Find the driver by phone number
      const { data: driver } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('phone', phoneNumber)
        .eq('role', 'driver')
        .single();

      if (driver) {
        // Process the driver response
        const result = await processDriverResponse(phoneNumber, messageBody);

        // Send response back to driver via WhatsApp
        const { sendMessage } = await import('@/lib/waha');
        await sendMessage(phoneNumber, result.message);

        return NextResponse.json({
          success: true,
          message: 'Driver response processed',
          response: result,
        });
      }
    }

    // Handle other types of messages (customer feedback, general inquiries, etc.)
    // For now, we just log them
    console.log(`Unhandled message from ${phoneNumber}: ${messageBody}`);

    // Check if sender is a customer
    const { data: customer } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('phone', phoneNumber)
      .eq('role', 'customer')
      .single();

    if (customer) {
      // Log customer message for admin review
      console.log(`Customer message from ${customer.full_name}: ${messageBody}`);

      // You could implement auto-reply or notification to admin here
      // For example:
      // await sendMessage(phoneNumber, "Thank you for your message! Our team will get back to you soon.");
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received and processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook verification (if needed by WAHA)
 */
export async function GET(request: NextRequest) {
  // Some webhook systems require a verification challenge
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({
    status: 'ok',
    message: 'WhatsApp webhook endpoint is active',
  });
}
