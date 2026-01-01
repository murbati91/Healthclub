import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // First, get user's subscription IDs
    const { data: userSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id);

    if (subsError) {
      console.error('Subscriptions fetch error:', subsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    const subscriptionIds = userSubscriptions.map(s => s.id);

    if (subscriptionIds.length === 0) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    // Build query for user's orders from daily_orders
    let query = supabase
      .from('daily_orders')
      .select(`
        *,
        subscription:subscriptions(package_type, meals_per_day),
        driver:drivers(id, phone, user_id, profiles:profiles(full_name, phone))
      `)
      .in('subscription_id', subscriptionIds)
      .order('delivery_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error: fetchError } = await query;

    if (fetchError) {
      console.error('Orders fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
