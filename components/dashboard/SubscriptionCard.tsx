import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Subscription } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  // Calculate days remaining (assuming 30-day subscription)
  const startDate = new Date(subscription.start_date);
  const currentDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + subscription.days_per_month);

  const totalDays = subscription.days_per_month;
  const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progressPercentage = Math.min(100, (daysElapsed / totalDays) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{subscription.package_type} Package</CardTitle>
            <CardDescription>
              {subscription.meals_per_day} meal{subscription.meals_per_day > 1 ? 's' : ''} per day • {subscription.days_per_week} days per week
            </CardDescription>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Days Remaining</span>
            <span className="font-semibold">{daysRemaining} / {totalDays}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Selected Days</p>
            <p className="text-sm font-medium">{subscription.selected_days.join(', ')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Started</p>
            <p className="text-sm font-medium">{formatDistanceToNow(startDate, { addSuffix: true })}</p>
          </div>
        </div>

        {subscription.dietary_restrictions.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Dietary Restrictions</p>
            <div className="flex flex-wrap gap-1">
              {subscription.dietary_restrictions.map((restriction) => (
                <Badge key={restriction} variant="outline" className="text-xs">
                  {restriction}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Price</span>
            <span className="text-lg font-bold">BHD {subscription.total_price.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
