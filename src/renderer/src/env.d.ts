/// <reference types="vite/client" />
import type { IpcRenderer } from 'electron';
import type { DBSchema } from 'src/types';

type InvokeChannel = {
  'db:get': {
    args: [table: keyof DBSchema];
    response: DBSchema[keyof DBSchema];
  };
  'db:create': {
    args: [table: keyof DBSchema, item: DBSchema[keyof DBSchema][number]];
    response: DBSchema[keyof DBSchema][number];
  };
  'db:update': {
    args: [table: keyof DBSchema, id: string, patch: Partial<DBSchema[keyof DBSchema][number]>];
    response: DBSchema[keyof DBSchema][number] | null;
  };
  'db:delete': {
    args: [table: keyof DBSchema, id: string];
    response: boolean;
  };
};

type ChannelName = keyof InvokeChannel;

type InvokeArgs<C extends ChannelName> = InvokeChannel[C] extends { args: infer A } ? A : never;
type InvokeResponse<C extends ChannelName> = InvokeChannel[C] extends { response: infer R } ? R : never;

declare global {
  interface Window {
    electron: {
      // keep existing ipcRenderer members except "invoke", which we type precisely here
      ipcRenderer: Omit<IpcRenderer, 'invoke'> & {
        invoke(channel: 'db:get', table: keyof DBSchema): Promise<DBSchema[keyof DBSchema]>;
        invoke<T extends keyof DBSchema>(channel: 'db:create', table: T, item: DBSchema[T][number]): Promise<DBSchema[T][number]>;
        invoke<T extends keyof DBSchema>(channel: 'db:update', table: T, id: string, patch: Partial<DBSchema[T][number]>): Promise<DBSchema[T][number] | null>;
        invoke(channel: 'db:delete', table: keyof DBSchema, id: string): Promise<boolean>;
  // generic fallback: rest param must be an array type; use unknown[] to satisfy TS
  invoke<C extends ChannelName>(channel: C, ...args: unknown[]): Promise<InvokeResponse<C>>;
      };
    };
  }
}

export {};
