'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Sidebar } from '@/components/admin/Sidebar';
import { useLanguage } from '@/lib/language-context';
import { useTranslation } from '@/lib/translations';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        // Check if user has admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('Loading admin panel...')}</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background dark:bg-background">
      <Sidebar currentPath={pathname} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
