'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column, Action } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase';
import { Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  subscription?: {
    package_type: string;
    status: string;
  };
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const supabase = createClient();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          created_at,
          subscriptions!customer_id (
            package_type,
            status
          )
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include active subscription
      const transformedData = (data || []).map((customer) => {
        const subscriptions = customer.subscriptions as Array<{ package_type: string; status: string }> | undefined;
        return {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          created_at: customer.created_at,
          subscription: subscriptions?.find((s) => s.status === 'active') || undefined,
        } as Customer;
      });

      setCustomers(transformedData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDialog(true);
  };

  const columns: Column<Customer>[] = [
    {
      key: 'full_name',
      label: t('Name'),
      sortable: true,
      render: (customer) => (
        <div className="font-medium dark:text-white">{customer.full_name}</div>
      ),
    },
    {
      key: 'email',
      label: t('Email'),
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <span className="text-sm dark:text-gray-300">{customer.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: t('Phone'),
      render: (customer) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <span className="text-sm dark:text-gray-300">{customer.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'subscription',
      label: t('Subscription'),
      render: (customer) =>
        customer.subscription ? (
          <div className="flex flex-col gap-1">
            <Badge variant="default" className="w-fit">
              {customer.subscription.package_type}
            </Badge>
            <Badge
              variant={customer.subscription.status === 'active' ? 'default' : 'secondary'}
              className="w-fit text-xs"
            >
              {t(customer.subscription.status === 'active' ? 'Active' : 'Inactive')}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline">{t('No subscription')}</Badge>
        ),
    },
    {
      key: 'created_at',
      label: t('Joined'),
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-muted-foreground dark:text-gray-400">
          {format(new Date(customer.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const actions: Action<Customer>[] = [
    {
      label: t('View Details'),
      onClick: handleViewDetails,
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">{t('Loading customers...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2 dark:text-white">{t('Customer Management')}</h1>
        <p className="text-muted-foreground dark:text-gray-400">
          {t('View and manage all registered customers')}
        </p>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Users className="h-5 w-5" />
            {t('All Customers')} ({customers.length})
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {t('Filter and search through customer records')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={customers}
            columns={columns}
            actions={actions}
            searchPlaceholder={t('Search by name, email, or phone...')}
            emptyMessage={t('No customers found')}
          />
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('Customer Details')}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('Complete information about this customer')}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Full Name')}
                  </label>
                  <p className="text-lg font-semibold dark:text-white">{selectedCustomer.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Email')}
                  </label>
                  <p className="text-lg dark:text-gray-300">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Phone')}
                  </label>
                  <p className="text-lg dark:text-gray-300">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Joined')}
                  </label>
                  <p className="text-lg dark:text-gray-300">
                    {format(new Date(selectedCustomer.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {selectedCustomer.subscription && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-3 dark:text-white">{t('Active Subscription')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                        {t('Package Type')}
                      </label>
                      <p className="text-lg capitalize dark:text-gray-300">
                        {selectedCustomer.subscription.package_type}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                        {t('Status')}
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedCustomer.subscription.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {t(selectedCustomer.subscription.status === 'active' ? 'Active' : 'Inactive')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
