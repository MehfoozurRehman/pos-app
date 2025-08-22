import { atomWithStorage } from 'jotai/utils';
import { orders } from './data';

export const cartVisibilityAtom = atomWithStorage('cartVisibility', true);

export const orderQueueVisibilityAtom = atomWithStorage('orderQueueVisibility', true);

export const cartAtom = atomWithStorage<(typeof orders)[number] | null>('cart', null);
