import type { DBSchema, Log } from 'src/types';

import { JSONFile } from 'lowdb/node';
import { Low } from 'lowdb';
import crypto from 'crypto';
import fs from 'fs/promises';
import { ipcMain } from 'electron';
import { logger } from './logger';
import os from 'os';
import path from 'path';

const homeDir = os.homedir();
const appDataDir = path.join(homeDir, 'pos-app-data');
const mediaDir = path.join(appDataDir, 'media');

const obfSuffix = crypto.createHash('sha256').update(appDataDir).digest('hex').slice(0, 8);
const OBFUSCATED_DB_FILE_NAME = `.pos_${obfSuffix}.local`;
const dbFile = path.join(appDataDir, OBFUSCATED_DB_FILE_NAME);

let dbInstance: Low<DBSchema> | null = null;

const DEFAULT_DB: DBSchema = {
  notes: [],
  products: [],
  inventory: [],
  orders: [],
  shop: null,
  logs: [],
  changes: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function getDb(): Promise<Low<DBSchema>> {
  if (dbInstance) return dbInstance;

  try {
    await fs.mkdir(appDataDir, { recursive: true });
    await fs.mkdir(mediaDir, { recursive: true });
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

  logger.setDbInstance(db);

  const genId = (prefix = '') => `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const safeWrite = async () => {
    writeQueue = writeQueue.then(async () => {
      try {
        await db.write();
      } catch (err) {
        logger.error('Database write failed', 'db-write', err);
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

  ipcMain.removeHandler('log:create');

  ipcMain.handle('log:create', async (_event, logData: Omit<Log, 'id'>) => {
    try {
      const log: Log = {
        ...logData,
        id: genId('log_'),
      };

      if (!db.data.logs) db.data.logs = [];
      db.data.logs.push(log);
      await safeWrite();
      return log;
    } catch (err) {
      console.error('log:create error', err);
      throw err;
    }
  });

  ipcMain.removeHandler('log:get');
  ipcMain.handle('log:get', async (_event, options?: { level?: string; limit?: number; since?: string }) => {
    try {
      let logs = db.data.logs || [];

      if (options?.level) {
        logs = logs.filter((log) => log.level === options.level);
      }

      if (options?.since) {
        const sinceDate = new Date(options.since);
        logs = logs.filter((log) => new Date(log.timestamp) > sinceDate);
      }

      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (options?.limit) {
        logs = logs.slice(0, options.limit);
      }

      return JSON.parse(JSON.stringify(logs));
    } catch (err) {
      logger.error('Failed to get logs', 'log-get', err);
      throw err;
    }
  });

  ipcMain.removeHandler('log:cleanup');
  ipcMain.handle('log:cleanup', async (_event, daysToKeep: number = 30) => {
    try {
      await logger.cleanup(daysToKeep);
      return true;
    } catch (err) {
      logger.error('Failed to cleanup logs', 'log-cleanup', err);
      throw err;
    }
  });

  ipcMain.removeHandler('db:get');
  ipcMain.handle('db:get', async (_event, key: keyof DBSchema) => {
    try {
      validateKey(key);
      return JSON.parse(JSON.stringify(db.data[key]));
    } catch (err) {
      logger.error('Database get operation failed', 'db-get', { key, error: err });
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
      logger.error('Database create operation failed', 'db-create', { key, data, error: err });
      throw err;
    }
  });

  ipcMain.removeHandler('db:update');
  ipcMain.handle('db:update', async (_event, key: keyof DBSchema, id: string, patch: any) => {
    try {
      validateKey(key);
      
      // For shop table, ID is optional since there's only one shop
      if (key !== 'shop' && !id) throw new Error('Missing id for update');
      if (!patch || typeof patch !== 'object') throw new Error('Invalid patch for update');

      if (key === ('shop' as keyof DBSchema)) {
        const before = db.data.shop ? { ...(db.data.shop as any) } : null;
        // If no existing shop data, create new shop entry
        if (!before) {
          db.data.shop = { ...patch } as any;
        } else {
          db.data.shop = { ...(db.data.shop as any), ...patch } as any;
        }
        const after = db.data.shop as any;
        db.data.changes.push({
          id: genId('chg_'),
          table: String(key),
          action: before ? 'update' : 'create',
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
      logger.error('Database update operation failed', 'db-update', { key, id, patch, error: err });
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
      logger.error('Database delete operation failed', 'db-delete', { key, id, error: err });
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
      logger.error('Database changes-since operation failed', 'db-changes-since', { sinceIso, table, error: err });
      throw err;
    }
  });

  ipcMain.removeHandler('media:save');
  ipcMain.handle('media:save', async (_event, data: Buffer | Uint8Array, filename: string) => {
    try {
      logger.info('Media save operation started', 'media-save', {
        dataType: data?.constructor?.name,
        dataLength: data?.length,
        filename,
      });

      if (!data || !filename) {
        throw new Error('Invalid data or filename');
      }

      await fs.mkdir(mediaDir, { recursive: true });

      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      logger.debug('Buffer created for media save', 'media-save', { bufferSize: buffer.length });

      const ext = path.extname(filename);
      const name = path.basename(filename, ext);
      const uniqueId = genId();
      const uniqueFilename = `${name}_${uniqueId}${ext}`;
      const filePath = path.join(mediaDir, uniqueFilename);

      logger.debug('Writing media file', 'media-save', { filePath });
      await fs.writeFile(filePath, buffer);
      logger.info('Media file saved successfully', 'media-save', { filename: uniqueFilename });

      return uniqueFilename;
    } catch (err) {
      logger.error('Media save operation failed', 'media-save', { filename, error: err });
      throw err;
    }
  });

  ipcMain.removeHandler('media:get');
  ipcMain.handle('media:get', async (_event, filename: string) => {
    try {
      if (!filename) {
        throw new Error('Invalid filename');
      }

      const filePath = path.join(mediaDir, filename);

      try {
        await fs.access(filePath);
      } catch {
        throw new Error('File not found');
      }

      const buffer = await fs.readFile(filePath);
      return buffer;
    } catch (err) {
      logger.error('Media get operation failed', 'media-get', { filename, error: err });
      throw err;
    }
  });

  ipcMain.removeHandler('media:delete');
  ipcMain.handle('media:delete', async (_event, filename: string) => {
    try {
      if (!filename) {
        throw new Error('Invalid filename');
      }

      const filePath = path.join(mediaDir, filename);

      try {
        await fs.unlink(filePath);
        return true;
      } catch (err) {
        logger.error('Failed to delete media file', 'media-delete', { filename, error: err });
        return false;
      }
    } catch (err) {
      logger.error('Media delete operation failed', 'media-delete', { filename, error: err });
      throw err;
    }
  });

  ipcMain.removeHandler('media:get-url');
  ipcMain.handle('media:get-url', async (_event, filename: string) => {
    try {
      logger.debug('Media get-url operation started', 'media-get-url', { filename });

      if (!filename) {
        logger.warn('No filename provided for media get-url', 'media-get-url');
        return null;
      }

      const filePath = path.join(mediaDir, filename);
      logger.debug('Resolving media file path', 'media-get-url', { filePath });

      try {
        await fs.access(filePath);
        logger.debug('Media file exists, reading for URL generation', 'media-get-url', { filename });

        const buffer = await fs.readFile(filePath);

        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'application/octet-stream';

        switch (ext) {
          case '.jpg':
          case '.jpeg':
            mimeType = 'image/jpeg';
            break;
          case '.png':
            mimeType = 'image/png';
            break;
          case '.gif':
            mimeType = 'image/gif';
            break;
          case '.webp':
            mimeType = 'image/webp';
            break;
          case '.svg':
            mimeType = 'image/svg+xml';
            break;
        }

        const base64 = buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;

        logger.debug('Generated data URL for media file', 'media-get-url', { filename, dataUrlLength: dataUrl.length });
        return dataUrl;
      } catch (accessErr) {
        logger.warn('Media file does not exist', 'media-get-url', { filename, error: accessErr });
        return null;
      }
    } catch (err) {
      logger.error('Media get-url operation failed', 'media-get-url', { filename, error: err });
      return null;
    }
  });
};
