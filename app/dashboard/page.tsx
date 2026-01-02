'use client';

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderTimeline } from "@/components/dashboard/OrderTimeline";
import { createClient } from "@/lib/supabase";
import { Subscription, Order, OrderStatus } from "@/types";
import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  MapPin,
  LogOut,
  Pause,
  Play,
  XCircle,
  Edit,
  Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface OrderWithRelations extends Order {
  subscription?: {
    package_type: string;
    meals_per_day: number;
  };
  driver?: {
    full_name: string;
    phone: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load profile
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const { profile: profileData } = await profileRes.json();
        setProfile(profileData);
        setProfileForm({ full_name: profileData.full_name, phone: profileData.phone || '' });
      }

      // Load subscriptions
      const subsRes = await fetch('/api/subscriptions');
      if (subsRes.ok) {
        const { subscriptions: subsData } = await subsRes.json();
        setSubscriptions(subsData);
      }

      // Load orders
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const { orders: ordersData } = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const activeSubscription = subscriptions.find(s => s.status === 'active');

  const handlePauseResume = async () => {
    if (!activeSubscription) return;

    const newStatus = activeSubscription.status === 'active' ? 'paused' : 'active';

    try {
      const res = await fetch(`/api/subscriptions/${activeSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Subscription ${newStatus === 'paused' ? 'paused' : 'resumed'} successfully`);
        loadDashboardData();
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('An error occurred');
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    try {
      const res = await fetch(`/api/subscriptions/${activeSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (res.ok) {
        toast.success('Subscription cancelled successfully');
        setShowCancelDialog(false);
        loadDashboardData();
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('An error occurred');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        toast.success('Profile updated successfully');
        setEditingProfile(false);
        loadDashboardData();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        toast.success('Password changed successfully');
        setShowPasswordDialog(false);
        setNewPassword('');
      } else {
        toast.error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  const totalOrders = orders.length;
  const daysRemaining = activeSubscription ? (() => {
    const startDate = new Date(activeSubscription.start_date);
    const currentDate = new Date();
    const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, activeSubscription.days_per_month - daysElapsed);
  })() : 0;
  const totalSpent = subscriptions.reduce((sum, s) => sum + s.total_price, 0);

  const nextOrder = orders.find(o => o.status === 'scheduled' || o.status === 'preparing' || o.status === 'out_for_delivery');

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome back, {profile?.full_name || 'Customer'}!
          </h1>
          <p className="text-muted-foreground">Manage your meal subscriptions and orders</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription">My Subscription</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <OverviewCard
                icon={Package}
                label="Total Orders"
                value={totalOrders}
                iconColor="text-blue-500"
              />
              <OverviewCard
                icon={Calendar}
                label="Days Remaining"
                value={daysRemaining}
                iconColor="text-green-500"
              />
              <OverviewCard
                icon={DollarSign}
                label="Total Spent"
                value={`BHD ${totalSpent.toFixed(2)}`}
                iconColor="text-yellow-500"
              />
              <OverviewCard
                icon={TrendingUp}
                label="Active Plans"
                value={subscriptions.filter(s => s.status === 'active').length}
                iconColor="text-purple-500"
              />
            </div>

            {activeSubscription && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Subscription</CardTitle>
                  <CardDescription>Your current meal plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionCard subscription={activeSubscription} />
                </CardContent>
              </Card>
            )}

            {nextOrder && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Next Delivery
                  </CardTitle>
                  <CardDescription>Upcoming order details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">
                          {format(new Date(nextOrder.delivery_date), 'EEEE, MMMM d')}
                        </p>
                        {nextOrder.driver && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Driver: {nextOrder.driver.full_name} ({nextOrder.driver.phone})
                          </p>
                        )}
                      </div>
                      <Badge>{nextOrder.status.replace('_', ' ').toUpperCase()}</Badge>
                    </div>
                    <OrderTimeline currentStatus={nextOrder.status} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {activeSubscription ? (
              <>
                <SubscriptionCard subscription={activeSubscription} />

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Actions</CardTitle>
                    <CardDescription>Manage your subscription</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handlePauseResume}
                    >
                      {activeSubscription.status === 'active' ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Subscription
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume Subscription
                        </>
                      )}
                    </Button>

                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start">
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Subscription?</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your subscription? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Keep Subscription
                          </Button>
                          <Button variant="destructive" onClick={handleCancelSubscription}>
                            Yes, Cancel
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="default"
                      className="w-full justify-start"
                      onClick={() => router.push('/subscribe')}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Change or Upgrade Package
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="text-sm">
                        <p>Area: {activeSubscription.delivery_address.area}</p>
                        <p>Block: {activeSubscription.delivery_address.block}, Road: {activeSubscription.delivery_address.road}</p>
                        <p>Building: {activeSubscription.delivery_address.building}, Flat: {activeSubscription.delivery_address.flat}</p>
                        {activeSubscription.delivery_address.notes && (
                          <p className="text-muted-foreground mt-1">Note: {activeSubscription.delivery_address.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">Preferred Time: {activeSubscription.delivery_address.preferredTimeSlot}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Subscription</CardTitle>
                  <CardDescription>Start your healthy meal journey today</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push('/subscribe')}>
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>View all your past and upcoming orders</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={orderFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOrderFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={orderFilter === 'delivered' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOrderFilter('delivered')}
                    >
                      Delivered
                    </Button>
                    <Button
                      variant={orderFilter === 'preparing' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOrderFilter('preparing')}
                    >
                      Preparing
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOrders.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No {orderFilter !== 'all' ? orderFilter : ''} orders found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{profile?.full_name}</CardTitle>
                    <CardDescription>{profile?.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      disabled={!editingProfile}
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      disabled={!editingProfile}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {editingProfile ? (
                    <>
                      <Button onClick={handleUpdateProfile}>Save Changes</Button>
                      <Button variant="outline" onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({ full_name: profile?.full_name || '', phone: profile?.phone || '' });
                      }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditingProfile(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your new password below
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowPasswordDialog(false);
                        setNewPassword('');
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword}>
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sign Out</CardTitle>
                <CardDescription>Sign out from your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleSignOut} className="w-full justify-start">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
