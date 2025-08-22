import { BrowserWindow, app, ipcMain, shell, Tray, Menu, nativeImage } from 'electron';
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

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

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

  mainWindow = new BrowserWindow({
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
    mainWindow?.show();
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    if (tray) return;
    const trayImg = typeof icon === 'string' ? nativeImage.createFromPath(icon) : nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'));
    tray = new Tray(trayImg);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('pos-app');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.error('Failed to create tray', err);
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
  createTray();

  ipcMain.handle('app:show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
    return true;
  });

  ipcMain.handle('app:quit', () => {
    isQuitting = true;
    app.quit();
    return true;
  });

  app.on('activate', function () {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
