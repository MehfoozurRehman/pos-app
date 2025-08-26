import { contextBridge, ipcRenderer } from 'electron';

import { electronAPI } from '@electron-toolkit/preload';

const api = {
  app: {
    show: async () => {
      return await ipcRenderer.invoke('app:show');
    },
    reallyQuit: async () => {
      return await ipcRenderer.invoke('app:quit');
    },
  },
  db: {
    get: async (table: string) => {
      return await ipcRenderer.invoke('db:get', table);
    },
    create: async (table: string, item: any) => {
      return await ipcRenderer.invoke('db:create', table, item);
    },
    update: async (table: string, ...args: any[]) => {
      // For shop table, ID is optional
      if (table === 'shop') {
        if (args.length === 1) {
          // Called with just patch: update('shop', patch)
          return await ipcRenderer.invoke('db:update', table, null, args[0]);
        } else {
          // Called with id and patch: update('shop', id, patch)
          return await ipcRenderer.invoke('db:update', table, args[0], args[1]);
        }
      } else {
        // For other tables, ID is required
        return await ipcRenderer.invoke('db:update', table, args[0], args[1]);
      }
    },
    delete: async (table: string, id: string) => {
      return await ipcRenderer.invoke('db:delete', table, id);
    },
    changesSince: async (sinceIso: string, table?: string) => {
      return await ipcRenderer.invoke('db:changes-since', sinceIso, table);
    },
  },
  media: {
    save: async (data: Buffer | Uint8Array, filename: string) => {
      return await ipcRenderer.invoke('media:save', data, filename);
    },
    get: async (filename: string) => {
      return await ipcRenderer.invoke('media:get', filename);
    },
    delete: async (filename: string) => {
      return await ipcRenderer.invoke('media:delete', filename);
    },
    getUrl: async (filename: string) => {
      return await ipcRenderer.invoke('media:get-url', filename);
    },
  },
  log: {
    create: async (logData: any) => {
      return await ipcRenderer.invoke('log:create', logData);
    },
    get: async (options?: { level?: string; limit?: number; since?: string }) => {
      return await ipcRenderer.invoke('log:get', options);
    },
    cleanup: async (daysToKeep?: number) => {
      return await ipcRenderer.invoke('log:cleanup', daysToKeep);
    },
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error('Failed to expose APIs to renderer:', error);
  }
} else {
  (window as any).electron = electronAPI;
  (window as any).api = api;
}
