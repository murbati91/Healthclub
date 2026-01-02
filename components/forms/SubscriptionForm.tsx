'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  packageOptions,
  bahrainAreas,
  dietaryRestrictions,
  weekdays,
  timeSlots,
  calculateSubscriptionPrice,
  formatPrice,
  validateSelectedDays,
  getDietaryRestrictionsByType,
} from '@/lib/subscription-utils';
import type { SubscriptionFormData, PackageType, Weekday } from '@/types';

const TOTAL_STEPS = 5;

export function SubscriptionForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<Partial<SubscriptionFormData>>({
    packageType: 'Normal',
    mealsPerDay: 2,
    daysPerMonth: 24,
    daysPerWeek: 6,
    selectedDays: [],
    dietaryRestrictions: [],
    deliveryAddress: {
      area: '',
      block: '',
      road: '',
      building: '',
      flat: '',
      notes: '',
      preferredTimeSlot: 'Morning 6-9AM',
    },
    termsAccepted: false,
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.packageType) {
          toast.error('Please select a package');
          return false;
        }
        return true;

      case 2:
        if (!formData.mealsPerDay || !formData.daysPerMonth || !formData.daysPerWeek) {
          toast.error('Please complete all customization options');
          return false;
        }
        return true;

      case 3:
        if (!validateSelectedDays(formData.selectedDays || [], formData.daysPerWeek || 0)) {
          toast.error(`Please select exactly ${formData.daysPerWeek} days per week`);
          return false;
        }
        return true;

      case 4:
        const addr = formData.deliveryAddress;
        if (!addr?.area || !addr?.block || !addr?.road || !addr?.building || !addr?.flat) {
          toast.error('Please complete all required address fields');
          return false;
        }
        return true;

      case 5:
        if (!formData.startDate) {
          toast.error('Please select a start date');
          return false;
        }
        if (!formData.termsAccepted) {
          toast.error('Please accept the terms and conditions');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = calculateSubscriptionPrice(
        formData.packageType as PackageType,
        formData.mealsPerDay!,
        formData.daysPerMonth!
      );

      const subscriptionData = {
        ...formData,
        total_price: totalPrice,
      };

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const { subscriptionId } = await response.json();

      toast.success('Subscription created successfully!');
      router.push(`/subscribe/success?id=${subscriptionId}`);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = formData.packageType && formData.mealsPerDay && formData.daysPerMonth
    ? calculateSubscriptionPrice(
        formData.packageType as PackageType,
        formData.mealsPerDay,
        formData.daysPerMonth
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {TOTAL_STEPS}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="flex justify-between items-center">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                currentStep >= step
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-muted'
              )}
            >
              {currentStep > step ? <Check className="w-5 h-5" /> : step}
            </div>
            <span className="text-xs text-center hidden sm:block">
              {step === 1 && 'Package'}
              {step === 2 && 'Customize'}
              {step === 3 && 'Days'}
              {step === 4 && 'Address'}
              {step === 5 && 'Review'}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Select Your Package'}
            {currentStep === 2 && 'Customize Your Subscription'}
            {currentStep === 3 && 'Select Days & Restrictions'}
            {currentStep === 4 && 'Delivery Address'}
            {currentStep === 5 && 'Review & Confirm'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Choose the meal package that suits your lifestyle'}
            {currentStep === 2 && 'Configure your meal frequency and duration'}
            {currentStep === 3 && 'Choose delivery days and dietary preferences'}
            {currentStep === 4 && 'Enter your delivery location details'}
            {currentStep === 5 && 'Review your subscription before confirming'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Package Selection */}
          {currentStep === 1 && (
            <RadioGroup
              value={formData.packageType}
              onValueChange={(value) => setFormData({ ...formData, packageType: value as PackageType })}
              className="grid gap-4 md:grid-cols-2"
            >
              {packageOptions.map((pkg) => (
                <div key={pkg.id}>
                  <RadioGroupItem
                    value={pkg.id}
                    id={pkg.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={pkg.id}
                    className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <span className="font-semibold text-lg">{pkg.name}</span>
                    <span className="text-sm text-muted-foreground mt-2">{pkg.description}</span>
                    <span className="text-primary font-bold mt-4">{formatPrice(pkg.basePrice)}/meal</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Step 2: Customization */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Meals Per Day</Label>
                <RadioGroup
                  value={String(formData.mealsPerDay)}
                  onValueChange={(value) => setFormData({ ...formData, mealsPerDay: Number(value) as 1 | 2 | 3 })}
                  className="flex gap-4"
                >
                  {[1, 2, 3].map((num) => (
                    <div key={num}>
                      <RadioGroupItem value={String(num)} id={`meals-${num}`} className="peer sr-only" />
                      <Label
                        htmlFor={`meals-${num}`}
                        className="flex items-center justify-center px-6 py-3 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {num} {num === 1 ? 'Meal' : 'Meals'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Days Per Month</Label>
                <RadioGroup
                  value={String(formData.daysPerMonth)}
                  onValueChange={(value) => setFormData({ ...formData, daysPerMonth: Number(value) as 20 | 24 | 26 })}
                  className="flex gap-4"
                >
                  {[20, 24, 26].map((num) => (
                    <div key={num}>
                      <RadioGroupItem value={String(num)} id={`days-month-${num}`} className="peer sr-only" />
                      <Label
                        htmlFor={`days-month-${num}`}
                        className="flex items-center justify-center px-6 py-3 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {num} Days
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Days Per Week</Label>
                <RadioGroup
                  value={String(formData.daysPerWeek)}
                  onValueChange={(value) => setFormData({ ...formData, daysPerWeek: Number(value) as 5 | 6 | 7 })}
                  className="flex gap-4"
                >
                  {[5, 6, 7].map((num) => (
                    <div key={num}>
                      <RadioGroupItem value={String(num)} id={`days-week-${num}`} className="peer sr-only" />
                      <Label
                        htmlFor={`days-week-${num}`}
                        className="flex items-center justify-center px-6 py-3 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {num} Days
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Estimated Monthly Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(currentPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Days & Restrictions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Delivery Days ({formData.daysPerWeek} days per week)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {weekdays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.selectedDays?.includes(day as Weekday)}
                        onCheckedChange={(checked) => {
                          const currentDays = formData.selectedDays || [];
                          const newDays = checked
                            ? [...currentDays, day as Weekday]
                            : currentDays.filter((d) => d !== day);
                          setFormData({ ...formData, selectedDays: newDays });
                        }}
                      />
                      <Label htmlFor={day} className="cursor-pointer">
                        {day.slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Dietary Restrictions (Optional)</Label>

                <div className="space-y-3">
                  <div className="font-medium text-sm">Allergies</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getDietaryRestrictionsByType('allergy').map((restriction) => (
                      <div key={restriction.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={restriction.id}
                          checked={formData.dietaryRestrictions?.includes(restriction.id)}
                          onCheckedChange={(checked) => {
                            const current = formData.dietaryRestrictions || [];
                            const updated = checked
                              ? [...current, restriction.id]
                              : current.filter((id) => id !== restriction.id);
                            setFormData({ ...formData, dietaryRestrictions: updated });
                          }}
                        />
                        <Label htmlFor={restriction.id} className="cursor-pointer text-sm">
                          {restriction.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-medium text-sm">Preferences</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getDietaryRestrictionsByType('preference').map((restriction) => (
                      <div key={restriction.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={restriction.id}
                          checked={formData.dietaryRestrictions?.includes(restriction.id)}
                          onCheckedChange={(checked) => {
                            const current = formData.dietaryRestrictions || [];
                            const updated = checked
                              ? [...current, restriction.id]
                              : current.filter((id) => id !== restriction.id);
                            setFormData({ ...formData, dietaryRestrictions: updated });
                          }}
                        />
                        <Label htmlFor={restriction.id} className="cursor-pointer text-sm">
                          {restriction.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-medium text-sm">Dietary Restrictions</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getDietaryRestrictionsByType('restriction').map((restriction) => (
                      <div key={restriction.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={restriction.id}
                          checked={formData.dietaryRestrictions?.includes(restriction.id)}
                          onCheckedChange={(checked) => {
                            const current = formData.dietaryRestrictions || [];
                            const updated = checked
                              ? [...current, restriction.id]
                              : current.filter((id) => id !== restriction.id);
                            setFormData({ ...formData, dietaryRestrictions: updated });
                          }}
                        />
                        <Label htmlFor={restriction.id} className="cursor-pointer text-sm">
                          {restriction.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Delivery Address */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area/District *</Label>
                <Select
                  value={formData.deliveryAddress?.area}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress!, area: value },
                    })
                  }
                >
                  <SelectTrigger id="area">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {bahrainAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="block">Block Number *</Label>
                  <Input
                    id="block"
                    value={formData.deliveryAddress?.block}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress!, block: e.target.value },
                      })
                    }
                    placeholder="e.g., 123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="road">Road Number *</Label>
                  <Input
                    id="road"
                    value={formData.deliveryAddress?.road}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress!, road: e.target.value },
                      })
                    }
                    placeholder="e.g., 45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building">Building Number *</Label>
                  <Input
                    id="building"
                    value={formData.deliveryAddress?.building}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress!, building: e.target.value },
                      })
                    }
                    placeholder="e.g., 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flat">Flat/Apartment Number *</Label>
                  <Input
                    id="flat"
                    value={formData.deliveryAddress?.flat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress!, flat: e.target.value },
                      })
                    }
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeSlot">Preferred Delivery Time *</Label>
                <RadioGroup
                  value={formData.deliveryAddress?.preferredTimeSlot}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: {
                        ...formData.deliveryAddress!,
                        preferredTimeSlot: value as 'Morning 6-9AM' | 'Afternoon 12-3PM',
                      },
                    })
                  }
                  className="flex gap-4"
                >
                  {timeSlots.map((slot) => (
                    <div key={slot}>
                      <RadioGroupItem value={slot} id={slot} className="peer sr-only" />
                      <Label
                        htmlFor={slot}
                        className="flex items-center justify-center px-6 py-3 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {slot}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.deliveryAddress?.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress!, notes: e.target.value },
                    })
                  }
                  placeholder="Any special instructions for delivery..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">Package</div>
                    <div className="text-muted-foreground">{formData.packageType}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Meals Per Day</div>
                    <div className="text-muted-foreground">{formData.mealsPerDay}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Days Per Month</div>
                    <div className="text-muted-foreground">{formData.daysPerMonth}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Days Per Week</div>
                    <div className="text-muted-foreground">{formData.daysPerWeek}</div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-sm">Delivery Days</div>
                  <div className="text-muted-foreground text-sm">
                    {formData.selectedDays?.join(', ')}
                  </div>
                </div>

                {formData.dietaryRestrictions && formData.dietaryRestrictions.length > 0 && (
                  <div>
                    <div className="font-semibold text-sm">Dietary Restrictions</div>
                    <div className="text-muted-foreground text-sm">
                      {formData.dietaryRestrictions
                        .map((id) => dietaryRestrictions.find((r) => r.id === id)?.label)
                        .join(', ')}
                    </div>
                  </div>
                )}

                <div>
                  <div className="font-semibold text-sm">Delivery Address</div>
                  <div className="text-muted-foreground text-sm">
                    {formData.deliveryAddress?.area}, Block {formData.deliveryAddress?.block}, Road{' '}
                    {formData.deliveryAddress?.road}, Building {formData.deliveryAddress?.building}, Flat{' '}
                    {formData.deliveryAddress?.flat}
                  </div>
                  <div className="text-muted-foreground text-sm mt-1">
                    Delivery Time: {formData.deliveryAddress?.preferredTimeSlot}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total Monthly Price:</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(currentPrice)}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, termsAccepted: checked as boolean })
                  }
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I accept the terms and conditions and agree to the subscription service
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Subscription...' : 'Confirm Subscription'}
          </Button>
        )}
      </div>
    </div>
  );
}
