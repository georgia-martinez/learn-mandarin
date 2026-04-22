const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  loadCards: () => ipcRenderer.invoke('cards:load'),
  saveCards: (cards) => ipcRenderer.invoke('cards:save', cards),
  loadDecks: () => ipcRenderer.invoke('decks:load-all'),
  saveDeck: (deck) => ipcRenderer.invoke('decks:save', deck),
  deleteDeck: (deckId) => ipcRenderer.invoke('decks:delete', deckId),
})
