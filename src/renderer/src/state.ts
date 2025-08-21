import { atomWithStorage } from 'jotai/utils';

export const cartVisibilityAtom = atomWithStorage('cartVisibility', true);
export const orderQueueVisibilityAtom = atomWithStorage('orderQueueVisibility', true);
