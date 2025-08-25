'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { saveToken } from '@/actions/saveToken';
import { toast } from 'sonner';
import toastError from '@/utils/toastError';
import { useMutation } from 'convex/react';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();

  const login = useMutation(api.auth.loginAdmin);

  const [isPending, startLogin] = useTransition();

  const searchParams = useSearchParams();

  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      const normalizedError = error.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      console.log(normalizedError);
      toastError(normalizedError);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const email = formData.get('email') as string;

    const password = formData.get('password') as string;

    if (!email) {
      toast.error('Email is required');
      return;
    }

    if (!password) {
      toast.error('Password is required');
      return;
    }

    startLogin(async () => {
      try {
        const res = await login({ email, password });

        await saveToken(res);

        router.push('/dashboard');

        toast.success('Logged in successfully');
      } catch (error) {
        toastError(error);
      }
    });
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email and password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" name="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader className="animate-spin mr-1" />}
                  Login
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
