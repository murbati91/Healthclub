'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatusToggleProps {
  driverId: string;
  initialStatus?: boolean;
  onStatusChange?: (isOnline: boolean) => void;
}

export function StatusToggle({ driverId, initialStatus = false, onStatusChange }: StatusToggleProps) {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsOnline(initialStatus);
  }, [initialStatus]);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: checked,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setIsOnline(checked);
      onStatusChange?.(checked);
    } catch (error) {
      console.error('Error updating driver status:', error);
      // Revert on error
      setIsOnline(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <div>
              <p className="text-sm font-medium">Driver Status</p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Available for deliveries' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="px-3 py-1">
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggle}
              disabled={isLoading}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
