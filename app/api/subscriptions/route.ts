import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      packageType,
      mealsPerDay,
      daysPerMonth,
      daysPerWeek,
      selectedDays,
      dietaryRestrictions,
      deliveryAddress,
      startDate,
      total_price,
    } = body;

    // Validate required fields
    if (
      !packageType ||
      !mealsPerDay ||
      !daysPerMonth ||
      !daysPerWeek ||
      !selectedDays ||
      !deliveryAddress ||
      !startDate
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert subscription into database
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        package_type: packageType,
        meals_per_day: mealsPerDay,
        days_per_month: daysPerMonth,
        days_per_week: daysPerWeek,
        selected_days: selectedDays,
        dietary_restrictions: dietaryRestrictions || [],
        delivery_address: deliveryAddress,
        start_date: startDate,
        total_price: total_price,
        status: 'active',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Subscription insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        subscriptionId: subscription.id,
        message: 'Subscription created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get user's subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Subscription fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscriptions }, { status: 200 });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
