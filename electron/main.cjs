const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { randomUUID } = require('crypto')
const fs = require('fs').promises
const path = require('path')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const CARDS_FILENAME = 'flashcards.json'
const DECKS_INDEX_FILENAME = 'decks-index.json'
const DECKS_BACKUP_FILENAME = 'decks.git.json'

function cardsFilePath() {
  return path.join(app.getPath('userData'), CARDS_FILENAME)
}

function decksIndexPath() {
  return path.join(app.getPath('userData'), DECKS_INDEX_FILENAME)
}

function deckFilePath(deckId) {
  return path.join(app.getPath('userData'), `deck-${deckId}.json`)
}

function decksBackupPath() {
  return path.join(__dirname, '..', DECKS_BACKUP_FILENAME)
}

async function handleLoadCards() {
  const filePath = cardsFilePath()
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return []
    }
    console.error('Failed to load flashcards:', err)
    return []
  }
}

async function handleSaveCards(_event, cards) {
  const body = JSON.stringify(cards, null, 2)
  const filePath = cardsFilePath()
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, body, 'utf8')
}

async function readDecksIndex() {
  try {
    const raw = await fs.readFile(decksIndexPath(), 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function writeDecksIndex(index) {
  const body = JSON.stringify(index, null, 2)
  await fs.mkdir(path.dirname(decksIndexPath()), { recursive: true })
  await fs.writeFile(decksIndexPath(), body, 'utf8')
}

async function updateDecksBackup() {
  const index = await readDecksIndex()
  const decks = []
  for (const { id } of index) {
    try {
      const raw = await fs.readFile(deckFilePath(id), 'utf8')
      decks.push(JSON.parse(raw))
    } catch {
      // skip missing files
    }
  }
  try {
    await fs.writeFile(decksBackupPath(), JSON.stringify(decks, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to write decks backup:', err)
  }
}

async function handleLoadDecks() {
  let index = await readDecksIndex()

  // Migrate legacy flashcards.json to a deck on first run
  if (index.length === 0) {
    try {
      const cardsRaw = await fs.readFile(cardsFilePath(), 'utf8')
      const cards = JSON.parse(cardsRaw)
      if (Array.isArray(cards) && cards.length > 0) {
        const deck = { id: randomUUID(), title: 'Vocabulary', cards }
        await handleSaveDeck(null, deck)
        return [deck]
      }
    } catch {
      // No legacy data to migrate
    }
    return []
  }

  const decks = []
  for (const { id } of index) {
    try {
      const raw = await fs.readFile(deckFilePath(id), 'utf8')
      decks.push(JSON.parse(raw))
    } catch {
      // Skip missing deck files
    }
  }
  return decks
}

async function handleSaveDeck(_event, deck) {
  const filePath = deckFilePath(deck.id)
  const body = JSON.stringify(deck, null, 2)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, body, 'utf8')

  const index = await readDecksIndex()
  const idx = index.findIndex((d) => d.id === deck.id)
  if (idx >= 0) {
    index[idx] = { id: deck.id, title: deck.title }
  } else {
    index.push({ id: deck.id, title: deck.title })
  }
  await writeDecksIndex(index)
  await updateDecksBackup()
}

async function handleDeleteDeck(_event, deckId) {
  try {
    await fs.unlink(deckFilePath(deckId))
  } catch {
    // File might not exist
  }

  const index = await readDecksIndex()
  await writeDecksIndex(index.filter((d) => d.id !== deckId))
  await updateDecksBackup()
}

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    width: 1024,
    height: 720,
    minWidth: 400,
    minHeight: 320,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => {
    win.maximize()
    win.show()
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  ipcMain.handle('cards:load', handleLoadCards)
  ipcMain.handle('cards:save', handleSaveCards)
  ipcMain.handle('decks:load-all', handleLoadDecks)
  ipcMain.handle('decks:save', (_event, deck) => handleSaveDeck(_event, deck))
  ipcMain.handle('decks:delete', (_event, deckId) => handleDeleteDeck(_event, deckId))
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
