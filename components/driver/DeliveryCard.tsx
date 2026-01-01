'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  MessageCircle,
  Navigation,
  Package,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import {
  generateMapsUrl,
  generateWhatsAppUrl,
  generatePhoneUrl,
  formatTimeSlot,
  getStatusVariant,
  formatStatus,
  getMealSummary,
  parseDeliveryAddress,
  getNextStatus,
} from '@/lib/driver-utils';

interface DeliveryCardProps {
  order: {
    id: string;
    delivery_address: string;
    delivery_time_slot: string | null;
    status: string;
    meal_details: any;
    customer_name?: string;
    customer_phone?: string;
    package_type?: string;
  };
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

export function DeliveryCard({ order, onStatusUpdate }: DeliveryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { fullAddress, area, shortAddress } = parseDeliveryAddress(order.delivery_address);
  const customerName = order.customer_name || 'Customer';
  const customerPhone = order.customer_phone || '';

  const handleCall = () => {
    if (customerPhone) {
      window.location.href = generatePhoneUrl(customerPhone);
    }
  };

  const handleWhatsApp = () => {
    if (customerPhone) {
      window.location.href = generateWhatsAppUrl(customerPhone, customerName, order.id);
    }
  };

  const handleNavigate = () => {
    window.open(generateMapsUrl(fullAddress), '_blank');
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate?.(order.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const nextStatus = getNextStatus(order.status);

  const getActionButtonText = () => {
    switch (order.status) {
      case 'scheduled':
        return 'Start Preparing';
      case 'preparing':
        return 'Start Delivery';
      case 'out_for_delivery':
        return 'Mark Delivered';
      default:
        return null;
    }
  };

  const getActionButtonIcon = () => {
    switch (order.status) {
      case 'scheduled':
        return <Package className="h-4 w-4" />;
      case 'preparing':
        return <Truck className="h-4 w-4" />;
      case 'out_for_delivery':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const actionButtonText = getActionButtonText();
  const actionButtonIcon = getActionButtonIcon();

  return (
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
      <CardHeader className="p-4 pb-3 bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{customerName}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{area}</span>
            </div>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="flex-shrink-0">
            {formatStatus(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-3">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground line-clamp-2">{isExpanded ? fullAddress : shortAddress}</p>
        </div>

        {/* Time Slot & Package */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{formatTimeSlot(order.delivery_time_slot)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">
              {order.package_type || 'Standard'} - {getMealSummary(order.meal_details)}
            </span>
          </div>
        </div>

        {/* Quick Actions - Large Touch Targets */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCall}
            disabled={!customerPhone}
            className="flex flex-col h-auto py-3 gap-1.5"
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">Call</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleWhatsApp}
            disabled={!customerPhone}
            className="flex flex-col h-auto py-3 gap-1.5"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">WhatsApp</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNavigate}
            className="flex flex-col h-auto py-3 gap-1.5"
          >
            <Navigation className="h-5 w-5" />
            <span className="text-xs">Navigate</span>
          </Button>
        </div>

        {/* Status Action Button */}
        {actionButtonText && nextStatus && (
          <Button
            onClick={() => handleStatusUpdate(nextStatus)}
            disabled={isUpdating}
            size="lg"
            className="w-full mt-2"
          >
            {actionButtonIcon}
            <span className="ml-2">{isUpdating ? 'Updating...' : actionButtonText}</span>
          </Button>
        )}

        {/* Expand/Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Show More
            </>
          )}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-3 border-t space-y-2 text-sm">
            <div>
              <span className="font-medium">Order ID:</span>{' '}
              <span className="text-muted-foreground font-mono text-xs">{order.id.slice(0, 8)}</span>
            </div>
            {customerPhone && (
              <div>
                <span className="font-medium">Phone:</span>{' '}
                <span className="text-muted-foreground">{customerPhone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
