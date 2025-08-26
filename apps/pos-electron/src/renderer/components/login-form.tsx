import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';
import { axios } from '@/utils/axios';
import { cn } from '@/utils';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import useSWR from 'swr';
import useShop from '@/hooks/use-shop';
import { useTransition } from 'react';

interface Shop {
  id: string;
  shopId: string;
  name: string;
  owner: string;
  logo: string | undefined;
  location: string;
  phone: string | undefined;
  email: string | undefined;
  description: string | undefined;
  theme: 'light' | 'dark' | 'system' | undefined;
  inventoryMode: 'barcode' | 'quantity' | undefined;
}

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const navigate = useNavigate();

  const shop = useShop();

  const [isLoggingIn, startLogin] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const shopId = formData.get('shop-id');

    const password = formData.get('password');

    startLogin(async () => {
      try {
        if (!shopId) {
          throw new Error('Missing shop id');
        }

        if (!password) {
          throw new Error('Missing password');
        }

        const { data } = (await axios.post('/api/app-auth', {
          shopId,
          password,
        })) as { data: Shop };

        window.api.db.update('shop', '', {
          name: data.name,
          owner: data.owner,
          logo: data.logo,
          location: data.location,
          phone: data.phone,
          email: data.email,
          description: data.description,
          theme: data.theme,
          inventoryMode: data.inventoryMode,
          shopId: data.shopId,
        });

        navigate('/dashboard');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred');
        }
      }
    });
  };

  if (shop.isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (shop.shopId) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center gap-4">
          <CardTitle>Welcome to POS</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="shop-id">shop Id</Label>
                <Input id="shop-id" name="shop-id" type="text" placeholder="Enter your shop id" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter your password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button disabled={isLoggingIn} type="submit" className="w-full">
                  {isLoggingIn && <Loader className="animate-spin" />}
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
