import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Driver Dashboard | Healthy Club',
  description: 'Manage your deliveries and routes',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Healthy Club Driver',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple mobile-optimized layout - no sidebar or complex navigation */}
      {children}
    </div>
  );
}
