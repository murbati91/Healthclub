'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column, Action } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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
      const transformedData = data?.map((customer: any) => ({
        ...customer,
        subscription: customer.subscriptions?.find((s: any) => s.status === 'active') || null,
      }));

      setCustomers(transformedData || []);
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
      label: 'Name',
      sortable: true,
      render: (customer) => (
        <div className="font-medium">{customer.full_name}</div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{customer.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (customer) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{customer.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'subscription',
      label: 'Subscription',
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
              {customer.subscription.status}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline">No subscription</Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (customer) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(customer.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const actions: Action<Customer>[] = [
    {
      label: 'View Details',
      onClick: handleViewDetails,
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Customer Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered customers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Customers ({customers.length})
          </CardTitle>
          <CardDescription>
            Filter and search through customer records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={customers}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search by name, email, or phone..."
            emptyMessage="No customers found"
          />
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Complete information about this customer
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-lg font-semibold">{selectedCustomer.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-lg">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p className="text-lg">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Joined
                  </label>
                  <p className="text-lg">
                    {format(new Date(selectedCustomer.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {selectedCustomer.subscription && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Active Subscription</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Package Type
                      </label>
                      <p className="text-lg capitalize">
                        {selectedCustomer.subscription.package_type}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedCustomer.subscription.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {selectedCustomer.subscription.status}
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
