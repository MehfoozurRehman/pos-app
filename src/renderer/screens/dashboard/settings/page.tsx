import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { BuildingIcon, DatabaseIcon, DownloadIcon, HardDriveIcon, PaletteIcon, SaveIcon, SettingsIcon, ShieldIcon, TrashIcon, UploadIcon, UserIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';

export default function Settings() {
  const { data: shop } = useSWR('shop', () => window.api.db.get('shop'));
  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));
  const { data: customers } = useSWR('customers', () => window.api.db.get('customers'));

  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState('shop');
  const [shopForm, setShopForm] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    address: '',
    location: '',
    currency: 'PKR',
    taxRate: 0,
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: 'system',
    language: 'en',
    autoBackup: true,
    lowStockThreshold: 5,
  });

  useEffect(() => {
    if (shop) {
      setShopForm({
        name: shop.name || '',
        owner: shop.owner || '',
        phone: shop.phone || '',
        email: shop.email || '',
        address: shop.address || '',
        location: shop.location || '',
        currency: shop.currency || 'PKR',
        taxRate: shop.taxRate || 0,
      });
    }
  }, [shop]);

  const saveShopSettings = async () => {
    try {
      if (shop) {
        await window.api.db.update('shop', shop.id, shopForm);
      } else {
        await window.api.db.create('shop', {
          ...shopForm,
          shopId: `shop_${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
      }
      mutate('shop');
      toast.success('Shop settings saved successfully');
    } catch (error) {
      toast.error('Failed to save shop settings');
      console.error(error);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        shop,
        orders,
        products,
        inventory,
        customers,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  const syncToAPI = async () => {
    try {
      toast.info('Preparing data for sync...');

      // Get all data changes since beginning of time
      const changes = await window.api.db.changesSince(new Date(0).toISOString());

      // Get all images for sync
      const images = await window.api.getImagesForSync();

      const syncData = {
        changes,
        images,
        shop,
        syncedAt: new Date().toISOString(),
      };

      // For now, just show the data that would be synced
      console.log('Sync data prepared:', syncData);

      // Create a downloadable file with sync data for now
      const blob = new Blob([JSON.stringify(syncData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-sync-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Sync data prepared! Found ${changes.length} changes and ${images.length} images. Check downloads folder.`);
    } catch (error) {
      toast.error('Failed to prepare sync data');
      console.error(error);
    }
  };

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will delete ALL orders, products, inventory, and customers. Type "DELETE" to confirm.')) {
      return;
    }

    try {
      // Clear all data tables
      const allOrders = await window.api.db.get('orders');
      const allProducts = await window.api.db.get('products');
      const allInventory = await window.api.db.get('inventory');
      const allCustomers = await window.api.db.get('customers');

      // Delete all items
      for (const order of allOrders || []) {
        await window.api.db.delete('orders', order.id);
      }
      for (const product of allProducts || []) {
        await window.api.db.delete('products', product.id);
      }
      for (const item of allInventory || []) {
        await window.api.db.delete('inventory', item.id);
      }
      for (const customer of allCustomers || []) {
        await window.api.db.delete('customers', customer.id);
      }

      // Refresh all data
      mutate('orders');
      mutate('products');
      mutate('inventory');
      mutate('customers');

      toast.success('All data cleared successfully');
    } catch (error) {
      toast.error('Failed to clear data');
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5" />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-name">Shop Name *</Label>
                  <Input id="shop-name" placeholder="Enter shop name" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-owner">Owner Name *</Label>
                  <Input id="shop-owner" placeholder="Enter owner name" value={shopForm.owner} onChange={(e) => setShopForm({ ...shopForm, owner: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-phone">Phone</Label>
                  <Input id="shop-phone" placeholder="Enter phone number" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-email">Email</Label>
                  <Input id="shop-email" type="email" placeholder="Enter email address" value={shopForm.email} onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-location">City/Location</Label>
                  <Input id="shop-location" placeholder="Enter city or location" value={shopForm.location} onChange={(e) => setShopForm({ ...shopForm, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-currency">Currency</Label>
                  <Select value={shopForm.currency} onValueChange={(value) => setShopForm({ ...shopForm, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">Pakistani Rupee (PKR)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-address">Address</Label>
                <Textarea id="shop-address" placeholder="Enter complete address" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Enter tax rate"
                  value={shopForm.taxRate}
                  onChange={(e) => setShopForm({ ...shopForm, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveShopSettings}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Shop Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={systemSettings.theme} onValueChange={(value) => setSystemSettings({ ...systemSettings, theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Low Stock Threshold</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={systemSettings.lowStockThreshold}
                    onChange={(e) => setSystemSettings({ ...systemSettings, lowStockThreshold: parseInt(e.target.value) || 5 })}
                  />
                  <div className="text-sm text-muted-foreground">Alert when product stock falls below this number</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <ShieldIcon className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="font-medium">Data Encryption</div>
                        <div className="text-sm text-muted-foreground">Your data is encrypted locally</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <HardDriveIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="font-medium">Local Storage</div>
                        <div className="text-sm text-muted-foreground">All data stored on your device</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{orders?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Orders</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{products?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{inventory?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Inventory Items</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{customers?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Customers</div>
                </div>
              </div>

              <Separator />

              {/* Backup & Export */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Backup & Export</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DownloadIcon className="h-5 w-5 text-blue-600" />
                        <div className="font-medium">Export Data</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Download all your data as a JSON file for backup or migration purposes.</div>
                      <Button onClick={exportData} variant="outline" className="w-full">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UploadIcon className="h-5 w-5 text-green-600" />
                        <div className="font-medium">Import Data</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Import data from a previously exported JSON file.</div>
                      <Button variant="outline" className="w-full" disabled>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Import Data (Coming Soon)
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Sync to API */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sync to Node.js API</h3>
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UploadIcon className="h-5 w-5 text-blue-600" />
                      <div className="font-medium text-blue-800">Prepare Sync Data</div>
                    </div>
                    <div className="text-sm text-blue-700">
                      This will prepare all your data changes and images for syncing to a Node.js API. The sync data will include all database changes and image files with their URLs.
                    </div>
                    <Button onClick={syncToAPI} variant="outline" className="w-full">
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Prepare Sync Data
                    </Button>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TrashIcon className="h-5 w-5 text-red-600" />
                        <div className="font-medium text-red-800">Clear All Data</div>
                      </div>
                      <div className="text-sm text-red-700">This will permanently delete all orders, products, inventory, and customers. This action cannot be undone.</div>
                      <Button onClick={clearAllData} variant="destructive">
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                About POS System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <BuildingIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">POS System</h2>
                  <div className="text-muted-foreground">Version 1.0.0</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">✓</Badge>
                    <span>Product Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">✓</Badge>
                    <span>Inventory Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">✓</Badge>
                    <span>Order Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">✓</Badge>
                    <span>Customer Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">✓</Badge>
                    <span>Sales Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">✓</Badge>
                    <span>Data Export/Import</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Platform</div>
                    <div className="font-medium">Electron + React</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Database</div>
                    <div className="font-medium">Local JSON Storage</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">UI Framework</div>
                    <div className="font-medium">shadcn/ui + Tailwind CSS</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">License</div>
                    <div className="font-medium">MIT License</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">Built with ❤️ for small businesses</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
