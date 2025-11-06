import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { processImage } from './imageProcessor.js';

app.on('ready', () => {
  Menu.setApplicationMenu(null);
  const mainWindow = new BrowserWindow({
    icon: './desktopIcon.png',
    webPreferences: {
      preload: getPreloadPath(),
      devTools: isDev(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        event.preventDefault();
      }
    });
  } else {
    mainWindow.loadFile(getUIPath());
  }

  ipcMain.handle('dialog:openFiles', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'avif'] }],
    });
    return res.filePaths;
  });

  ipcMain.handle('image:process', async (_event, opts) => {
      try {
      const res = await processImage(opts);
      return { success: true, data: res };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: { code: 'PROCESS_ERROR', message: message } };
    }
  });

  ipcMain.handle('app:get-locale', () => {
    return app.getLocale();
  });
});