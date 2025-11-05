const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  openFiles: () => electron.ipcRenderer.invoke('dialog:openFiles'),
  processImage: (opts) => electron.ipcRenderer.invoke('image:process', opts),
} satisfies Window['electron']);