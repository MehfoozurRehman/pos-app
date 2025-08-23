import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditIcon, EyeIcon, MailIcon, MapPinIcon, PhoneIcon, PlusIcon, SearchIcon, Trash2Icon, UserIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import dayjs from 'dayjs';

export default function Customers() {
  const { data: customers, isLoading: loadingCustomers } = useSWR('customers', () => window.api.db.get('customers'));
  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));

  const isMobile = useIsMobile();

  const [query, setQuery] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  const stats = useMemo(() => {
    const allCustomers = customers || [];
    const total = allCustomers.length;
    const withOrders = allCustomers.filter((c: any) => c.totalOrders > 0).length;
    const totalRevenue = allCustomers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0);
    const avgOrderValue = withOrders > 0 ? totalRevenue / allCustomers.reduce((sum: number, c: any) => sum + (c.totalOrders || 0), 0) : 0;

    return { total, withOrders, totalRevenue, avgOrderValue };
  }, [customers]);

  const enrichedCustomers = useMemo(() => {
    if (!customers || !orders) return customers || [];

    return customers.map((customer: any) => {
      const customerOrders = orders.filter((order: any) => order.customerName === customer.name || order.customerPhone === customer.phone);

      const totalOrders = customerOrders.length;
      const totalSpent = customerOrders
        .filter((order: any) => order.status === 'completed')
        .reduce((sum: number, order: any) => {
          // Calculate order total (simplified)
          return sum + (order.items?.length || 0) * 100; // Placeholder calculation
        }, 0);

      const lastOrderDate = customerOrders.length > 0 ? customerOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : null;

      return {
        ...customer,
        totalOrders,
        totalSpent,
        lastOrderDate,
      };
    });
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    if (!enrichedCustomers) return [];

    return enrichedCustomers.filter((customer: any) => {
      const matchesQuery =
        !query ||
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone?.includes(query) ||
        customer.city?.toLowerCase().includes(query.toLowerCase());

      return matchesQuery;
    });
  }, [enrichedCustomers, query]);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
    });
  };

  const createCustomer = async () => {
    if (!form.name.trim()) {
      alert('Customer name is required');
      return;
    }

    const payload = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };

    await window.api.db.create('customers', payload);
    setOpenCreate(false);
    resetForm();
    mutate('customers');
  };

  const updateCustomer = async () => {
    if (!selectedCustomer || !form.name.trim()) {
      alert('Customer name is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
    };

    await window.api.db.update('customers', selectedCustomer.id, payload);
    setEditMode(false);
    setOpenDetails(false);
    resetForm();
    mutate('customers');
  };

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    await window.api.db.delete('customers', customerId);
    mutate('customers');
  };

  const viewCustomerDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setOpenDetails(true);
    setEditMode(false);
  };

  const startEdit = (customer: any) => {
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
    });
    setEditMode(true);
  };

  if (loadingCustomers) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreate(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Customers</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active Customers</div>
          <div className="text-2xl font-bold text-green-600">{stats.withOrders}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-bold text-blue-600">Rs. {stats.totalRevenue.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Order Value</div>
          <div className="text-2xl font-bold text-purple-600">Rs. {stats.avgOrderValue.toFixed(2)}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Search customers by name, email, phone, or city..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!customers || filteredCustomers.length === 0 ? (
            <div className="text-center py-8 px-6">
              <div className="text-lg font-semibold mb-2">No customers found</div>
              <div className="text-sm text-muted-foreground">{query ? 'Try adjusting your search' : 'Add your first customer to get started'}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {customer.id.slice(-8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <MailIcon className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <PhoneIcon className="h-3 w-3 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.city && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPinIcon className="h-3 w-3 text-muted-foreground" />
                            {customer.city}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.totalOrders} orders</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">Rs. {customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>{customer.lastOrderDate ? dayjs(customer.lastOrderDate).format('MMM DD, YYYY') : <span className="text-muted-foreground">Never</span>}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewCustomerDetails(customer)}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              startEdit(customer);
                              setOpenDetails(true);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteCustomer(customer.id)} className="text-red-600 hover:text-red-700">
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Sheet */}
      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>Add New Customer</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="customer@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <SheetFooter className="mt-6 pt-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreate(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={createCustomer}>Add Customer</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Customer Details Sheet */}
      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>{editMode ? 'Edit Customer' : 'Customer Details'}</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <CustomerDetailsContent
              customer={selectedCustomer}
              orders={orders}
              editMode={editMode}
              form={form}
              setForm={setForm}
              onSave={updateCustomer}
              onEdit={() => startEdit(selectedCustomer)}
              onCancel={() => {
                setEditMode(false);
                resetForm();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetailsContent({
  customer,
  orders,
  editMode,
  form,
  setForm,
  onSave,
  onEdit,
  onCancel,
}: {
  customer: any;
  orders: any[];
  editMode: boolean;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const customerOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((order: any) => order.customerName === customer.name || order.customerPhone === customer.phone)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, customer]);

  if (editMode) {
    return (
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Name *</Label>
          <Input id="edit-name" placeholder="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input id="edit-email" type="email" placeholder="customer@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Phone</Label>
          <Input id="edit-phone" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address">Address</Label>
          <Textarea id="edit-address" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-city">City</Label>
          <Input id="edit-city" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Customer Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{customer.name}</h3>
              <div className="text-sm text-muted-foreground">Customer since {dayjs(customer.createdAt).format('MMM YYYY')}</div>
            </div>
          </div>
          <Button variant="outline" onClick={onEdit}>
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Email</div>
            <div className="font-medium">{customer.email || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div className="font-medium">{customer.phone || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">City</div>
            <div className="font-medium">{customer.city || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Orders</div>
            <div className="font-medium">{customer.totalOrders}</div>
          </div>
        </div>

        {customer.address && (
          <div>
            <div className="text-sm text-muted-foreground">Address</div>
            <div className="font-medium">{customer.address}</div>
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="space-y-4">
        <h4 className="font-semibold">Order History</h4>
        {customerOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No orders found for this customer</div>
        ) : (
          <div className="space-y-3">
            {customerOrders.slice(0, 10).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{order.orderId}</div>
                  <div className="text-sm text-muted-foreground">{dayjs(order.createdAt).format('MMM DD, YYYY HH:mm')}</div>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
            {customerOrders.length > 10 && <div className="text-center text-sm text-muted-foreground">And {customerOrders.length - 10} more orders...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
