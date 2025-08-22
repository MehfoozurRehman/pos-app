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
    update: async (table: string, id: string, patch: any) => {
      return await ipcRenderer.invoke('db:update', table, id, patch);
    },
    delete: async (table: string, id: string) => {
      return await ipcRenderer.invoke('db:delete', table, id);
    },
    changesSince: async (sinceIso: string, table?: string) => {
      return await ipcRenderer.invoke('db:changes-since', sinceIso, table);
    },
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as any).electron = electronAPI;
  (window as any).api = api;
}
