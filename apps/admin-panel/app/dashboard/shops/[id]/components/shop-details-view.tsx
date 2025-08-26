'use client';

import { ArrowLeft, Check, Clock, Copy, CreditCard, Mail, MapPin, Phone, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { use, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import toastError from '@/utils/toastError';
import { useQuery } from 'convex/react';

interface ShopDetailsViewProps {
  searchParams: Promise<{ id: Id<'shops'> }>;
}

export function ShopDetailsView({ searchParams }: ShopDetailsViewProps) {
  const { id } = use(searchParams);

  const shop = useQuery(api.shops.getShop, { id });

  const payments = useQuery(api.payments.getPaymentsForShop, { shopId: id });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toastError(error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatLoginAt = (loginAt?: string) => {
    if (!loginAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(loginAt), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  const getThemeColor = (theme?: string) => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-900 text-white';
      case 'light':
        return 'bg-white text-slate-900 border';
      default:
        return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900';
    }
  };

  if (shop === undefined || payments === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (shop === null) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/shops">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shops
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-6">
            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {shop.logo ? (
                <Image width={200} height={200} src={shop.logoUrl || ''} alt={shop.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{shop.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <CardTitle className="text-3xl">{shop.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{shop.shopId}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(shop.shopId, 'Shop ID')}>
                    {copiedField === 'Shop ID' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <CardDescription className="text-base mb-3">Owned by {shop.owner}</CardDescription>
              {shop.description && <p className="text-sm text-muted-foreground mb-3">{shop.description}</p>}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{shop.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Last login: {formatLoginAt(shop.loginAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shop.phone ? (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{shop.phone}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(shop.phone!, 'Phone')}>
                      {copiedField === 'Phone' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>No phone number</span>
                  </div>
                )}
                {shop.email ? (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{shop.email}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(shop.email!, 'Email')}>
                      {copiedField === 'Email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>No email address</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shop Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{formatDate(shop.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Login</span>
                  <span className="text-sm">{formatLoginAt(shop.loginAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Payments</span>
                  <span className="text-sm">{payments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Shop Configuration</span>
              </CardTitle>
              <CardDescription>Current settings and preferences for this shop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme Preference</label>
                  <div className="flex items-center space-x-2">
                    {shop.theme ? (
                      <Badge variant="outline" className={getThemeColor(shop.theme)}>
                        {shop.theme.charAt(0).toUpperCase() + shop.theme.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inventory Mode</label>
                  <div className="flex items-center space-x-2">
                    {shop.inventoryMode ? (
                      <Badge variant="outline">{shop.inventoryMode.charAt(0).toUpperCase() + shop.inventoryMode.slice(1)}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment History</span>
              </CardTitle>
              <CardDescription>Payment records for this shop</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment records found</p>
                  <p className="text-sm">Payment history will appear here once available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {new Date(Number(payment.year), Number(payment.month) - 1).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">Payment Received</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication Credentials</CardTitle>
              <CardDescription>Credentials used for Electron app authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium">Shop ID</label>
                    <div className="text-sm text-muted-foreground">Used as username for Electron app login</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{shop.shopId}</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(shop.shopId, 'Shop ID')}>
                      {copiedField === 'Shop ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <div className="text-sm text-muted-foreground">Used for Electron app authentication</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{'•'.repeat(shop.password.length)}</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(shop.password, 'Password')}>
                      {copiedField === 'Password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These credentials are required for the Electron POS app to authenticate and sync data with this admin panel. Keep them secure and share only with authorized
                  personnel.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
