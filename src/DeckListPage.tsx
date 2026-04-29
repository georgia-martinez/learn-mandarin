import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import type { Deck } from './deckStorage'
import { deleteDeck, loadDecks, nextUntitledName, saveDeck } from './deckStorage'

export default function DeckListPage() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const platform = window.electronAPI?.platform

  const deckToDelete = decks.find((d) => d.id === confirmDeleteId) ?? null

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loaded = await loadDecks()
      if (!cancelled) {
        setDecks(loaded)
        setStorageReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddDeck = async () => {
    const title = nextUntitledName(decks.map((d) => d.title))
    const deck: Deck = {
      id: crypto.randomUUID(),
      title,
      cards: [{ id: crypto.randomUUID(), simplified: '', traditional: '', pinyin: '', english: '', starred: false }],
    }
    await saveDeck(deck)
    setDecks((prev) => [...prev, deck])
    void navigate(`/deck/${deck.id}`)
  }

  const handleDeleteDeck = async () => {
    if (!confirmDeleteId) return
    await deleteDeck(confirmDeleteId)
    setDecks((prev) => prev.filter((d) => d.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Learn Mandarin
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {platform ? `Electron · ${platform}` : 'Web'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth={false} sx={{ py: 4, flex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                Your Decks
              </Typography>
              <Button variant="contained" color="primary" onClick={() => void handleAddDeck()}>
                Add Deck
              </Button>
            </Stack>

            {storageReady && decks.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 10,
                  color: 'text.secondary',
                }}
              >
                <StyleOutlinedIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" gutterBottom>
                  No decks yet
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Create your first deck to start studying.
                </Typography>
                <Button variant="contained" onClick={() => void handleAddDeck()}>
                  Add Deck
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {decks.map((deck) => (
                  <Card key={deck.id} variant="outlined">
                    <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                      <CardActionArea
                        onClick={() => void navigate(`/deck/${deck.id}`)}
                        sx={{ flex: 1 }}
                      >
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {deck.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {deck.cards.length === 1 ? '1 card' : `${deck.cards.length} cards`}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
                        <Tooltip title="Delete deck">
                          <IconButton
                            color="error"
                            aria-label={`Delete ${deck.title}`}
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(deck.id) }}
                          >
                            <DeleteOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Container>

      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Delete deck?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deckToDelete
              ? `"${deckToDelete.title}" and all its cards will be permanently deleted.`
              : 'This deck and all its cards will be permanently deleted.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={() => void handleDeleteDeck()}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
