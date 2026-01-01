import { SubscriptionForm } from '@/components/forms/SubscriptionForm';

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Start Your Healthy Journey</h1>
          <p className="text-lg text-muted-foreground">
            Subscribe to fresh, healthy meals delivered to your door
          </p>
        </div>

        <SubscriptionForm />
      </div>
    </div>
  );
}
