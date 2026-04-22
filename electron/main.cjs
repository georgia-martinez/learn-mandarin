const { app, BrowserWindow, ipcMain, shell } = require('electron')
const fs = require('fs').promises
const path = require('path')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const CARDS_FILENAME = 'flashcards.json'
const REPO_BACKUP_FILENAME = 'flashcards.git.json'

function cardsFilePath() {
  return path.join(app.getPath('userData'), CARDS_FILENAME)
}

function repoBackupPath() {
  return path.join(__dirname, '..', REPO_BACKUP_FILENAME)
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
  try {
    await fs.writeFile(repoBackupPath(), body, 'utf8')
  } catch (err) {
    console.error('Failed to write repo backup flashcards file:', err)
  }
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
