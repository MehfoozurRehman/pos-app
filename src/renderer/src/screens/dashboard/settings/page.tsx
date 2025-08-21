import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  return (
    <div className="px-4 lg:px-6 py-4">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="grid gap-4 @[900px]:grid-cols-2">
          <Card>
            <CardContent className="p-4 grid gap-3">
              <div>
                <Label htmlFor="shop">Shop Name</Label>
                <Input id="shop" placeholder="My Store" />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="PKR">
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-fit">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardContent className="p-4">Pair barcode scanners, printers, and cash drawers (UI TBD)</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-sm text-muted-foreground">Offline-first enabled. Data will sync when internet is available.</div>
              <Button variant="outline">Sync Now</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardContent className="p-4">Developer options, logs, reset local data (UI TBD)</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
