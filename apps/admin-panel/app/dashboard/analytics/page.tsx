import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export default async function AnalyticsPage() {
  const counts = await fetchQuery(api.payments.paymentsCountPerShop, undefined);

  const entries = Object.entries(counts || {});

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">Payments per shop</h3>
          {entries.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          <ul className="space-y-2">
            {entries.map(([shopId, count]) => (
              <li key={shopId} className="flex justify-between">
                <span>Shop {shopId}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">Revenue chart (placeholder)</h3>
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Chart will go here</div>
        </div>
      </div>
    </div>
  );
}
