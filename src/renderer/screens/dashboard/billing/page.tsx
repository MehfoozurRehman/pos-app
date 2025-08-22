import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Billing() {
  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <div className="grid gap-4 @[900px]:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="font-medium">POS Pro</div>
              <div className="text-muted-foreground text-sm">Unlimited devices, offline-first, priority support</div>
            </div>
            <Badge variant="secondary">Rs. 3,999 / month</Badge>
            <div className="flex gap-2">
              <Button>Upgrade</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="card">Card Number</Label>
              <Input id="card" placeholder="**** **** **** 1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" placeholder="MM/YY" />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="***" />
              </div>
            </div>
            <Button className="w-fit">Save</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
