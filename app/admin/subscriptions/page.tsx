'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column, Action } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase';
import { Package, Filter, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';

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
  [key: string]: unknown;
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation(language);
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
      label: t('Customer'),
      sortable: true,
      render: (sub) => (
        <div>
          <div className="font-medium dark:text-white">{sub.customer.full_name}</div>
          <div className="text-sm text-muted-foreground dark:text-gray-400">{sub.customer.email}</div>
        </div>
      ),
    },
    {
      key: 'package_type',
      label: t('Package'),
      sortable: true,
      render: (sub) => (
        <div>
          <div className="font-medium capitalize dark:text-white">{sub.package_type}</div>
          <div className="text-sm text-muted-foreground dark:text-gray-400">
            {sub.meals_per_day} {t('meals/day')} × {sub.days_per_month} days
          </div>
        </div>
      ),
    },
    {
      key: 'start_date',
      label: t('Duration'),
      render: (sub) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground dark:text-gray-400" />
            <span className="dark:text-gray-300">{format(new Date(sub.start_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="text-muted-foreground dark:text-gray-400">
            {t('to')} {format(new Date(sub.end_date), 'MMM d, yyyy')}
          </div>
        </div>
      ),
    },
    {
      key: 'total_price',
      label: t('Price'),
      sortable: true,
      render: (sub) => (
        <div className="flex items-center gap-1 font-semibold dark:text-white">
          <DollarSign className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <span>BHD {sub.total_price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('Status'),
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
      label: t('View Details'),
      onClick: handleViewDetails,
    },
    {
      label: t('Activate'),
      onClick: (sub) => handleStatusChange(sub.id, 'active'),
    },
    {
      label: t('Pause'),
      onClick: (sub) => handleStatusChange(sub.id, 'paused'),
    },
    {
      label: t('Cancel'),
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
          <p className="text-muted-foreground dark:text-gray-400">{t('Loading subscriptions...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 dark:text-white">{t('Subscription Management')}</h1>
        <p className="text-muted-foreground dark:text-gray-400">
          {t('View and manage customer meal subscriptions')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
              {t('Total Subscriptions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
              {t('Active')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {subscriptions.filter((s) => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
              {t('Paused')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {subscriptions.filter((s) => s.status === 'paused').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
              {t('Total Revenue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">
              BHD {subscriptions.reduce((sum, s) => sum + s.total_price, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Package className="h-5 w-5" />
                {t('All Subscriptions')} ({filteredSubscriptions.length})
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {t('Filter and manage subscription records')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="all" className="dark:text-white">{t('All Status')}</SelectItem>
                  <SelectItem value="active" className="dark:text-white">{t('Active')}</SelectItem>
                  <SelectItem value="paused" className="dark:text-white">{t('Paused')}</SelectItem>
                  <SelectItem value="cancelled" className="dark:text-white">{t('Cancelled')}</SelectItem>
                  <SelectItem value="completed" className="dark:text-white">{t('Completed')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-[150px] dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder={t('All Packages')} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="all" className="dark:text-white">{t('All Packages')}</SelectItem>
                  {uniquePackages.map((pkg) => (
                    <SelectItem key={pkg} value={pkg} className="dark:text-white">
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
            searchPlaceholder={t('Search subscriptions...')}
            emptyMessage={t('No subscriptions found')}
          />
        </CardContent>
      </Card>

      {/* Subscription Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('Subscription Details')}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('Complete subscription information')}
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold mb-3 dark:text-white">{t('Customer Information')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Name')}
                    </label>
                    <p className="text-lg dark:text-gray-300">{selectedSubscription.customer.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Email')}
                    </label>
                    <p className="text-lg dark:text-gray-300">{selectedSubscription.customer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Phone')}
                    </label>
                    <p className="text-lg dark:text-gray-300">{selectedSubscription.customer.phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-semibold mb-3 dark:text-white">{t('Package Details')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Package Type')}
                    </label>
                    <p className="text-lg capitalize dark:text-gray-300">{selectedSubscription.package_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Meals per Day')}
                    </label>
                    <p className="text-lg dark:text-gray-300">{selectedSubscription.meals_per_day}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Days per Month')}
                    </label>
                    <p className="text-lg dark:text-gray-300">{selectedSubscription.days_per_month}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Total Price')}
                    </label>
                    <p className="text-lg font-bold text-primary dark:text-white">
                      BHD {selectedSubscription.total_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 dark:text-white">{t('Timeline')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Start Date')}
                    </label>
                    <p className="text-lg dark:text-gray-300">
                      {format(new Date(selectedSubscription.start_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('End Date')}
                    </label>
                    <p className="text-lg dark:text-gray-300">
                      {format(new Date(selectedSubscription.end_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                      {t('Status')}
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
