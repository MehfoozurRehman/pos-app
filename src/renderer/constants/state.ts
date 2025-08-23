import { Order } from 'src/types';
import { atomWithStorage } from 'jotai/utils';

export const cartVisibilityAtom = atomWithStorage('cartVisibility', true);

export const orderQueueVisibilityAtom = atomWithStorage('orderQueueVisibility', true);

// cart can hold an Order-like object from the DB; keep it unopinionated (any)
export const cartAtom = atomWithStorage<Order | null>('cart', null);
