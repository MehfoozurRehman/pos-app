'use client';

import { api } from '@/convex/_generated/api';
import { useQueryWithStatus } from '@/hooks/use-query';

export default function PaymentsPage() {
  const { data: payments = [] } = useQueryWithStatus(api.payments.listPayments, undefined);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Payments</h2>
      <ul className="space-y-2">
        {payments.map((p) => (
          <li key={p._id} className="p-3 border rounded flex justify-between">
            <div>
              <div className="font-medium">Shop: {String(p.shop)}</div>
              <div className="text-sm text-muted-foreground">
                {p.month} / {p.year}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
