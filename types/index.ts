// User types
export type UserRole = 'customer' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
}

// Package types
export type PackageType = 'Normal' | 'Keto' | 'Vegetarian' | 'Special';

export interface PackageOption {
  id: PackageType;
  name: string;
  description: string;
  basePrice: number;
}

export interface Package {
  id: string;
  name: PackageType;
  meals_per_day: number;
  days_per_month: number;
  days_per_week: number;
  price: number;
}

// Dietary restrictions
export type AllergyType = 'Nuts' | 'Dairy' | 'Gluten' | 'Shellfish' | 'Eggs' | 'Soy';
export type PreferenceType = 'Halal' | 'Vegetarian' | 'Vegan' | 'No Pork';
export type RestrictionType = 'Low Sodium' | 'Low Sugar' | 'Diabetic Friendly';

export interface DietaryRestriction {
  id: string;
  type: 'allergy' | 'preference' | 'restriction';
  label: AllergyType | PreferenceType | RestrictionType;
}

export type Weekday = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface DeliveryAddress {
  area: string;
  block: string;
  road: string;
  building: string;
  flat: string;
  notes?: string;
  preferredTimeSlot: 'Morning 6-9AM' | 'Afternoon 12-3PM';
}

export interface SubscriptionFormData {
  // Step 1: Package selection
  packageType: PackageType;

  // Step 2: Customization
  mealsPerDay: 1 | 2 | 3;
  daysPerMonth: 20 | 24 | 26;
  daysPerWeek: 5 | 6 | 7;

  // Step 3: Days & Restrictions
  selectedDays: Weekday[];
  dietaryRestrictions: string[];

  // Step 4: Delivery Address
  deliveryAddress: DeliveryAddress;

  // Step 5: Review & Confirm
  startDate: Date;
  termsAccepted: boolean;
}

// Subscription types
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  package_type: PackageType;
  meals_per_day: number;
  days_per_month: number;
  days_per_week: number;
  selected_days: Weekday[];
  dietary_restrictions: string[];
  delivery_address: DeliveryAddress;
  start_date: string;
  total_price: number;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

// Order types
export type OrderStatus = 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  subscription_id: string;
  driver_id?: string | null;
  delivery_date: string;
  delivery_time_slot?: string | null;
  meal_details: Record<string, any>;
  status: OrderStatus;
  delivery_address: string;
  driver_notified_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Driver types
export interface Driver {
  id: string;
  user_id: string;
  phone: string;
  active: boolean;
  current_location?: {
    lat: number;
    lng: number;
  };
}
