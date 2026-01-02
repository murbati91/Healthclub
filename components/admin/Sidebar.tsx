'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Box,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const navigation = [
    { name: t('Dashboard'), href: '/admin', icon: LayoutDashboard },
    { name: t('Users'), href: '/admin/customers', icon: Users },
    { name: t('Subscriptions'), href: '/admin/subscriptions', icon: Package },
    { name: t('Orders'), href: '/admin/orders', icon: ShoppingCart },
    { name: t('Drivers'), href: '/admin/drivers', icon: Truck },
    { name: t('Packages'), href: '/admin/packages', icon: Box },
    { name: t('Settings'), href: '/admin/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'bg-card dark:bg-card border-r border-border dark:border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-border flex items-center justify-between">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold text-primary dark:text-primary">{t('Healthy Club')}</h2>
            <p className="text-xs text-muted-foreground">{t('Admin Panel')}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border dark:border-border">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20',
            collapsed && 'justify-center px-2'
          )}
          onClick={handleSignOut}
          title={collapsed ? t('Sign Out') : undefined}
        >
          <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
          {!collapsed && <span>{t('Sign Out')}</span>}
        </Button>
      </div>
    </aside>
  );
}
