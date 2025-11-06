const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  openFiles: () => electron.ipcRenderer.invoke('dialog:openFiles'),
  processImage: (opts) => electron.ipcRenderer.invoke('image:process', opts),
  getAppLocale: () => electron.ipcRenderer.invoke('app:get-locale'),
} satisfies Window['electron']);