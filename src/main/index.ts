import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen, shell } from 'electron';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import fs from 'fs';
import path from 'path';

import { dbModule } from './db.ts';
import icon from '../../resources/icon.png?asset';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

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

  await dbModule();
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

  // Image handling
  ipcMain.handle('save-image', async (_, buffer: Buffer, filename: string) => {
    try {
      // Get the database directory (same as where db.json is stored)
      const dbPath = path.join(app.getPath('userData'), 'db.json');
      const dbDir = path.dirname(dbPath);
      const imagesDir = path.join(dbDir, 'images');

      // Create images directory if it doesn't exist
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Save the image file
      const imagePath = path.join(imagesDir, filename);
      fs.writeFileSync(imagePath, buffer);

      // Return the relative path for storage in database
      return `images/${filename}`;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  });

  ipcMain.handle('get-image-path', async (_, relativePath: string) => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'db.json');
      const dbDir = path.dirname(dbPath);
      const fullPath = path.join(dbDir, relativePath);

      if (fs.existsSync(fullPath)) {
        return `file://${fullPath}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting image path:', error);
      return null;
    }
  });

  ipcMain.handle('get-images-for-sync', async () => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'db.json');
      const dbDir = path.dirname(dbPath);
      const imagesDir = path.join(dbDir, 'images');

      if (!fs.existsSync(imagesDir)) {
        return [];
      }

      const imageFiles = fs.readdirSync(imagesDir);
      const images = imageFiles.map((filename) => {
        const fullPath = path.join(imagesDir, filename);
        const buffer = fs.readFileSync(fullPath);
        return {
          filename,
          relativePath: `images/${filename}`,
          buffer: buffer.toString('base64'),
          size: buffer.length,
        };
      });

      return images;
    } catch (error) {
      console.error('Error getting images for sync:', error);
      return [];
    }
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
