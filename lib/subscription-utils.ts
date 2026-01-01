import { PackageOption, DietaryRestriction, AllergyType, PreferenceType, RestrictionType } from '@/types';

// Package options with descriptions and base prices
export const packageOptions: PackageOption[] = [
  {
    id: 'Normal',
    name: 'Normal Package',
    description: 'Balanced meals with a variety of proteins, carbs, and vegetables',
    basePrice: 3.5, // Base price per meal in BHD
  },
  {
    id: 'Keto',
    name: 'Keto Package',
    description: 'Low-carb, high-fat meals for ketogenic diet followers',
    basePrice: 4.0,
  },
  {
    id: 'Vegetarian',
    name: 'Vegetarian Package',
    description: 'Plant-based meals with no meat or fish',
    basePrice: 3.0,
  },
  {
    id: 'Special',
    name: 'Special Package',
    description: 'Premium meals with exotic ingredients and gourmet preparations',
    basePrice: 5.0,
  },
];

// Bahrain areas for delivery
export const bahrainAreas = [
  'Manama',
  'Muharraq',
  'Riffa',
  'Hamad Town',
  'Isa Town',
  'Sitra',
  'Budaiya',
  'Jidhafs',
  'A\'ali',
  'Sanabis',
  'Juffair',
  'Seef',
  'Adliya',
  'Hoora',
  'Gudaibiya',
  'Zinj',
  'Tubli',
  'Sanad',
  'Arad',
  'Busaiteen',
  'Hidd',
  'Amwaj Islands',
  'Diyar Al Muharraq',
  'Durrat Al Bahrain',
];

// Dietary restrictions grouped by type
export const dietaryRestrictions: DietaryRestriction[] = [
  // Allergies
  { id: 'nuts', type: 'allergy', label: 'Nuts' as AllergyType },
  { id: 'dairy', type: 'allergy', label: 'Dairy' as AllergyType },
  { id: 'gluten', type: 'allergy', label: 'Gluten' as AllergyType },
  { id: 'shellfish', type: 'allergy', label: 'Shellfish' as AllergyType },
  { id: 'eggs', type: 'allergy', label: 'Eggs' as AllergyType },
  { id: 'soy', type: 'allergy', label: 'Soy' as AllergyType },

  // Preferences
  { id: 'halal', type: 'preference', label: 'Halal' as PreferenceType },
  { id: 'vegetarian', type: 'preference', label: 'Vegetarian' as PreferenceType },
  { id: 'vegan', type: 'preference', label: 'Vegan' as PreferenceType },
  { id: 'no-pork', type: 'preference', label: 'No Pork' as PreferenceType },

  // Restrictions
  { id: 'low-sodium', type: 'restriction', label: 'Low Sodium' as RestrictionType },
  { id: 'low-sugar', type: 'restriction', label: 'Low Sugar' as RestrictionType },
  { id: 'diabetic', type: 'restriction', label: 'Diabetic Friendly' as RestrictionType },
];

// Weekdays
export const weekdays = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
] as const;

// Time slots
export const timeSlots = [
  'Morning 6-9AM',
  'Afternoon 12-3PM',
] as const;

/**
 * Calculate the total monthly price for a subscription
 * Formula: basePrice × mealsPerDay × daysPerMonth
 */
export function calculateSubscriptionPrice(
  packageType: 'Normal' | 'Keto' | 'Vegetarian' | 'Special',
  mealsPerDay: number,
  daysPerMonth: number
): number {
  const packageOption = packageOptions.find(pkg => pkg.id === packageType);
  if (!packageOption) {
    throw new Error(`Invalid package type: ${packageType}`);
  }

  const totalPrice = packageOption.basePrice * mealsPerDay * daysPerMonth;

  // Round to 2 decimal places
  return Math.round(totalPrice * 100) / 100;
}

/**
 * Get package option by type
 */
export function getPackageOption(packageType: 'Normal' | 'Keto' | 'Vegetarian' | 'Special'): PackageOption | undefined {
  return packageOptions.find(pkg => pkg.id === packageType);
}

/**
 * Validate that selected days match the days per week
 */
export function validateSelectedDays(selectedDays: string[], daysPerWeek: number): boolean {
  return selectedDays.length === daysPerWeek;
}

/**
 * Format price to BHD currency
 */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} BHD`;
}

/**
 * Get dietary restrictions by type
 */
export function getDietaryRestrictionsByType(type: 'allergy' | 'preference' | 'restriction'): DietaryRestriction[] {
  return dietaryRestrictions.filter(restriction => restriction.type === type);
}
