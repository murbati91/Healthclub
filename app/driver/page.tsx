'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusToggle } from '@/components/driver/StatusToggle';
import { DeliveryCard } from '@/components/driver/DeliveryCard';
import { Loader2, Package, Truck, CheckCircle2, Calendar } from 'lucide-react';
import { formatDeliveryDate } from '@/lib/driver-utils';

interface Order {
  id: string;
  delivery_address: string;
  delivery_time_slot: string | null;
  status: string;
  meal_details: unknown;
  customer_name?: string;
  customer_phone?: string;
  package_type?: string;
}

interface OrdersData {
  orders: {
    pending: Order[];
    in_progress: Order[];
    completed: Order[];
    all: Order[];
  };
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  date: string;
}

export default function DriverPage() {
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [driverStatus, setDriverStatus] = useState<boolean>(false);
  const [_driverId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending');

  // Fetch driver status
  useEffect(() => {
    const fetchDriverStatus = async () => {
      try {
        const response = await fetch('/api/driver/status');
        if (response.ok) {
          const data = await response.json();
          setDriverStatus(data.active || false);
        }
      } catch (error) {
        console.error('Error fetching driver status:', error);
      }
    };

    fetchDriverStatus();
  }, []);

  // Fetch today's orders
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/driver/orders');
        if (response.ok) {
          const data = await response.json();
          setOrdersData(data);
        } else {
          console.error('Failed to fetch orders');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/driver/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Refresh orders after update
        const ordersResponse = await fetch('/api/driver/orders');
        if (ordersResponse.ok) {
          const data = await ordersResponse.json();
          setOrdersData(data);
        }
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const today = new Date();
  const formattedToday = formatDeliveryDate(today.toISOString());

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-primary">Driver Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{formattedToday}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {ordersData?.summary.total || 0} deliveries
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Driver Status Toggle */}
        <StatusToggle
          driverId={_driverId}
          initialStatus={driverStatus}
          onStatusChange={setDriverStatus}
        />

        {/* Summary Cards */}
        {ordersData && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{ordersData.summary.pending}</div>
                <div className="text-xs text-muted-foreground mt-1">Pending</div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{ordersData.summary.in_progress}</div>
                <div className="text-xs text-muted-foreground mt-1">In Progress</div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{ordersData.summary.completed}</div>
                <div className="text-xs text-muted-foreground mt-1">Completed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deliveries Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="pending" className="flex flex-col gap-1 py-3">
              <span className="text-xs font-medium">Pending</span>
              {ordersData && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {ordersData.summary.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex flex-col gap-1 py-3">
              <span className="text-xs font-medium">In Progress</span>
              {ordersData && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {ordersData.summary.in_progress}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex flex-col gap-1 py-3">
              <span className="text-xs font-medium">Completed</span>
              {ordersData && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {ordersData.summary.completed}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Pending Tab */}
              <TabsContent value="pending" className="space-y-4 mt-4">
                {ordersData?.orders.pending.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No pending deliveries</p>
                    </CardContent>
                  </Card>
                ) : (
                  ordersData?.orders.pending.map((order) => (
                    <DeliveryCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
                  ))
                )}
              </TabsContent>

              {/* In Progress Tab */}
              <TabsContent value="in_progress" className="space-y-4 mt-4">
                {ordersData?.orders.in_progress.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No deliveries in progress</p>
                    </CardContent>
                  </Card>
                ) : (
                  ordersData?.orders.in_progress.map((order) => (
                    <DeliveryCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
                  ))
                )}
              </TabsContent>

              {/* Completed Tab */}
              <TabsContent value="completed" className="space-y-4 mt-4">
                {ordersData?.orders.completed.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No completed deliveries today</p>
                    </CardContent>
                  </Card>
                ) : (
                  ordersData?.orders.completed.map((order) => (
                    <DeliveryCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </main>
  );
}
