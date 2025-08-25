import { Building2, Mail, MapPin, Moon, Palette, Phone, Save, Store, Sun, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Button } from '@renderer/components/ui/button';
import { ImageUpload } from '@renderer/components/ui/image-upload';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import { Shop } from 'src/types';
import { Textarea } from '@renderer/components/ui/textarea';
import { toast } from 'sonner';
import { useTheme } from '@renderer/components/theme-provider';

interface ShopFormData {
  name: string;
  owner: string;
  location: string;
  phone: string;
  email: string;
  description: string;
  logo: string;
  theme: 'light' | 'dark' | 'system';
}

const initialFormData: ShopFormData = {
  name: '',
  owner: '',
  location: '',
  phone: '',
  email: '',
  description: '',
  logo: '',
  theme: 'system',
};

export default function Settings() {
  const [formData, setFormData] = useState<ShopFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: shop } = useSWR('shop', () => window.api.db.get('shop'));
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        owner: shop.owner || '',
        location: shop.location || '',
        phone: shop.phone || '',
        email: shop.email || '',
        description: shop.description || '',
        logo: shop.logo || '',
        theme: shop.theme || 'system',
      });
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    if (!formData.owner.trim()) {
      toast.error('Owner name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const shopData = {
        ...formData,
        name: formData.name.trim(),
        owner: formData.owner.trim(),
        location: formData.location.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
      };

      if (shop) {
        await window.api.db.update('shop', shop.id, shopData);
      } else {
        await window.api.db.create('shop', {
          ...shopData,
          shopId: `shop_${Date.now()}`,
        });
      }

      // Apply theme change immediately
      setTheme(formData.theme);

      await mutate('shop');
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setFormData((prev) => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop Details
            </CardTitle>
            <CardDescription>Configure your shop information and branding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shop Logo */}
            <div className="space-y-2">
              <Label>Shop Logo</Label>
              <ImageUpload value={formData.logo} onChange={(value) => setFormData((prev) => ({ ...prev, logo: value || '' }))} disabled={isSubmitting} placeholder="Upload your shop logo" />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Shop Name *
                </Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter shop name" disabled={isSubmitting} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Name *
                </Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData((prev) => ({ ...prev, owner: e.target.value }))}
                  placeholder="Enter owner name"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Enter shop location/address"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Shop Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter a brief description of your shop"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={formData.theme} onValueChange={handleThemeChange} disabled={isSubmitting}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Choose your preferred theme. System will use your device's theme setting.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Current Theme</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {theme === 'light' && (
                  <>
                    <Sun className="h-4 w-4" />
                    Light mode is active
                  </>
                )}
                {theme === 'dark' && (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark mode is active
                  </>
                )}
                {theme === 'system' && (
                  <>
                    <Palette className="h-4 w-4" />
                    Following system preference
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
