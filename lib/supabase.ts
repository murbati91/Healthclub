import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client-side Supabase client for use in client components
 * Uses browser cookies for session management
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client for use in server components and API routes
 * Manages cookies for session persistence
 *
 * Note: This can only be used in Server Components and Route Handlers
 */
export async function createServerSupabaseClient() {
  // Dynamic import to avoid issues with client components
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Type definitions for database tables
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string;
          role: 'customer' | 'driver' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          email: string;
          role?: 'customer' | 'driver' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string;
          role?: 'customer' | 'driver' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          package_type: 'Normal' | 'Keto' | 'Vegetarian' | 'Special';
          meals_per_day: number;
          days_per_month: number;
          days_per_week: number;
          selected_days: string[];
          dietary_restrictions: string[];
          delivery_address: {
            area: string;
            block: string;
            road: string;
            building: string;
            flat: string;
            notes?: string;
            preferredTimeSlot: 'Morning 6-9AM' | 'Afternoon 12-3PM';
          };
          start_date: string;
          total_price: number;
          status: 'active' | 'paused' | 'cancelled' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_type: 'Normal' | 'Keto' | 'Vegetarian' | 'Special';
          meals_per_day: number;
          days_per_month: number;
          days_per_week: number;
          selected_days: string[];
          dietary_restrictions?: string[];
          delivery_address: {
            area: string;
            block: string;
            road: string;
            building: string;
            flat: string;
            notes?: string;
            preferredTimeSlot: 'Morning 6-9AM' | 'Afternoon 12-3PM';
          };
          start_date: string;
          total_price: number;
          status?: 'active' | 'paused' | 'cancelled' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_type?: 'Normal' | 'Keto' | 'Vegetarian' | 'Special';
          meals_per_day?: number;
          days_per_month?: number;
          days_per_week?: number;
          selected_days?: string[];
          dietary_restrictions?: string[];
          delivery_address?: {
            area: string;
            block: string;
            road: string;
            building: string;
            flat: string;
            notes?: string;
            preferredTimeSlot: 'Morning 6-9AM' | 'Afternoon 12-3PM';
          };
          start_date?: string;
          total_price?: number;
          status?: 'active' | 'paused' | 'cancelled' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
