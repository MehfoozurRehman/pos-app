import type { DBSchema } from 'src/types';
import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import fs from 'fs/promises';
import { ipcMain } from 'electron';
import os from 'os';
import path from 'path';

const homeDir = os.homedir();
const appDataDir = path.join(homeDir, 'pos-app-data');
const dbFile = path.join(appDataDir, 'db.json');

let dbInstance: Low<DBSchema> | null = null;

const DEFAULT_DB: DBSchema = {
  notes: [],
  products: [],
  inventory: [],
  orders: [],
  shop: null,
  changes: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function getDb(): Promise<Low<DBSchema>> {
  if (dbInstance) return dbInstance;

  try {
    await fs.mkdir(appDataDir, { recursive: true });
  } catch (err) {
    console.error('Failed to ensure app data directory exists', err);
    throw err;
  }

  const adapter = new JSONFile<DBSchema>(dbFile);
  const db = new Low<DBSchema>(adapter, DEFAULT_DB as unknown as DBSchema);
  try {
    await db.read();
  } catch (err) {
    console.error('Failed to read db file, continuing with defaults', err);
  }

  if (!db.data) db.data = { ...DEFAULT_DB } as DBSchema;

  dbInstance = db;
  return dbInstance;
}

export const dbModule = async () => {
  const db = await getDb();

  const genId = (prefix = '') => `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const safeWrite = async () => {
    writeQueue = writeQueue.then(async () => {
      try {
        await db.write();
      } catch (err) {
        console.error('db.write() failed', err);
        throw err;
      }
    });
    return writeQueue;
  };

  const validateKey = (key: any): boolean => {
    if (!db.data || !(key in db.data)) {
      throw new Error(`Invalid DB key: ${String(key)}`);
    }
    return true;
  };

  ipcMain.removeHandler('db:get');
  ipcMain.handle('db:get', async (_event, key: keyof DBSchema) => {
    try {
      validateKey(key);
      return JSON.parse(JSON.stringify(db.data[key]));
    } catch (err) {
      console.error('db:get error', err);
      throw err;
    }
  });

  ipcMain.removeHandler('db:create');
  ipcMain.handle('db:create', async (_event, key: keyof DBSchema, data: any) => {
    try {
      validateKey(key);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data for create');
      }

      if (key === ('shop' as keyof DBSchema)) {
        if (data.shopId && !data.id) data.id = data.shopId;
        if (!data.createdAt) data.createdAt = new Date().toISOString();
        if (!data.id) data.id = genId('shop_');
        db.data.shop = { ...(db.data.shop as any), ...data } as any;
      } else {
        if (!Array.isArray(db.data[key])) db.data[key] = [] as any;
        if (!data.id) data.id = genId();
        (db.data[key] as any[]).push(data);
      }

      if (!Array.isArray(db.data.changes)) db.data.changes = [];
      const change = {
        id: genId('chg_'),
        table: String(key),
        action: 'create' as const,
        itemId: data.id || '',
        timestamp: new Date().toISOString(),
        data,
      };
      db.data.changes.push(change);
      await safeWrite();
      return JSON.parse(JSON.stringify(data));
    } catch (err) {
      console.error('db:create error', err);
      throw err;
    }
  });

  ipcMain.removeHandler('db:update');
  ipcMain.handle('db:update', async (_event, key: keyof DBSchema, id: string, patch: any) => {
    try {
      validateKey(key);
      if (!id) throw new Error('Missing id for update');
      if (!patch || typeof patch !== 'object') throw new Error('Invalid patch for update');

      if (key === ('shop' as keyof DBSchema)) {
        const before = db.data.shop ? { ...(db.data.shop as any) } : null;
        if (!before) return null;
        db.data.shop = { ...(db.data.shop as any), ...patch } as any;
        const after = db.data.shop as any;
        db.data.changes.push({
          id: genId('chg_'),
          table: String(key),
          action: 'update',
          itemId: after.id || after.shopId || '',
          timestamp: new Date().toISOString(),
          data: { before, after, patch },
        });
        await safeWrite();
        return JSON.parse(JSON.stringify(after));
      }

      const table = Array.isArray(db.data[key]) ? (db.data[key] as any[]) : [];
      const idx = table.findIndex((t) => t && (t as any).id === id);
      if (idx === -1) return null;
      const before = { ...(table[idx] || {}) };
      table[idx] = { ...(table[idx] || {}), ...patch };
      const after = table[idx];
      db.data.changes.push({
        id: genId('chg_'),
        table: String(key),
        action: 'update',
        itemId: id,
        timestamp: new Date().toISOString(),
        data: { before, after, patch },
      });
      await safeWrite();
      return JSON.parse(JSON.stringify(after));
    } catch (err) {
      console.error('db:update error', err);
      throw err;
    }
  });

  ipcMain.removeHandler('db:delete');
  ipcMain.handle('db:delete', async (_event, key: keyof DBSchema, id: string) => {
    try {
      validateKey(key);
      if (key === ('shop' as keyof DBSchema)) {
        const itemToDelete = db.data.shop;
        if (!itemToDelete) return false;
        db.data.shop = null;
        db.data.changes.push({
          id: genId('chg_'),
          table: String(key),
          action: 'delete',
          itemId: (itemToDelete as any).id || (itemToDelete as any).shopId || '',
          timestamp: new Date().toISOString(),
          data: itemToDelete,
        });
        await safeWrite();
        return true;
      }

      const table = Array.isArray(db.data[key]) ? (db.data[key] as any[]) : [];
      const initialLen = table.length;
      const itemToDelete = table.find((t) => t && (t as any).id === id);
      const newTable = table.filter((t) => !(t && (t as any).id === id));
      db.data[key] = newTable as any;
      const changed = newTable.length !== initialLen;
      if (changed) {
        db.data.changes.push({
          id: genId('chg_'),
          table: String(key),
          action: 'delete',
          itemId: id,
          timestamp: new Date().toISOString(),
          data: itemToDelete,
        });
        await safeWrite();
      }
      return changed;
    } catch (err) {
      console.error('db:delete error', err);
      throw err;
    }
  });

  ipcMain.removeHandler('db:changes-since');
  ipcMain.handle('db:changes-since', async (_event, sinceIso: string, table?: string) => {
    try {
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
            id: genId('chg_'),
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
            id: genId('chg_'),
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
              [...seq].reverse().find((s) => s.action === 'update' && s.data && s.data.after)?.data.after ||
              [...seq].reverse().find((s) => s.action === 'create')?.data ||
              last.data?.after ||
              last.data;

            condensed.push({
              id: genId('chg_'),
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
              id: genId('chg_'),
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
    } catch (err) {
      console.error('db:changes-since error', err);
      throw err;
    }
  });
};
