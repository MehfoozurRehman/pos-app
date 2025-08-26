import useSWR from "swr";

export default function useShop() {
    const { data: shop } = useSWR('shop', () => window.api.db.get('shop'));

    const inventoryMode = shop?.inventoryMode || 'barcode';

    return {
        ...shop,
        inventoryMode
    }
  }
  