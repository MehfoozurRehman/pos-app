import { useMemo } from 'react';
import useSWR from 'swr';

export default function useShop() {
  const { data: shop, isLoading } = useSWR('shop', () => window.api.db.get('shop'));

  const inventoryMode = shop?.inventoryMode || 'barcode';

  return useMemo(() => ({ ...shop, inventoryMode, isLoading }), [shop, inventoryMode, isLoading]);
}
