import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      app: {
        show: () => Promise<boolean>;
        reallyQuit: () => Promise<boolean>;
      };
      db: {
        get: (table: string) => Promise<any[]>;
        create: (table: string, item: any) => Promise<any>;
        update: (table: string, id: string, patch: any) => Promise<any>;
        delete: (table: string, id: string) => Promise<boolean>;
        changesSince: (sinceIso: string, table?: string) => Promise<any[]>;
      };
      saveImage: (file: File, filename: string) => Promise<string>;
      getImagePath: (relativePath: string) => Promise<string | null>;
      getImagesForSync: () => Promise<
        Array<{
          filename: string;
          relativePath: string;
          buffer: string;
          size: number;
        }>
      >;
    };
  }
}
