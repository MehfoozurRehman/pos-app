'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, Loader, MoreHorizontal, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Id } from '@/convex/_generated/dataModel';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import toastError from '@/utils/toastError';
import { useMutation } from 'convex/react';
import { useQueryWithStatus } from '@/hooks/use-query';

export function ShopsTable() {
  const { data: shops, isPending } = useQueryWithStatus(api.shops.getShops);

  const deleteShop = useMutation(api.shops.deleteShop);

  const handleDelete = async (id: Id<'shops'>) => {
    try {
      if (!window.confirm('Are you sure you want to delete this shop?')) return;

      await deleteShop({ id });

      toast.success('Shop deleted successfully');
    } catch (error) {
      toastError(error);
    }
  };

  const formatloginAt = (loginAt?: string) => {
    if (!loginAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(loginAt), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  const getThemeBadgeVariant = (theme?: string) => {
    switch (theme) {
      case 'dark':
        return 'secondary';
      case 'light':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (shops?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-2">No shops found</div>
        <div className="text-sm text-muted-foreground">Get started by creating your first shop</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Shop</TableHead>
            <TableHead>Shop ID</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Theme</TableHead>
            <TableHead>Inventory Mode</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell colSpan={9}>
                <div className="flex justify-center items-center h-[200px] w-full">
                  <Loader className="animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          ) : (
            shops?.map((shop) => (
              <TableRow key={shop._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {shop.logo ? (
                        <Image width={200} height={200} src={shop.logoUrl || ''} alt={shop.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium">{shop.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{shop.name}</div>
                      {shop.description && <div className="text-sm text-muted-foreground truncate max-w-[200px]">{shop.description}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{shop.shopId}</code>
                </TableCell>
                <TableCell>{shop.owner}</TableCell>
                <TableCell>{shop.location}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {shop.phone && <div className="text-sm">{shop.phone}</div>}
                    {shop.email && <div className="text-sm text-muted-foreground">{shop.email}</div>}
                    {!shop.phone && !shop.email && <span className="text-muted-foreground">-</span>}
                  </div>
                </TableCell>
                <TableCell>{shop.theme ? <Badge variant={getThemeBadgeVariant(shop.theme)}>{shop.theme}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>{shop.inventoryMode ? <Badge variant="outline">{shop.inventoryMode}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                <TableCell>
                  <span className="text-sm">{formatloginAt(shop.loginAt)}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/shops/${shop.name}?id=${shop._id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(shop._id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
