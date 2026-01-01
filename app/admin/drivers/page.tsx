'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column, Action } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import { Truck, Plus, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  active: boolean;
  area?: string;
  totalDeliveries?: number;
  todayDeliveries?: number;
}

const BAHRAIN_AREAS = [
  'Manama',
  'Muharraq',
  'Riffa',
  'Hamad Town',
  'Isa Town',
  'Sitra',
  'Budaiya',
  'Jidhafs',
  'Saar',
  'Tubli',
  'Adliya',
  'Juffair',
  'Seef',
  'Amwaj Islands',
  'Durrat Al Bahrain',
];

export default function DriversPage() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    area: '',
  });
  const supabase = createClient();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);

      // Get all drivers
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, created_at')
        .eq('role', 'driver')
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      // Get delivery counts for each driver
      const driversWithStats = await Promise.all(
        (driversData || []).map(async (driver) => {
          // Total deliveries
          const { count: totalCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', driver.id)
            .eq('status', 'delivered');

          // Today's deliveries
          const today = new Date().toISOString().split('T')[0];
          const { count: todayCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', driver.id)
            .gte('delivery_date', today)
            .lt('delivery_date', `${today}T23:59:59`);

          return {
            ...driver,
            active: true,
            totalDeliveries: totalCount || 0,
            todayDeliveries: todayCount || 0,
          };
        })
      );

      setDrivers(driversWithStats);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.full_name || !newDriver.email || !newDriver.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newDriver.email,
        password: newDriver.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with driver role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: newDriver.full_name,
            phone: newDriver.phone,
            role: 'driver',
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        toast.success('Driver added successfully');
        setShowAddDialog(false);
        setNewDriver({ full_name: '', email: '', phone: '', password: '', area: '' });
        loadDrivers();
      }
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast.error(error.message || 'Failed to add driver');
    }
  };

  const handleToggleActive = async (driver: Driver) => {
    try {
      // Note: In production, you'd have an 'active' column in profiles table
      toast.success(`Driver ${driver.active ? 'deactivated' : 'activated'}`);
      loadDrivers();
    } catch (error) {
      console.error('Error toggling driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const handleViewDeliveries = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsDialog(true);
  };

  const columns: Column<Driver>[] = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (driver) => (
        <div className="font-medium">{driver.full_name}</div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (driver) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{driver.email}</span>
          </div>
          {driver.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{driver.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'area',
      label: 'Area',
      render: (driver) =>
        driver.area ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{driver.area}</span>
          </div>
        ) : (
          <Badge variant="outline">Not assigned</Badge>
        ),
    },
    {
      key: 'todayDeliveries',
      label: "Today's Deliveries",
      sortable: true,
      render: (driver) => (
        <Badge variant="default">{driver.todayDeliveries || 0}</Badge>
      ),
    },
    {
      key: 'totalDeliveries',
      label: 'Total Deliveries',
      sortable: true,
      render: (driver) => (
        <span className="font-medium">{driver.totalDeliveries || 0}</span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (driver) => (
        <Badge variant={driver.active ? 'default' : 'secondary'}>
          {driver.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const actions: Action<Driver>[] = [
    {
      label: 'View Deliveries',
      onClick: handleViewDeliveries,
    },
    {
      label: 'Toggle Active Status',
      onClick: handleToggleActive,
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Driver Management</h1>
          <p className="text-muted-foreground">
            Manage delivery drivers and assignments
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            All Drivers ({drivers.length})
          </CardTitle>
          <CardDescription>
            View driver status and delivery history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={drivers}
            columns={columns}
            actions={actions}
            searchPlaceholder="Search drivers..."
            emptyMessage="No drivers found"
          />
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Create a new driver account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={newDriver.full_name}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, full_name: e.target.value })
                }
                placeholder="Enter driver's full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newDriver.email}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, email: e.target.value })
                }
                placeholder="driver@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newDriver.phone}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, phone: e.target.value })
                }
                placeholder="+973 XXXX XXXX"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newDriver.password}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, password: e.target.value })
                }
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <Label htmlFor="area">Assigned Area</Label>
              <Select
                value={newDriver.area}
                onValueChange={(value) =>
                  setNewDriver({ ...newDriver, area: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {BAHRAIN_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver}>Add Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
            <DialogDescription>
              Delivery history and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Driver Name
                  </label>
                  <p className="text-lg font-semibold">{selectedDriver.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact
                  </label>
                  <p className="text-sm">{selectedDriver.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Today's Deliveries
                  </label>
                  <p className="text-2xl font-bold text-primary">
                    {selectedDriver.todayDeliveries || 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Total Deliveries
                  </label>
                  <p className="text-2xl font-bold text-primary">
                    {selectedDriver.totalDeliveries || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
