/// <reference types="vite/client" />
import { electronAPI } from '@electron-toolkit/preload';
import { DBSchema } from 'src/types';

type InvokeChannel = {
  'db:get': {
    args: keyof DBSchema;
    response: DBSchema[number];
  };
  'db:create': {
    args: [table: keyof DBSchema, item: DBSchema[keyof DBSchema]];
    response: DBSchema[keyof DBSchema];
  };
  'db:update': {
    args: [table: keyof DBSchema, id: string, patch: Partial<DBSchema[keyof DBSchema]>];
    response: DBSchema[keyof DBSchema] | null;
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
    electron: typeof electronAPI & {
      ipcRenderer: {
        invoke<T extends keyof DBSchema>(channel: 'db:get', table: T): Promise<DBSchema[T]>;
        invoke<T extends keyof DBSchema>(channel: 'db:create', table: T, item: DBSchema[T][number]): Promise<DBSchema[T][number]>;
        invoke<T extends keyof DBSchema>(channel: 'db:update', table: T, id: string, patch: Partial<DBSchema[T][number]>): Promise<DBSchema[T][number] | null>;
        invoke<T extends keyof DBSchema>(channel: 'db:delete', table: T, id: string): Promise<boolean>;
        invoke<C extends ChannelName>(channel: C, ...args: InvokeArgs<C>): Promise<InvokeResponse<C>>;
      };
    };
  }
}
