'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Home, MessageCircle } from 'lucide-react';
import type { Subscription } from '@/types';
import { formatPrice } from '@/lib/subscription-utils';
import { format } from 'date-fns';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('id');

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionId) {
      router.push('/dashboard');
      return;
    }

    // Fetch subscription details
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`);
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [subscriptionId, router]);

  const handleWhatsAppShare = () => {
    if (!subscription) return;

    const message = `I just subscribed to Healthy Club! 🥗

Package: ${subscription.package_type}
Meals per day: ${subscription.meals_per_day}
Days per month: ${subscription.days_per_month}
Monthly total: ${formatPrice(subscription.total_price)}

Join me for healthy eating! 🌱`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Subscription not found</h1>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">Subscription Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your healthy meal journey starts soon
          </p>
        </div>

        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription Details</CardTitle>
              <Badge variant="default" className="bg-primary">
                {subscription.status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>
              Subscription ID: {subscription.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Package</div>
                <div className="text-muted-foreground">{subscription.package_type}</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Meals Per Day</div>
                <div className="text-muted-foreground">{subscription.meals_per_day}</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Days Per Month</div>
                <div className="text-muted-foreground">{subscription.days_per_month}</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Days Per Week</div>
                <div className="text-muted-foreground">{subscription.days_per_week}</div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-sm mb-1">Delivery Days</div>
              <div className="text-muted-foreground text-sm">
                {subscription.selected_days.join(', ')}
              </div>
            </div>

            {subscription.dietary_restrictions && subscription.dietary_restrictions.length > 0 && (
              <div>
                <div className="font-semibold text-sm mb-1">Dietary Restrictions</div>
                <div className="flex flex-wrap gap-2">
                  {subscription.dietary_restrictions.map((restriction) => (
                    <Badge key={restriction} variant="secondary">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold text-sm mb-1">Delivery Address</div>
              <div className="text-muted-foreground text-sm">
                {subscription.delivery_address.area}, Block {subscription.delivery_address.block}, Road{' '}
                {subscription.delivery_address.road}, Building {subscription.delivery_address.building}, Flat{' '}
                {subscription.delivery_address.flat}
              </div>
              <div className="text-muted-foreground text-sm mt-1">
                {subscription.delivery_address.preferredTimeSlot}
              </div>
            </div>

            <div>
              <div className="font-semibold text-sm mb-1">Start Date</div>
              <div className="text-muted-foreground text-sm">
                {format(new Date(subscription.start_date), 'PPPP')}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Monthly Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(subscription.total_price)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <div className="font-medium">We&apos;ll prepare your meals</div>
                  <div className="text-sm text-muted-foreground">
                    Our chefs will start preparing fresh, healthy meals according to your preferences
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <div className="font-medium">Daily deliveries begin</div>
                  <div className="text-sm text-muted-foreground">
                    Your meals will be delivered fresh on your selected days at your preferred time
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium">Track your orders</div>
                  <div className="text-sm text-muted-foreground">
                    Monitor your daily deliveries and manage your subscription from your dashboard
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={handleWhatsAppShare} className="flex-1">
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>

        {/* Support Note */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-muted-foreground">
              Questions about your subscription?{' '}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact our support team
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
