'use client';

import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Id } from '@/convex/_generated/dataModel';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import toastError from '@/utils/toastError';
import { useForm } from 'react-hook-form';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

const createShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100, 'Shop name must be less than 100 characters'),
  owner: z.string().min(1, 'Owner name is required').max(100, 'Owner name must be less than 100 characters'),
  logoFile: z.custom<File>().optional(),
  logoDataUrl: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(200, 'Location must be less than 200 characters'),
  phone: z.string().optional(),
  email: z.string().email('Must be a valid email').optional().or(z.literal('')),
  description: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  inventoryMode: z.enum(['barcode', 'quantity']).optional(),
});

type CreateShopForm = z.infer<typeof createShopSchema>;

interface CreateShopSheetProps {
  children: React.ReactNode;
}

export function CreateShopSheet({ children }: CreateShopSheetProps) {
  const [open, setOpen] = useState(false);
  const createShop = useMutation(api.shops.createShop);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const form = useForm<CreateShopForm>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      name: '',
      owner: '',
      logoFile: undefined,
      logoDataUrl: '',
      location: '',
      phone: '',
      email: '',
      description: '',
      theme: 'light',
      inventoryMode: 'barcode',
    },
  });

  const onSubmit = async (data: CreateShopForm) => {
    try {
      let logoUrl = '' as Id<'_storage'>;

      if (data.logoDataUrl) {
        const postUrl = await generateUploadUrl();

        const result = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': data.logoFile!.type },
          body: data.logoFile,
        });

        const { storageId } = await result.json();
        logoUrl = storageId;
      }

      const cleanData = {
        ...data,
        logo: data.logoDataUrl || '',
        logoUrl,
        phone: data.phone || undefined,
        email: data.email || undefined,
        description: data.description || undefined,
        theme: data.theme || undefined,
        inventoryMode: data.inventoryMode || undefined,
      };

      await createShop({
        name: cleanData.name,
        owner: cleanData.owner,
        location: cleanData.location,
        logo: logoUrl || undefined,
        logoUrl: data.logoDataUrl || undefined,
        phone: cleanData.phone,
        email: cleanData.email,
        description: cleanData.description,
        theme: cleanData.theme,
        inventoryMode: cleanData.inventoryMode,
      });
      toast.success('Shop created successfully');
      form.reset();
      setOpen(false);
    } catch (error) {
      toastError(error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Shop</SheetTitle>
          <SheetDescription>Add a new shop to your POS system. A unique shop ID will be automatically generated for Electron app authentication.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6 px-4 h-full flex flex-col">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Downtown Store" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123 Main St, City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FileUpload
                onFileUploaded={(file, dataUrl) => {
                  form.setValue('logoFile', file);
                  form.setValue('logoDataUrl', dataUrl);
                }}
                currentFile={
                  form.watch('logoFile') && form.watch('logoDataUrl')
                    ? {
                        file: form.watch('logoFile')!,
                        dataUrl: form.watch('logoDataUrl')!,
                        filename: 'Shop Logo',
                      }
                    : undefined
                }
                accept="image/*"
                maxSize={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="shop@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the shop..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inventoryMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barcode">Barcode</SelectItem>
                        <SelectItem value="quantity">Quantity</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 mt-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Shop
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
