import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

const api = {};

// Don't redeclare the global `Window.electron` type here — the renderer's
// ambient `env.d.ts` already augments `Window`. Use runtime-safe `any`
// assignments when not exposing via the context bridge to avoid type conflicts.
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
