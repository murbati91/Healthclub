import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/driver/status
 * Get driver's current status (active/inactive) and location
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
      .select('id, active, current_lat, current_lng, assigned_area, phone')
      .eq('user_id', user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        status: driver.active ? 'online' : 'offline',
        active: driver.active,
        location: {
          lat: driver.current_lat,
          lng: driver.current_lng,
        },
        assigned_area: driver.assigned_area,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Driver status GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/driver/status
 * Update driver's active status and/or location
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
    const { active, location } = body;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update active status if provided
    if (typeof active === 'boolean') {
      updateData.active = active;
    }

    // Update location if provided
    if (location && typeof location === 'object') {
      if (typeof location.lat === 'number' && typeof location.lng === 'number') {
        updateData.current_lat = location.lat;
        updateData.current_lng = location.lng;
      } else {
        return NextResponse.json(
          { error: 'Invalid location format. Expected { lat: number, lng: number }' },
          { status: 400 }
        );
      }
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateData).length === 1) {
      // Only updated_at is set
      return NextResponse.json(
        { error: 'No valid fields to update. Provide active (boolean) or location (object)' },
        { status: 400 }
      );
    }

    // Update the driver record
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', driver.id)
      .select('id, active, current_lat, current_lng, assigned_area')
      .single();

    if (updateError) {
      console.error('Driver status update error:', updateError);
      return NextResponse.json({ error: 'Failed to update driver status' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        status: updatedDriver.active ? 'online' : 'offline',
        active: updatedDriver.active,
        location: {
          lat: updatedDriver.current_lat,
          lng: updatedDriver.current_lng,
        },
        message: 'Driver status updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Driver status PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
