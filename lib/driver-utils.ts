/**
 * Driver utility functions for mobile app
 * Handles Google Maps, WhatsApp, and phone call integrations
 */

import { Database } from './supabase';

type DeliveryAddress = Database['public']['Tables']['subscriptions']['Row']['delivery_address'];

/**
 * Generate Google Maps navigation URL from delivery address
 * Opens directly in Google Maps app on mobile
 */
export function generateMapsUrl(address: string): string {
  // Encode the address for URL
  const encodedAddress = encodeURIComponent(address);

  // Use google.com/maps/dir for navigation from current location
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
}

/**
 * Generate WhatsApp message link for customer contact
 * Format: +973XXXXXXXX (Bahrain country code)
 */
export function generateWhatsAppUrl(
  phoneNumber: string,
  customerName?: string,
  orderId?: string
): string {
  // Remove any non-digit characters
  let cleanPhone = phoneNumber.replace(/\D/g, '');

  // Add Bahrain country code if not present
  if (!cleanPhone.startsWith('973')) {
    cleanPhone = '973' + cleanPhone;
  }

  // Pre-filled message
  const message = customerName
    ? `Hello ${customerName}, I am on my way to deliver your Healthy Club meal${orderId ? ` (Order: ${orderId.slice(0, 8)})` : ''}.`
    : 'Hello, I am on my way to deliver your Healthy Club meal.';

  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate phone call link
 * Format: tel:+973XXXXXXXX
 */
export function generatePhoneUrl(phoneNumber: string): string {
  // Remove any non-digit characters
  let cleanPhone = phoneNumber.replace(/\D/g, '');

  // Add Bahrain country code if not present
  if (!cleanPhone.startsWith('973')) {
    cleanPhone = '973' + cleanPhone;
  }

  return `tel:+${cleanPhone}`;
}

/**
 * Format delivery time slot for display
 */
export function formatTimeSlot(timeSlot: string | null): string {
  if (!timeSlot) return 'Not specified';
  return timeSlot;
}

/**
 * Format delivery date for display
 */
export function formatDeliveryDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Format as "Mon, Jan 1"
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get status badge variant based on order status
 */
export function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'out_for_delivery':
      return 'secondary';
    case 'preparing':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Format status text for display
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get meal details summary from JSONB
 */
export function getMealSummary(mealDetails: unknown): string {
  if (!mealDetails || typeof mealDetails !== 'object') return 'Meal details not available';

  const details = mealDetails as { meals_per_day?: number };
  const mealsPerDay = details.meals_per_day || 1;
  const mealText = mealsPerDay === 1 ? 'meal' : 'meals';

  return `${mealsPerDay} ${mealText}`;
}

/**
 * Extract address components for display
 * Handles both string and JSONB address formats
 */
export function parseDeliveryAddress(address: string | DeliveryAddress): {
  fullAddress: string;
  area: string;
  shortAddress: string;
} {
  // If it's already a string (from daily_orders table)
  if (typeof address === 'string') {
    // Try to extract area from string
    const parts = address.split(',').map((p) => p.trim());
    const area = parts[parts.length - 1] || 'Unknown Area';

    return {
      fullAddress: address,
      area,
      shortAddress: address.length > 50 ? address.substring(0, 47) + '...' : address,
    };
  }

  // If it's a JSONB object (from subscriptions table)
  const { area = '', block = '', road = '', building = '', flat = '' } = address;

  const fullAddress = [
    area && `Area: ${area}`,
    block && `Block: ${block}`,
    road && `Road: ${road}`,
    building && `Building: ${building}`,
    flat && `Flat: ${flat}`,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    fullAddress,
    area: area || 'Unknown Area',
    shortAddress: fullAddress.length > 50 ? fullAddress.substring(0, 47) + '...' : fullAddress,
  };
}

/**
 * Check if driver can update order status
 */
export function canUpdateStatus(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    scheduled: ['preparing', 'cancelled'],
    preparing: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Get next available status for an order
 */
export function getNextStatus(currentStatus: string): string | null {
  const nextStatusMap: Record<string, string> = {
    scheduled: 'preparing',
    preparing: 'out_for_delivery',
    out_for_delivery: 'delivered',
  };

  return nextStatusMap[currentStatus] || null;
}

/**
 * Format distance for display (placeholder - would integrate with real geolocation)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
