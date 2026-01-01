import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import { format } from "date-fns";
import { Package, Truck, CheckCircle, XCircle } from "lucide-react";

interface OrderCardProps {
  order: Order & {
    subscription?: {
      package_type: string;
      meals_per_day: number;
    };
    driver?: {
      full_name: string;
      phone: string;
    };
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          color: 'bg-gray-500',
          icon: Package,
          text: 'Scheduled'
        };
      case 'preparing':
        return {
          color: 'bg-blue-500',
          icon: Package,
          text: 'Preparing'
        };
      case 'out_for_delivery':
        return {
          color: 'bg-yellow-500',
          icon: Truck,
          text: 'Out for Delivery'
        };
      case 'delivered':
        return {
          color: 'bg-green-500',
          icon: CheckCircle,
          text: 'Delivered'
        };
      case 'cancelled':
        return {
          color: 'bg-red-500',
          icon: XCircle,
          text: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-500',
          icon: Package,
          text: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {format(new Date(order.delivery_date), 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            {order.subscription && (
              <p className="text-sm text-muted-foreground mt-1">
                {order.subscription.package_type} • {order.subscription.meals_per_day} meal{order.subscription.meals_per_day > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {order.driver && (
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{order.driver.full_name}</p>
              <p className="text-xs text-muted-foreground">{order.driver.phone}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Order ID: {order.id.slice(0, 8)}...
        </div>
      </CardContent>
    </Card>
  );
}
