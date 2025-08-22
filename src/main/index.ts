import { BrowserWindow, app, ipcMain, shell, Tray, Menu, nativeImage, screen } from 'electron';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { DBSchema } from '../types.ts';
import { JSONFilePreset } from 'lowdb/node';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import icon from '../../resources/icon.png?asset';

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
      changes: [],
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
      preload: path.join(__dirname, '../preload/index.js'),
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
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    if (tray) return;
    const trayImg = typeof icon === 'string' ? nativeImage.createFromPath(icon) : nativeImage.createFromPath(path.join(__dirname, '../../resources/icon.png'));
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
    if (!Array.isArray(db.data[key])) {
      db.data[key] = [];
    }
    db.data[key].push(data);
    if (!Array.isArray(db.data.changes)) {
      db.data.changes = [];
    }
    db.data.changes.push({
      id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      table: key as string,
      action: 'create',
      itemId: data && data.id ? data.id : '',
      timestamp: new Date().toISOString(),
      data,
    });
    await db.write();
    return data;
  });

  ipcMain.handle('db:update', async (_event, key: keyof DBSchema, id: string, patch: any) => {
    const table = db.data[key] as any[];
    const idx = table.findIndex((t) => t && (t as any).id === id);
    if (idx === -1) return null;
    const before = { ...(table[idx] || {}) };
    table[idx] = { ...(table[idx] || {}), ...patch };
    const after = table[idx];
    db.data.changes.push({
      id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      table: key as string,
      action: 'update',
      itemId: id,
      timestamp: new Date().toISOString(),
      data: { before, after, patch },
    });
    await db.write();
    return after;
  });

  ipcMain.handle('db:delete', async (_event, key: keyof DBSchema, id: string) => {
    const table = db.data[key] as any[];
    const initialLen = table.length;
    const itemToDelete = table.find((t) => t && (t as any).id === id);
    db.data[key] = table.filter((t) => !(t && (t as any).id === id)) as any;
    const changed = db.data[key].length !== initialLen;
    if (changed) {
      db.data.changes.push({
        id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        table: key as string,
        action: 'delete',
        itemId: id,
        timestamp: new Date().toISOString(),
        data: itemToDelete,
      });
      await db.write();
    }
    return changed;
  });

  ipcMain.handle('db:changes-since', async (_event, sinceIso: string, table?: string) => {
    const since = new Date(sinceIso);
    if (Number.isNaN(since.getTime())) return [];

    const raw = (db.data.changes || [])
      .filter((c) => {
        const t = new Date(c.timestamp);
        if (isNaN(t.getTime())) return false;
        if (t <= since) return false;
        if (table && c.table !== table) return false;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    type ChangeEntry = {
      id: string;
      table: string;
      action: 'create' | 'update' | 'delete';
      itemId: string;
      timestamp: string;
      data?: any;
    };

    const groups = new Map<string, ChangeEntry[]>();
    for (const c of raw as ChangeEntry[]) {
      const key = `${c.table}::${c.itemId || c.id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }

    const condensed: ChangeEntry[] = [];
    for (const [, seq] of groups) {
      const last = seq[seq.length - 1];
      const hadCreate = seq.some((s) => s.action === 'create');

      if (last.action === 'delete' && hadCreate) {
        continue;
      }

      if (last.action === 'delete') {
        condensed.push({
          id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          table: last.table,
          action: 'delete',
          itemId: last.itemId,
          timestamp: last.timestamp,
          data: last.data,
        });
        continue;
      }

      if (last.action === 'create') {
        condensed.push({
          id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          table: last.table,
          action: 'create',
          itemId: last.itemId,
          timestamp: last.timestamp,
          data: last.data,
        });
        continue;
      }

      if (last.action === 'update') {
        if (hadCreate) {
          const finalAfter =
            [...seq].reverse().find((s) => s.action === 'update' && s.data && s.data.after)?.data.after || [...seq].reverse().find((s) => s.action === 'create')?.data || last.data?.after || last.data;

          condensed.push({
            id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            table: last.table,
            action: 'create',
            itemId: last.itemId,
            timestamp: last.timestamp,
            data: finalAfter,
          });
        } else {
          const firstBefore = seq.find((s) => s.action === 'update' && s.data && s.data.before)?.data.before || seq[0].data?.before || null;
          const lastAfter = [...seq].reverse().find((s) => s.action === 'update' && s.data && s.data.after)?.data.after || last.data?.after || last.data;

          condensed.push({
            id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            table: last.table,
            action: 'update',
            itemId: last.itemId,
            timestamp: last.timestamp,
            data: { before: firstBefore, after: lastAfter },
          });
        }
      }
    }

    return condensed;
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
