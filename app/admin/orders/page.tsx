'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column, Action } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase';
import { ShoppingCart, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';

type OrderStatus = 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  delivery_date: string;
  status: OrderStatus;
  customer: {
    full_name: string;
    phone: string;
  };
  driver?: {
    full_name: string;
    phone: string;
  };
  subscription: {
    package_type: string;
    meals_per_day: number;
  };
  [key: string]: unknown;
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [drivers, setDrivers] = useState<Array<{ id: string; full_name: string; phone: string }>>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const { language } = useLanguage();
  const t = useTranslation(language);
  const supabase = createClient();

  useEffect(() => {
    loadOrders();
    loadDrivers();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_date,
          status,
          customer:profiles!customer_id (
            full_name,
            phone
          ),
          driver:profiles!driver_id (
            full_name,
            phone
          ),
          subscription:subscriptions!subscription_id (
            package_type,
            meals_per_day
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface (Supabase returns arrays for joins)
      const transformedData: Order[] = (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        delivery_date: item.delivery_date as string,
        status: item.status as OrderStatus,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
        driver: Array.isArray(item.driver) ? item.driver[0] : item.driver,
        subscription: Array.isArray(item.subscription) ? item.subscription[0] : item.subscription,
      }));

      setOrders(transformedData);
      setFilteredOrders(transformedData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'driver')
        .order('full_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleBulkAssignDriver = async () => {
    if (!selectedDriver || selectedOrders.length === 0) {
      toast.error('Please select a driver and orders');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ driver_id: selectedDriver })
        .in('id', selectedOrders);

      if (error) throw error;

      toast.success(`Assigned ${selectedOrders.length} orders to driver`);
      setShowAssignDialog(false);
      setSelectedOrders([]);
      setSelectedDriver('');
      loadOrders();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Delivery Date', 'Status', 'Driver', 'Package'];
    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer.full_name,
      order.customer.phone,
      format(new Date(order.delivery_date), 'yyyy-MM-dd'),
      order.status,
      order.driver?.full_name || 'Unassigned',
      order.subscription.package_type,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Orders exported to CSV');
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'out_for_delivery':
        return 'default';
      case 'preparing':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'delivery_date',
      label: t('Delivery Date'),
      sortable: true,
      render: (order) => (
        <span className="font-medium dark:text-white">
          {format(new Date(order.delivery_date), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'customer',
      label: t('Customer'),
      sortable: true,
      render: (order) => (
        <div>
          <div className="font-medium dark:text-white">{order.customer.full_name}</div>
          <div className="text-sm text-muted-foreground dark:text-gray-400">{order.customer.phone}</div>
        </div>
      ),
    },
    {
      key: 'subscription',
      label: t('Package'),
      render: (order) => (
        <div>
          <div className="font-medium capitalize dark:text-white">{order.subscription.package_type}</div>
          <div className="text-sm text-muted-foreground dark:text-gray-400">
            {order.subscription.meals_per_day} {t('meals/day')}
          </div>
        </div>
      ),
    },
    {
      key: 'driver',
      label: t('Driver'),
      render: (order) =>
        order.driver ? (
          <div>
            <div className="font-medium dark:text-white">{order.driver.full_name}</div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">{order.driver.phone}</div>
          </div>
        ) : (
          <Badge variant="outline">{t('Unassigned')}</Badge>
        ),
    },
    {
      key: 'status',
      label: t('Status'),
      sortable: true,
      render: (order) => (
        <Badge variant={getStatusBadgeVariant(order.status)}>
          {order.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
  ];

  const actions: Action<Order>[] = [
    {
      label: t('Mark as Preparing'),
      onClick: (order) => handleStatusChange(order.id, 'preparing'),
    },
    {
      label: t('Mark as Out for Delivery'),
      onClick: (order) => handleStatusChange(order.id, 'out_for_delivery'),
    },
    {
      label: t('Mark as Delivered'),
      onClick: (order) => handleStatusChange(order.id, 'delivered'),
    },
    {
      label: t('Cancel Order'),
      onClick: (order) => handleStatusChange(order.id, 'cancelled'),
      variant: 'destructive',
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">{t('Loading orders...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 dark:text-white">{t('Order Management')}</h1>
        <p className="text-muted-foreground dark:text-gray-400">
          {t('View and manage meal delivery orders')}
        </p>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <ShoppingCart className="h-5 w-5" />
                {t('All Orders')} ({filteredOrders.length})
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {t('Filter, assign drivers, and update order status')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="all" className="dark:text-white">{t('All Status')}</SelectItem>
                  <SelectItem value="scheduled" className="dark:text-white">{t('Scheduled')}</SelectItem>
                  <SelectItem value="preparing" className="dark:text-white">{t('Preparing')}</SelectItem>
                  <SelectItem value="out_for_delivery" className="dark:text-white">{t('Out for Delivery')}</SelectItem>
                  <SelectItem value="delivered" className="dark:text-white">{t('Delivered')}</SelectItem>
                  <SelectItem value="cancelled" className="dark:text-white">{t('Cancelled')}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                {t('Export CSV')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredOrders}
            columns={columns}
            actions={actions}
            searchPlaceholder={t('Search orders...')}
            emptyMessage={t('No orders found')}
          />
        </CardContent>
      </Card>

      {/* Bulk Assign Driver Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('Assign Driver to Orders')}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('Select a driver to assign to')} {selectedOrders.length} {t('selected orders')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <SelectValue placeholder={t('Select a driver')} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id} className="dark:text-white">
                    {driver.full_name} - {driver.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleBulkAssignDriver}>{t('Assign Driver')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
