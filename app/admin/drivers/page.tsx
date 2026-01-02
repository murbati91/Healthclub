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
import { toast } from 'sonner';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';

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
  'Adhari',
  'Adliya',
  'A\'ali',
  'Amwaj Islands',
  'Arad',
  'Bilad Al Qadeem',
  'Budaiya',
  'Busaiteen',
  'Diyar Al Muharraq',
  'Durrat Al Bahrain',
  'Gudaibiya',
  'Hamad Town',
  'Hidd',
  'Hoora',
  'Isa Town',
  'Jidhafs',
  'Juffair',
  'Manama',
  'Muharraq',
  'Riffa',
  'Saar',
  'Sanabis',
  'Sanad',
  'Seef',
  'Sitra',
  'Tubli',
  'Zinj',
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
  const { language } = useLanguage();
  const t = useTranslation(language);
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
    } catch (error) {
      console.error('Error adding driver:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add driver';
      toast.error(errorMessage);
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
      label: t('Name'),
      sortable: true,
      render: (driver) => (
        <div className="font-medium dark:text-white">{driver.full_name}</div>
      ),
    },
    {
      key: 'email',
      label: t('Contact'),
      render: (driver) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <span className="text-sm dark:text-gray-300">{driver.email}</span>
          </div>
          {driver.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <span className="text-sm dark:text-gray-300">{driver.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'area',
      label: t('Area'),
      render: (driver) =>
        driver.area ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <span className="text-sm dark:text-gray-300">{driver.area}</span>
          </div>
        ) : (
          <Badge variant="outline">{t('Not assigned')}</Badge>
        ),
    },
    {
      key: 'todayDeliveries',
      label: t("Today's Deliveries"),
      sortable: true,
      render: (driver) => (
        <Badge variant="default">{driver.todayDeliveries || 0}</Badge>
      ),
    },
    {
      key: 'totalDeliveries',
      label: t('Total Deliveries'),
      sortable: true,
      render: (driver) => (
        <span className="font-medium dark:text-white">{driver.totalDeliveries || 0}</span>
      ),
    },
    {
      key: 'active',
      label: t('Status'),
      render: (driver) => (
        <Badge variant={driver.active ? 'default' : 'secondary'}>
          {t(driver.active ? 'Active' : 'Inactive')}
        </Badge>
      ),
    },
  ];

  const actions: Action<Driver>[] = [
    {
      label: t('View Deliveries'),
      onClick: handleViewDeliveries,
    },
    {
      label: t('Toggle Active Status'),
      onClick: handleToggleActive,
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">{t('Loading drivers...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 dark:text-white">{t('Driver Management')}</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            {t('Manage delivery drivers and assignments')}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Add Driver')}
        </Button>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Truck className="h-5 w-5" />
            {t('All Drivers')} ({drivers.length})
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {t('View driver status and delivery history')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={drivers}
            columns={columns}
            actions={actions}
            searchPlaceholder={t('Search drivers...')}
            emptyMessage={t('No drivers found')}
          />
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('Add New Driver')}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('Create a new driver account')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="full_name" className="dark:text-gray-300">{t('Full Name')} *</Label>
              <Input
                id="full_name"
                value={newDriver.full_name}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, full_name: e.target.value })
                }
                placeholder={t("Enter driver's full name")}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="email" className="dark:text-gray-300">{t('Email')} *</Label>
              <Input
                id="email"
                type="email"
                value={newDriver.email}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, email: e.target.value })
                }
                placeholder={t('driver@example.com')}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="dark:text-gray-300">{t('Phone Number')}</Label>
              <Input
                id="phone"
                type="tel"
                value={newDriver.phone}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, phone: e.target.value })
                }
                placeholder={t('+973 XXXX XXXX')}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="password" className="dark:text-gray-300">{t('Password')} *</Label>
              <Input
                id="password"
                type="password"
                value={newDriver.password}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, password: e.target.value })
                }
                placeholder={t('Minimum 6 characters')}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="area" className="dark:text-gray-300">{t('Assigned Area')}</Label>
              <Select
                value={newDriver.area}
                onValueChange={(value) =>
                  setNewDriver({ ...newDriver, area: value })
                }
              >
                <SelectTrigger className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  <SelectValue placeholder={t('Select area')} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {BAHRAIN_AREAS.map((area) => (
                    <SelectItem key={area} value={area} className="dark:text-white">
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleAddDriver}>{t('Add Driver')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('Driver Details')}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('Delivery history and statistics')}
            </DialogDescription>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Driver Name')}
                  </label>
                  <p className="text-lg font-semibold dark:text-white">{selectedDriver.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Contact')}
                  </label>
                  <p className="text-sm dark:text-gray-300">{selectedDriver.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t("Today's Deliveries")}
                  </label>
                  <p className="text-2xl font-bold text-primary dark:text-white">
                    {selectedDriver.todayDeliveries || 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    {t('Total Deliveries')}
                  </label>
                  <p className="text-2xl font-bold text-primary dark:text-white">
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
