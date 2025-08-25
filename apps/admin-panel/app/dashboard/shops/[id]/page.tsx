import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export default async function ShopShow({ params }: { params: Promise<{ id: Id<'shops'> }> }) {
  const { id } = await params;

  const shop = await fetchQuery(api.shops.getShop, { id });

  if (!shop) {
    return <div className="p-6">Shop not found</div>;
  }

  const payments = await fetchQuery(api.payments.getPaymentsForShop, { shopId: id });

  return (
    <div className="p-6">
      <div className="flex items-center gap-4">
        <img src={shop.logo || '/file.svg'} alt={shop.name} className="w-16 h-16 rounded object-cover" />
        <div>
          <h2 className="text-2xl font-semibold">{shop.name}</h2>
          <div className="text-sm text-muted-foreground">Owner: {shop.owner}</div>
          <div className="text-sm text-muted-foreground">Location: {shop.location}</div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-medium">Payments</h3>
        {payments.length === 0 && <div className="text-sm text-muted-foreground">No payments</div>}
        <ul className="mt-2 space-y-2">
          {payments.map((p) => (
            <li key={p._id} className="p-2 border rounded">
              {p.month} / {p.year}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
