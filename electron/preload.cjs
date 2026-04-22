const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  loadCards: () => ipcRenderer.invoke('cards:load'),
  saveCards: (cards) => ipcRenderer.invoke('cards:save', cards),
})
