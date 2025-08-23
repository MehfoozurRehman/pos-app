import { Order } from 'src/types';
import { atomWithStorage } from 'jotai/utils';

export const cartVisibilityAtom = atomWithStorage('cartVisibility', true);

export const orderQueueVisibilityAtom = atomWithStorage('orderQueueVisibility', true);

export const cartAtom = atomWithStorage<Order | null>('cart', null);
