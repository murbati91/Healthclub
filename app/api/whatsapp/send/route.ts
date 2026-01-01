/**
 * WhatsApp Send Message API
 * POST /api/whatsapp/send
 *
 * Allows admin users to send WhatsApp messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { sendMessage, sendMessageWithButtons, WAHAButton } from '@/lib/waha';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { phone, message, buttons, orderId } = body;

    // Validate required fields
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phone and message' },
        { status: 400 }
      );
    }

    // Send message (with or without buttons)
    let response;
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      response = await sendMessageWithButtons(phone, message, buttons as WAHAButton[]);
    } else {
      response = await sendMessage(phone, message);
    }

    // Log the message to database
    const { error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        order_id: orderId || null,
        recipient_phone: phone,
        message_type: 'manual_admin',
        message_content: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log WhatsApp message:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: response.id,
      timestamp: response.timestamp,
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
