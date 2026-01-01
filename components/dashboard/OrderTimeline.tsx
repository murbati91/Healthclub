import { OrderStatus } from "@/types";
import { Package, Truck, CheckCircle } from "lucide-react";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const steps = [
    { status: 'scheduled', label: 'Scheduled', icon: Package },
    { status: 'preparing', label: 'Preparing', icon: Package },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(step => step.status === currentStatus);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-muted text-muted-foreground'}
                    ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                  `}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className={`text-xs mt-2 text-center ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 -mt-5
                    ${isActive ? 'bg-primary' : 'bg-muted'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
