/**
 * Notify Driver API
 * POST /api/orders/notify-driver
 *
 * Sends WhatsApp notification to assigned driver
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { notifyDriverOfOrder } from '@/lib/order-automation';

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
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Verify order exists and has a driver assigned
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, driver_id, driver_notified_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.driver_id) {
      return NextResponse.json(
        { error: 'No driver assigned to this order' },
        { status: 400 }
      );
    }

    if (order.driver_notified_at) {
      return NextResponse.json(
        {
          error: 'Driver has already been notified',
          notifiedAt: order.driver_notified_at,
        },
        { status: 400 }
      );
    }

    // Send notification
    await notifyDriverOfOrder(orderId);

    return NextResponse.json({
      success: true,
      message: 'Driver notified successfully',
      orderId: orderId,
    });
  } catch (error) {
    console.error('Notify driver error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to notify driver';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET endpoint to check notification status
 */
export async function GET(request: NextRequest) {
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

    // Get orderId from query params
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing query parameter: orderId' },
        { status: 400 }
      );
    }

    // Get order notification status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, driver_id, driver_notified_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get WhatsApp message log if available
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('order_id', orderId)
      .eq('message_type', 'driver_order_notification')
      .order('sent_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      orderId: order.id,
      hasDriver: !!order.driver_id,
      notified: !!order.driver_notified_at,
      notifiedAt: order.driver_notified_at,
      lastMessage: messages?.[0] || null,
    });
  } catch (error) {
    console.error('Get notification status error:', error);

    return NextResponse.json(
      { error: 'Failed to get notification status' },
      { status: 500 }
    );
  }
}
