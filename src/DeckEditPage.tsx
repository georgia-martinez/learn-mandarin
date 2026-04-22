import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import type { FlashCard } from './flashcardStorage'
import type { Deck } from './deckStorage'
import { loadDecks, saveDeck } from './deckStorage'
import { PinyinTextField } from './PinyinTextField'
import { StudyConfigDialog } from './StudyConfigDialog'

type CardTextField = 'simplified' | 'traditional' | 'pinyin' | 'english'

export default function DeckEditPage() {
  const navigate = useNavigate()
  const { deckId } = useParams<{ deckId: string }>()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [storageReady, setStorageReady] = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const [hoveredGap, setHoveredGap] = useState<number | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null)
  const platform = window.electronAPI?.platform
  const belowCardsAnchorRef = useRef<HTMLDivElement>(null)
  const prevCardCountRef = useRef(0)
  const appendingRef = useRef(false)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const scrollSpeedRef = useRef(0)
  const dragFromInputRef = useRef(false)
  const scrollRafRef = useRef<number | null>(null)

  const stopEdgeScroll = () => {
    scrollSpeedRef.current = 0
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = null
    }
  }

  useEffect(() => {
    if (draggingIndex === null) {
      stopEdgeScroll()
      return
    }
    const ZONE = 80
    const MAX_SPEED = 14

    const onDragOver = (e: DragEvent) => {
      const vh = window.innerHeight
      if (e.clientY < ZONE) {
        scrollSpeedRef.current = -MAX_SPEED * (1 - e.clientY / ZONE)
      } else if (e.clientY > vh - ZONE) {
        scrollSpeedRef.current = MAX_SPEED * (1 - (vh - e.clientY) / ZONE)
      } else {
        scrollSpeedRef.current = 0
      }

      if (scrollSpeedRef.current !== 0 && scrollRafRef.current === null) {
        const loop = () => {
          if (scrollSpeedRef.current === 0) {
            scrollRafRef.current = null
            return
          }
          window.scrollBy(0, scrollSpeedRef.current)
          scrollRafRef.current = requestAnimationFrame(loop)
        }
        scrollRafRef.current = requestAnimationFrame(loop)
      }
    }

    window.addEventListener('dragover', onDragOver)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      stopEdgeScroll()
    }
  }, [draggingIndex])

  useEffect(() => {
    if (!deckId) return
    let cancelled = false
    void (async () => {
      const decks = await loadDecks()
      if (!cancelled) {
        const found = decks.find((d) => d.id === deckId) ?? null
        if (!found) {
          void navigate('/', { replace: true })
          return
        }
        setDeck(found)
        setStorageReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [deckId, navigate])

  useEffect(() => {
    if (!storageReady || !deck) return
    const id = window.setTimeout(() => {
      void saveDeck(deck)
    }, 400)
    return () => window.clearTimeout(id)
  }, [deck, storageReady])

  useLayoutEffect(() => {
    const cards = deck?.cards ?? []
    const prev = prevCardCountRef.current
    prevCardCountRef.current = cards.length
    if (appendingRef.current && cards.length > prev) {
      appendingRef.current = false
      belowCardsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [deck?.cards.length])

  const addCard = () => {
    appendingRef.current = true
    setDeck((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        cards: [
          ...prev.cards,
          { id: crypto.randomUUID(), simplified: '', traditional: '', pinyin: '', english: '' },
        ],
      }
    })
  }

  const insertCardAfter = (afterIndex: number) => {
    setHoveredGap(null)
    setDeck((prev) => {
      if (!prev) return prev
      const newCards = [...prev.cards]
      newCards.splice(afterIndex + 1, 0, {
        id: crypto.randomUUID(), simplified: '', traditional: '', pinyin: '', english: '',
      })
      return { ...prev, cards: newCards }
    })
  }

  const updateCardField = (id: string, field: CardTextField, value: string) => {
    setDeck((prev) => {
      if (!prev) return prev
      return { ...prev, cards: prev.cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)) }
    })
  }

  const removeCard = (id: string) => {
    setDeck((prev) => {
      if (!prev) return prev
      return { ...prev, cards: prev.cards.filter((c) => c.id !== id) }
    })
  }

  const updateTitle = (title: string) => {
    setDeck((prev) => (prev ? { ...prev, title } : prev))
  }

  // --- Drag handlers ---

  const handleDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
    if (dragFromInputRef.current) {
      e.preventDefault()
      return
    }
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    stopEdgeScroll()
    setDraggingIndex(null)
    setDropIndicatorIndex(null)
  }

  const handleCardDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    setDropIndicatorIndex(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
  }

  const handleGapDragOver = (e: React.DragEvent<HTMLElement>, position: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndicatorIndex(position)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    stopEdgeScroll()
    if (draggingIndex === null || dropIndicatorIndex === null) {
      setDraggingIndex(null)
      setDropIndicatorIndex(null)
      return
    }
    const from = draggingIndex
    const to = dropIndicatorIndex
    setDraggingIndex(null)
    setDropIndicatorIndex(null)
    if (to === from || to === from + 1) return
    setDeck((prev) => {
      if (!prev) return prev
      const next = [...prev.cards]
      const [card] = next.splice(from, 1)
      next.splice(to > from ? to - 1 : to, 0, card)
      return { ...prev, cards: next }
    })
  }

  const handleContainerDragLeave = (e: React.DragEvent) => {
    if (!cardsContainerRef.current?.contains(e.relatedTarget as Node)) {
      setDropIndicatorIndex(null)
    }
  }

  if (!storageReady || !deck) return null

  const cards: FlashCard[] = deck.cards
  const isDragging = draggingIndex !== null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => void navigate('/')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
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
            <TextField
              label="Deck Title"
              value={deck.title}
              onChange={(e) => updateTitle(e.target.value)}
              variant="outlined"
              sx={{ mb: 2, '& .MuiInputBase-input': { typography: 'h5', fontWeight: 500 } }}
              autoComplete="off"
            />
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Button variant="outlined" onClick={() => setStudyOpen(true)} disabled={cards.length === 0}>
                Study
              </Button>
            </Stack>
            <StudyConfigDialog
              open={studyOpen}
              onClose={() => setStudyOpen(false)}
              onStart={(config) => {
                setStudyOpen(false)
                void navigate('/study', { state: { ...config, cards, deckId: deck.id } })
              }}
              hasCards={cards.length > 0}
            />
          </Box>

          <Box ref={cardsContainerRef} onDragLeave={handleContainerDragLeave}>
            {cards.map((card, i) => (
              <Fragment key={card.id}>
                {/* Separator before / between cards */}
                {i === 0 && isDragging ? (
                  // Drop zone before first card
                  <Box
                    onDragOver={(e) => handleGapDragOver(e, 0)}
                    onDrop={handleDrop}
                    sx={{ height: '32px', display: 'flex', alignItems: 'center' }}
                  >
                    {dropIndicatorIndex === 0 && (
                      <Box sx={{ width: '100%', height: '2px', bgcolor: 'primary.main', borderRadius: 1 }} />
                    )}
                  </Box>
                ) : i > 0 ? (
                  isDragging ? (
                    // Drop zone between cards
                    <Box
                      onDragOver={(e) => handleGapDragOver(e, i)}
                      onDrop={handleDrop}
                      sx={{ height: '32px', display: 'flex', alignItems: 'center' }}
                    >
                      {dropIndicatorIndex === i && (
                        <Box sx={{ width: '100%', height: '2px', bgcolor: 'primary.main', borderRadius: 1 }} />
                      )}
                    </Box>
                  ) : (
                    // Insert Fab zone
                    <Box
                      onMouseEnter={() => setHoveredGap(i - 1)}
                      onMouseLeave={() => setHoveredGap(null)}
                      sx={{
                        position: 'relative',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: hoveredGap === i - 1 ? 1 : 0,
                      }}
                    >
                      <Fab
                        size="small"
                        color="primary"
                        aria-label="Insert card here"
                        onClick={() => insertCardAfter(i - 1)}
                        sx={{
                          opacity: hoveredGap === i - 1 ? 1 : 0,
                          transform: hoveredGap === i - 1 ? 'scale(1)' : 'scale(0.5)',
                          transition: 'opacity 0.12s, transform 0.12s',
                          pointerEvents: hoveredGap === i - 1 ? 'auto' : 'none',
                        }}
                      >
                        <AddIcon />
                      </Fab>
                    </Box>
                  )
                ) : null}

                {/* Card row */}
                <Box
                  draggable
                  onMouseDown={(e) => {
                    const t = e.target as HTMLElement
                    dragFromInputRef.current = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'
                  }}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleCardDragOver(e, i)}
                  onDrop={handleDrop}
                  sx={{ opacity: draggingIndex === i ? 0.35 : 1, transition: 'opacity 0.1s' }}
                >
                  <Card variant="outlined">
                    <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ alignItems: 'flex-start', width: '100%', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}
                      >
                        {/* Drag handle */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignSelf: 'center',
                            alignItems: 'center',
                            color: 'text.disabled',
                            cursor: isDragging && draggingIndex === i ? 'grabbing' : 'grab',
                            flexShrink: 0,
                            ml: -0.5,
                          }}
                        >
                          <DragIndicatorIcon />
                        </Box>

                        {/* Fields */}
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

                        {/* Delete */}
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
                </Box>

                {/* Drop zone after last card */}
                {i === cards.length - 1 && isDragging && (
                  <Box
                    onDragOver={(e) => handleGapDragOver(e, cards.length)}
                    onDrop={handleDrop}
                    sx={{ height: '32px', display: 'flex', alignItems: 'center' }}
                  >
                    {dropIndicatorIndex === cards.length && (
                      <Box sx={{ width: '100%', height: '2px', bgcolor: 'primary.main', borderRadius: 1 }} />
                    )}
                  </Box>
                )}
              </Fragment>
            ))}

            {!isDragging && (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2 }}>
                <Fab color="primary" aria-label="Add card" onClick={addCard} size="small">
                  <AddIcon />
                </Fab>
              </Box>
            )}

            <Box
              ref={belowCardsAnchorRef}
              aria-hidden
              sx={{ height: (t) => t.spacing(6), flexShrink: 0, pointerEvents: 'none' }}
            />
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
