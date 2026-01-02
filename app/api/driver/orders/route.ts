import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/driver/orders
 * Fetch driver's orders for today or specified date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get driver record for this user
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Get date parameter (defaults to today)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    // Fetch orders assigned to this driver for the date
    // Join with subscriptions to get customer info and package details
    const { data: orders, error: ordersError } = await supabase
      .from('daily_orders')
      .select(
        `
        id,
        delivery_date,
        delivery_time_slot,
        delivery_address,
        status,
        meal_details,
        notes,
        subscription_id,
        subscriptions (
          user_id,
          package_type,
          profiles (
            full_name,
            phone
          )
        )
      `
      )
      .eq('driver_id', driver.id)
      .eq('delivery_date', targetDate)
      .order('delivery_time_slot', { ascending: true });

    if (ordersError) {
      console.error('Orders fetch error:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Transform the data to flatten the structure
    interface RawOrder {
      id: string;
      delivery_date: string;
      delivery_time_slot: string;
      delivery_address: string;
      status: string;
      meal_details: unknown;
      notes: string | null;
      subscription_id: string;
      subscriptions?: {
        profiles?: {
          full_name?: string;
          phone?: string;
        } | null;
        package_type?: string;
      } | null;
    }

    const formattedOrders = (orders || []).map((order: RawOrder) => ({
      id: order.id,
      delivery_date: order.delivery_date,
      delivery_time_slot: order.delivery_time_slot,
      delivery_address: order.delivery_address,
      status: order.status,
      meal_details: order.meal_details,
      notes: order.notes,
      subscription_id: order.subscription_id,
      customer_name: order.subscriptions?.profiles?.full_name || 'Unknown Customer',
      customer_phone: order.subscriptions?.profiles?.phone || '',
      package_type: order.subscriptions?.package_type || 'Normal',
    }));

    // Group orders by status
    const grouped = {
      pending: formattedOrders.filter((o) => o.status === 'scheduled' || o.status === 'preparing'),
      in_progress: formattedOrders.filter((o) => o.status === 'out_for_delivery'),
      completed: formattedOrders.filter((o) => o.status === 'delivered'),
      all: formattedOrders,
    };

    return NextResponse.json(
      {
        orders: grouped,
        summary: {
          total: formattedOrders.length,
          pending: grouped.pending.length,
          in_progress: grouped.in_progress.length,
          completed: grouped.completed.length,
        },
        date: targetDate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Driver orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/driver/orders
 * Update order status
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get driver record
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { orderId, status } = body;

    // Validate required fields
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields: orderId, status' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['scheduled', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Verify the order belongs to this driver
    const { data: existingOrder, error: checkError } = await supabase
      .from('daily_orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('driver_id', driver.id)
      .single();

    if (checkError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found or not assigned to this driver' }, { status: 404 });
    }

    // Update the order status
    const updateData: Record<string, string> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set delivered_at timestamp if marking as delivered
    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    // Set driver_notified_at if moving to out_for_delivery
    if (status === 'out_for_delivery' && !existingOrder.status.includes('out_for_delivery')) {
      updateData.driver_notified_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('daily_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder,
        message: `Order status updated to ${status}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Driver orders PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
