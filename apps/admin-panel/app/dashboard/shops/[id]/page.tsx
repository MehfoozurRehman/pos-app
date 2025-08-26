'use client';

import { Id } from '@/convex/_generated/dataModel';
import { ShopDetailsView } from './components/shop-details-view';

export default function ShopDetailsPage({ searchParams }: { searchParams: Promise<{ id: Id<'shops'> }> }) {
  return (
    <div className="p-6 space-y-6">
      <ShopDetailsView searchParams={searchParams} />
    </div>
  );
}
