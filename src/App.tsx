import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Fab from '@mui/material/Fab'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeProvider, createTheme, type Shadows } from '@mui/material/styles'
import type { FlashCard } from './flashcardStorage'
import { loadFlashcards, saveFlashcards } from './flashcardStorage'
import { PinyinTextField } from './PinyinTextField'

const flatShadows = Array(25).fill('none') as Shadows

type CardTextField = 'simplified' | 'traditional' | 'pinyin' | 'english'

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: { main: '#c62828' },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        shadows: flatShadows,
        components: {
          MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                boxShadow: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: { boxShadow: 'none' },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: { boxShadow: 'none' },
            },
          },
          MuiFab: {
            styleOverrides: {
              root: { boxShadow: 'none', filter: 'none' },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { boxShadow: 'none' },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: { boxShadow: 'none' },
            },
          },
        },
      }),
    [prefersDarkMode],
  )
  const [cards, setCards] = useState<FlashCard[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const platform = window.electronAPI?.platform
  const belowCardsAnchorRef = useRef<HTMLDivElement>(null)
  const prevCardCountRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loaded = await loadFlashcards()
      if (!cancelled) {
        setCards(loaded)
        setStorageReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!storageReady) {
      return
    }
    const id = window.setTimeout(() => {
      void saveFlashcards(cards)
    }, 400)
    return () => window.clearTimeout(id)
  }, [cards, storageReady])

  useLayoutEffect(() => {
    const prev = prevCardCountRef.current
    prevCardCountRef.current = cards.length
    if (cards.length > prev && cards.length === prev + 1) {
      belowCardsAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [cards.length])

  const addCard = () => {
    setCards((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        simplified: '',
        traditional: '',
        pinyin: '',
        english: '',
      },
    ])
  }

  const updateCardField = (id: string, field: CardTextField, value: string) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    )
  }

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id))
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" color="primary" enableColorOnDark>
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
              <Typography variant="h4" component="h1" gutterBottom>
                Vocabulary cards
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Add cards with pinyin, simplified and traditional characters, and English.
              </Typography>
              <Button variant="contained" color="primary" onClick={addCard}>
                Add Card
              </Button>
            </Box>

            <Stack spacing={2}>
              {cards.map((card) => (
                <Card key={card.id} variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      useFlexGap
                      sx={{
                        alignItems: 'flex-start',
                        width: '100%',
                        flexWrap: { xs: 'wrap', lg: 'nowrap' },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        useFlexGap
                        sx={{
                          flex: 1,
                          flexWrap: 'wrap',
                          minWidth: 0,
                          '& > .MuiTextField-root': {
                            flex: '1 1 160px',
                            minWidth: 140,
                            maxWidth: '100%',
                          },
                        }}
                      >
                        <PinyinTextField
                          label="Pinyin"
                          value={card.pinyin}
                          onValueChange={(v) => updateCardField(card.id, 'pinyin', v)}
                          autoComplete="off"
                        />
                        <TextField
                          label="Simplified"
                          value={card.simplified}
                          onChange={(e) => updateCardField(card.id, 'simplified', e.target.value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="Traditional"
                          value={card.traditional}
                          onChange={(e) => updateCardField(card.id, 'traditional', e.target.value)}
                          autoComplete="off"
                        />
                        <TextField
                          label="English"
                          value={card.english}
                          onChange={(e) => updateCardField(card.id, 'english', e.target.value)}
                          autoComplete="off"
                        />
                      </Stack>
                      <Tooltip title="Delete card">
                        <IconButton
                          color="error"
                          aria-label="Delete card"
                          onClick={() => removeCard(card.id)}
                          edge="end"
                          sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', lg: 'center' }, mt: { xs: 0, lg: 0.5 } }}
                        >
                          <DeleteOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {cards.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Fab color="primary" aria-label="Add card" onClick={addCard} size="medium">
                    <Typography component="span" sx={{ fontSize: 28, lineHeight: 1, fontWeight: 300 }}>
                      +
                    </Typography>
                  </Fab>
                </Box>
              ) : null}
              <Box
                ref={belowCardsAnchorRef}
                aria-hidden
                sx={{
                  height: (t) => t.spacing(6),
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
              />
            </Stack>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
