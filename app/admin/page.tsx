'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  Truck,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalCustomers: number;
  activeSubscriptions: number;
  todayOrders: number;
  monthlyRevenue: number;
  totalDrivers: number;
  pendingOrders: number;
}

interface RecentActivity {
  id: string;
  type: 'subscription' | 'order' | 'customer';
  message: string;
  timestamp: string;
}

export default function AdminPage() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeSubscriptions: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
    totalDrivers: 0,
    pendingOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Get total customers
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Get active subscriptions
      const { count: activeSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get today's orders
      const today = new Date().toISOString().split('T')[0];
      const { count: todayOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('delivery_date', today)
        .lt('delivery_date', `${today}T23:59:59`);

      // Get monthly revenue
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const { data: monthlyOrders } = await supabase
        .from('subscriptions')
        .select('total_price')
        .gte('created_at', firstDayOfMonth);

      const monthlyRevenue = monthlyOrders?.reduce((sum, sub) => sum + sub.total_price, 0) || 0;

      // Get total drivers
      const { count: driversCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver');

      // Get pending orders
      const { count: pendingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['scheduled', 'preparing']);

      setStats({
        totalCustomers: customersCount || 0,
        activeSubscriptions: activeSubsCount || 0,
        todayOrders: todayOrdersCount || 0,
        monthlyRevenue: monthlyRevenue,
        totalDrivers: driversCount || 0,
        pendingOrders: pendingOrdersCount || 0,
      });

      // Load recent activity
      await loadRecentActivity();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Get recent subscriptions
      const { data: recentSubs } = await supabase
        .from('subscriptions')
        .select('id, created_at, customer_id, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = [];

      if (recentSubs) {
        recentSubs.forEach((sub): void => {
          const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
          activities.push({
            id: sub.id,
            type: 'subscription',
            message: `New subscription from ${profile?.full_name || 'Customer'}`,
            timestamp: sub.created_at,
          });
        });
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary mb-2">{t('Admin Dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('Overview of Healthy Club operations')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title={t('Total Customers')}
          value={stats.totalCustomers}
          icon={Users}
          iconColor="text-blue-500 dark:text-blue-400"
          description={t('Registered customers')}
        />
        <StatsCard
          title={t('Active Subscriptions')}
          value={stats.activeSubscriptions}
          icon={Package}
          iconColor="text-green-500 dark:text-green-400"
          description={t('Currently active')}
        />
        <StatsCard
          title={t("Today's Orders")}
          value={stats.todayOrders}
          icon={ShoppingCart}
          iconColor="text-orange-500 dark:text-orange-400"
          description={t('Orders for today')}
        />
        <StatsCard
          title={t('Monthly Revenue')}
          value={`BHD ${stats.monthlyRevenue.toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-purple-500 dark:text-purple-400"
          description={t('This month')}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatsCard
          title={t('Total Drivers')}
          value={stats.totalDrivers}
          icon={Truck}
          iconColor="text-cyan-500 dark:text-cyan-400"
          description={t('Active drivers')}
        />
        <StatsCard
          title={t('Pending Orders')}
          value={stats.pendingOrders}
          icon={Calendar}
          iconColor="text-amber-500 dark:text-amber-400"
          description={t('Awaiting processing')}
        />
        <StatsCard
          title={t('System Status')}
          value={t('Operational')}
          icon={Activity}
          iconColor="text-emerald-500 dark:text-emerald-400"
          description={t('All systems running')}
        />
      </div>

      {/* Recent Activity */}
      <Card className="dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('Recent Activity')}
          </CardTitle>
          <CardDescription>{t('Latest updates and events')}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b dark:border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === 'subscription'
                          ? 'bg-green-500 dark:bg-green-400'
                          : activity.type === 'order'
                          ? 'bg-blue-500 dark:bg-blue-400'
                          : 'bg-purple-500 dark:bg-purple-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium dark:text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy - h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('No recent activity')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
