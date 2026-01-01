'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Validation schemas
const phoneLoginSchema = z.object({
  loginType: z.literal('phone'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+973[0-9]{8}$/, 'Phone must be in format +973XXXXXXXX'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

const emailLoginSchema = z.object({
  loginType: z.literal('email'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

const loginSchema = z.discriminatedUnion('loginType', [
  phoneLoginSchema,
  emailLoginSchema,
]);

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || null;
  const supabase = createClient();

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
        },
      });

      if (error) {
        toast.error('Google sign-in failed', {
          description: error.message,
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginType: 'phone',
      phone: '',
      password: '',
      rememberMe: false,
    } as LoginFormValues,
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      let authResult;

      if (data.loginType === 'phone') {
        // Login with phone number
        authResult = await supabase.auth.signInWithPassword({
          phone: data.phone,
          password: data.password,
        });
      } else {
        // Login with email
        authResult = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      }

      const { data: authData, error } = authResult;

      if (error) {
        toast.error('Login failed', {
          description: error.message,
        });
        return;
      }

      if (!authData.user) {
        toast.error('Login failed', {
          description: 'Unable to authenticate',
        });
        return;
      }

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      toast.success('Login successful', {
        description: 'Welcome back!',
      });

      // Redirect based on role or redirectTo param
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        const role = profile?.role || 'customer';
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'driver') {
          router.push('/driver');
        } else {
          router.push('/dashboard');
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Sign In Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-3 h-11"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
      >
        <GoogleIcon />
        <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Login Type Toggle */}
          <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <Button
            type="button"
            variant={loginType === 'phone' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => {
              setLoginType('phone');
              form.setValue('loginType', 'phone');
            }}
          >
            Phone
          </Button>
          <Button
            type="button"
            variant={loginType === 'email' ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => {
              setLoginType('email');
              form.setValue('loginType', 'email');
            }}
          >
            Email
          </Button>
        </div>

        {/* Phone Login Fields */}
        {loginType === 'phone' && (
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+973 XXXX XXXX"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Email Login Fields */}
        {loginType === 'email' && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remember Me Checkbox */}
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={loading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <Label className="text-sm font-normal">Remember me</Label>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        </form>
      </Form>
    </div>
  );
}
