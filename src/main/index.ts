import { BrowserWindow, app, ipcMain, shell } from 'electron';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { DBSchema } from '../types.ts';
import { JSONFilePreset } from 'lowdb/node';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import icon from '../../resources/icon.png?asset';
import { join } from 'path';

const { screen } = require('electron');

const homeDir = os.homedir();

const appDataDir = path.join(homeDir, 'pos-app-data');

const dbFile = path.join(appDataDir, 'db.json');

let dbInstance: Awaited<ReturnType<typeof JSONFilePreset<DBSchema>>> | null = null;

async function getDb(): Promise<Awaited<ReturnType<typeof JSONFilePreset<DBSchema>>>> {
  if (!dbInstance) {
    try {
      await fs.access(appDataDir);
    } catch {
      await fs.mkdir(appDataDir, { recursive: true });
    }
    dbInstance = await JSONFilePreset<DBSchema>(dbFile, {
      notes: [],
      users: [],
      products: [],
      inventory: [],
      orders: [],
      payments: [],
    });
  }
  return dbInstance;
}

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const db = await getDb();

  ipcMain.handle('db:get', async (_event, key: keyof DBSchema) => {
    return db.data[key];
  });

  ipcMain.handle('db:create', async (_event, key: keyof DBSchema, data: any) => {
    await db.data[key].push(data);
    await db.write();
    return data;
  });

  ipcMain.handle('db:update', async (_event, key: keyof DBSchema, id: string, patch: any) => {
    const table = db.data[key] as any[];
    const idx = table.findIndex((t) => t && (t as any).id === id);
    if (idx === -1) return null;
    table[idx] = { ...(table[idx] || {}), ...patch };
    await db.write();
    return table[idx];
  });

  ipcMain.handle('db:delete', async (_event, key: keyof DBSchema, id: string) => {
    const table = db.data[key] as any[];
    const initialLen = table.length;
    db.data[key] = table.filter((t) => !(t && (t as any).id === id)) as any;
    const changed = db.data[key].length !== initialLen;
    if (changed) await db.write();
    return changed;
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
