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

    // 1. Lookup package_id from packages table
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('id')
      .ilike('name', packageType.toLowerCase())
      .single();

    if (pkgError || !pkg) {
      console.error('Package lookup error:', pkgError);
      return NextResponse.json(
        { error: `Package "${packageType}" not found` },
        { status: 400 }
      );
    }

    // 2. Lookup package_option_id from package_options table
    const { data: pkgOption, error: optionError } = await supabase
      .from('package_options')
      .select('id')
      .eq('package_id', pkg.id)
      .eq('meals_per_day', mealsPerDay)
      .eq('days_per_month', daysPerMonth)
      .eq('days_per_week', daysPerWeek)
      .single();

    if (optionError || !pkgOption) {
      console.error('Package option lookup error:', optionError);
      return NextResponse.json(
        { error: `No package option found for ${mealsPerDay} meals/day, ${daysPerMonth} days/month, ${daysPerWeek} days/week` },
        { status: 400 }
      );
    }

    // 3. Calculate end_date (1 month from start_date)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setMonth(endDateObj.getMonth() + 1);
    const endDate = endDateObj.toISOString().split('T')[0];

    // 4. Update user profile with delivery address
    const addressString = deliveryAddress.block && deliveryAddress.road
      ? `Block ${deliveryAddress.block}, Road ${deliveryAddress.road}`
      : deliveryAddress.address || '';

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        address: addressString,
        area: deliveryAddress.area,
        building: deliveryAddress.building || null,
        flat_number: deliveryAddress.flat || null,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Continue anyway - subscription is more important
    }

    // 5. Format dietary_restrictions correctly
    const formattedDietaryRestrictions = {
      allergies: Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
      exclusions: [],
    };

    // 6. Insert subscription with correct schema columns
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        package_option_id: pkgOption.id,
        start_date: startDate,
        end_date: endDate,
        selected_days: selectedDays,
        dietary_restrictions: formattedDietaryRestrictions,
        total_price: total_price,
        status: 'active',
        paid: false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Subscription insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create subscription', details: insertError.message },
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

export async function GET(_request: NextRequest) {
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

    // Get user's subscriptions with package details
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        packages:package_id (name, description),
        package_options:package_option_id (meals_per_day, days_per_month, days_per_week)
      `)
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
