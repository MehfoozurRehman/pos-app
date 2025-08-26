import type { IpcRenderer } from 'electron';
import type { DBSchema, Log } from 'src/types';

type TableItem<K extends keyof DBSchema> = DBSchema[K] extends Array<infer U> ? U : DBSchema[K];

type InvokeChannel = {
  'db:get': {
    args: [table: keyof DBSchema];
    response: DBSchema[keyof DBSchema];
  };
  'db:create': {
    args: [table: keyof DBSchema, item: TableItem<keyof DBSchema>];
    response: TableItem<keyof DBSchema>;
  };
  'db:update': {
    args: [table: keyof DBSchema, id: string, patch: Partial<TableItem<keyof DBSchema>>];
    response: TableItem<keyof DBSchema> | null;
  };
  'db:delete': {
    args: [table: keyof DBSchema, id: string];
    response: boolean;
  };
  'db:changes-since': {
    args: [sinceIso: string, table?: string];
    response: {
      id: string;
      table: string;
      action: 'create' | 'update' | 'delete';
      itemId: string;
      timestamp: string;
      data?: any;
    }[];
  };
};

type ChannelName = keyof InvokeChannel;

type InvokeArgs<C extends ChannelName> = InvokeChannel[C] extends { args: infer A } ? A : never;
type InvokeResponse<C extends ChannelName> = InvokeChannel[C] extends { response: infer R } ? R : never;

export interface PreloadAPI {
  app: {
    show: () => Promise<boolean>;
    reallyQuit: () => Promise<boolean>;
  };
  db: {
    get: <T extends keyof DBSchema>(table: T) => Promise<DBSchema[T]>;
    create: <T extends keyof DBSchema>(table: T, item: Omit<TableItem<T>, 'id'>) => Promise<TableItem<T>>;
    update: {
      <T extends keyof DBSchema>(table: T extends 'shop' ? never : T, id: string, patch: Partial<TableItem<T>>): Promise<TableItem<T> | null>;
      (table: 'shop', patch: Partial<TableItem<'shop'>>): Promise<TableItem<'shop'> | null>;
      (table: 'shop', id: string, patch: Partial<TableItem<'shop'>>): Promise<TableItem<'shop'> | null>;
    };
    delete: (table: keyof DBSchema, id: string) => Promise<boolean>;
    changesSince: (
      sinceIso: string,
      table?: string,
    ) => Promise<
      {
        id: string;
        table: string;
        action: 'create' | 'update' | 'delete';
        itemId: string;
        timestamp: string;
        data?: any;
      }[]
    >;
  };
  media: {
    save: (data: Buffer | Uint8Array, filename: string) => Promise<string>;
    get: (filename: string) => Promise<Buffer>;
    delete: (filename: string) => Promise<boolean>;
    getUrl: (filename: string) => Promise<string | null>;
  };
  log: {
    create: (logData: Omit<Log, 'id'>) => Promise<Log>;
    get: (options?: { level?: string; limit?: number; since?: string }) => Promise<Log[]>;
    cleanup: (daysToKeep?: number) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: Omit<IpcRenderer, 'invoke'> & {
        invoke<T extends keyof DBSchema>(channel: 'db:get', table: T): Promise<DBSchema[T]>;
        invoke<T extends keyof DBSchema>(channel: 'db:create', table: T, item: TableItem<T>): Promise<TableItem<T>>;
        invoke<T extends keyof DBSchema>(channel: 'db:update', table: T, id: string, patch: Partial<TableItem<T>>): Promise<TableItem<T> | null>;
        invoke(channel: 'db:delete', table: keyof DBSchema, id: string): Promise<boolean>;
        invoke<C extends ChannelName>(channel: C, ...args: unknown[]): Promise<InvokeResponse<C>>;
      };
    };
    api: PreloadAPI;
  }
}

export {};
