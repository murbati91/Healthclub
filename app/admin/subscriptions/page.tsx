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
import { Package, Filter, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'completed';

interface Subscription {
  id: string;
  customer: {
    full_name: string;
    email: string;
    phone: string;
  };
  package_type: string;
  meals_per_day: number;
  days_per_month: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: SubscriptionStatus;
  created_at: string;
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    let filtered = subscriptions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    if (packageFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.package_type === packageFilter);
    }

    setFilteredSubscriptions(filtered);
  }, [statusFilter, packageFilter, subscriptions]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          package_type,
          meals_per_day,
          days_per_month,
          start_date,
          end_date,
          total_price,
          status,
          created_at,
          customer:profiles!customer_id (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface (Supabase returns arrays for joins)
      const transformedData: Subscription[] = (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        package_type: item.package_type as string,
        meals_per_day: item.meals_per_day as number,
        days_per_month: item.days_per_month as number,
        start_date: item.start_date as string,
        end_date: item.end_date as string,
        total_price: item.total_price as number,
        status: item.status as SubscriptionStatus,
        created_at: item.created_at as string,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
      }));

      setSubscriptions(transformedData);
      setFilteredSubscriptions(transformedData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: SubscriptionStatus) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription status updated');
      loadSubscriptions();
    } catch (error) {
      console.error('Error updating subscription status:', error);
      toast.error('Failed to update subscription status');
    }
  };

  const handleViewDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsDialog(true);
  };

  const getStatusBadgeVariant = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const columns: Column<Subscription>[] = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (sub) => (
        <div>
          <div className="font-medium">{sub.customer.full_name}</div>
          <div className="text-sm text-muted-foreground">{sub.customer.email}</div>
        </div>
      ),
    },
    {
      key: 'package_type',
      label: 'Package',
      sortable: true,
      render: (sub) => (
        <div>
          <div className="font-medium capitalize">{sub.package_type}</div>
          <div className="text-sm text-muted-foreground">
            {sub.meals_per_day} meals/day × {sub.days_per_month} days
          </div>
        </div>
      ),
    },
    {
      key: 'start_date',
      label: 'Duration',
      render: (sub) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{format(new Date(sub.start_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="text-muted-foreground">
            to {format(new Date(sub.end_date), 'MMM d, yyyy')}
          </div>
        </div>
      ),
    },
    {
      key: 'total_price',
      label: 'Price',
      sortable: true,
      render: (sub) => (
        <div className="flex items-center gap-1 font-semibold">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>BHD {sub.total_price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (sub) => (
        <Badge variant={getStatusBadgeVariant(sub.status)}>
          {sub.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  const actions: Action<Subscription>[] = [
    {
      label: 'View Details',
      onClick: handleViewDetails,
    },
    {
      label: 'Activate',
      onClick: (sub) => handleStatusChange(sub.id, 'active'),
    },
    {
      label: 'Pause',
      onClick: (sub) => handleStatusChange(sub.id, 'paused'),
    },
    {
      label: 'Cancel',
      onClick: (sub) => handleStatusChange(sub.id, 'cancelled'),
      variant: 'destructive',
    },
  ];

  const uniquePackages = Array.from(new Set(subscriptions.map((s) => s.package_type)));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          View and manage customer meal subscriptions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter((s) => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {subscriptions.filter((s) => s.status === 'paused').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              BHD {subscriptions.reduce((sum, s) => sum + s.total_price, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                All Subscriptions ({filteredSubscriptions.length})
              </CardTitle>
              <CardDescription>
                Filter and manage subscription records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Packages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {uniquePackages.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg.charAt(0).toUpperCase() + pkg.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredSubscriptions}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search subscriptions..."
            emptyMessage="No subscriptions found"
          />
        </CardContent>
      </Card>

      {/* Subscription Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Complete subscription information
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Name
                    </label>
                    <p className="text-lg">{selectedSubscription.customer.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-lg">{selectedSubscription.customer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="text-lg">{selectedSubscription.customer.phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Package Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Package Type
                    </label>
                    <p className="text-lg capitalize">{selectedSubscription.package_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Meals per Day
                    </label>
                    <p className="text-lg">{selectedSubscription.meals_per_day}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Days per Month
                    </label>
                    <p className="text-lg">{selectedSubscription.days_per_month}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Total Price
                    </label>
                    <p className="text-lg font-bold text-primary">
                      BHD {selectedSubscription.total_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Start Date
                    </label>
                    <p className="text-lg">
                      {format(new Date(selectedSubscription.start_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      End Date
                    </label>
                    <p className="text-lg">
                      {format(new Date(selectedSubscription.end_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(selectedSubscription.status)}>
                        {selectedSubscription.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
