import Link from 'next/link';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export default async function ShopsPage() {
  const shops = await fetchQuery(api.shops.listShops, undefined);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Shops</h2>
      <div className="grid gap-3">
        {shops.length === 0 && <div>No shops yet.</div>}
        {shops.map((s) => (
          <Link key={s._id} href={`/dashboard/shops/${s._id}`} className="p-4 border rounded hover:shadow">
            <div className="flex items-center gap-4">
              <img src={s.logo || '/file.svg'} alt={s.name} className="w-12 h-12 object-cover rounded" />
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.location}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
