import confetti from 'canvas-confetti'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { keyframes } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import StarIcon from '@mui/icons-material/Star'
import ShuffleIcon from '@mui/icons-material/Shuffle'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import type { FlashCard } from './flashcardStorage'
import { loadDecks, saveDeck } from './deckStorage'
import {
  getFieldValue,
  type StudyConfig,
  type StudyField,
  STUDY_FIELD_LABELS,
} from './studyTypes'

const slideInNext = keyframes`
  from {
    opacity: 0.15;
    transform: translateX(32px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`

const slideInPrev = keyframes`
  from {
    opacity: 0.15;
    transform: translateX(-32px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`

const faceBase = {
  position: 'absolute' as const,
  inset: 0,
  backfaceVisibility: 'hidden' as const,
  WebkitBackfaceVisibility: 'hidden' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  alignItems: 'center',
  p: 4,
  boxSizing: 'border-box' as const,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: 'background.paper',
  overflow: 'auto',
}

type DisplayItem = {
  key: string
  label: string
  value: string
  lang: string
  /** Second line (e.g. traditional under merged hanzi). */
  secondLine?: string
  secondLineLang?: string
  alwaysShowLabel?: boolean
}

type StudyState = StudyConfig & {
  cards: FlashCard[]
  deckId: string
  /** Set when navigating from deck editor “Study starred cards”. */
  studyStarredOnly?: boolean
}

function fieldLang(f: StudyField): string {
  if (f === 'english') {
    return 'en'
  }
  if (f === 'simplified') {
    return 'zh-Hans'
  }
  if (f === 'traditional') {
    return 'zh-Hant'
  }
  return 'zh-Latn'
}

function buildDisplayItems(card: FlashCard, fields: StudyField[]): DisplayItem[] {
  const hasBothHanzi = fields.includes('simplified') && fields.includes('traditional')
  const out: DisplayItem[] = []
  let mergedHanziEmitted = false

  for (const field of fields) {
    if (hasBothHanzi && (field === 'simplified' || field === 'traditional')) {
      if (!mergedHanziEmitted) {
        mergedHanziEmitted = true
        const simp = getFieldValue(card, 'simplified').trim()
        const trad = getFieldValue(card, 'traditional').trim()
        const areSame = !simp || !trad || simp === trad
        if (areSame) {
          // Same or one missing — show as a single merged item
          out.push({
            key: 'simplified-traditional',
            label: 'Simplified / Traditional',
            value: simp || trad || '—',
            lang: simp ? 'zh-Hans' : 'zh-Hant',
            alwaysShowLabel: true,
          })
        } else {
          // Different — show each with its own label
          out.push({
            key: 'simplified',
            label: STUDY_FIELD_LABELS.simplified,
            value: simp,
            lang: 'zh-Hans',
          })
          out.push({
            key: 'traditional',
            label: STUDY_FIELD_LABELS.traditional,
            value: trad,
            lang: 'zh-Hant',
          })
        }
      }
      continue
    }

    if (field === 'traditional' && fields.length === 1 && !getFieldValue(card, 'traditional').trim()) {
      out.push({
        key: 'simplified-fallback',
        label: STUDY_FIELD_LABELS.simplified,
        value: getFieldValue(card, 'simplified') || '—',
        lang: 'zh-Hans',
      })
      continue
    }

    out.push({
      key: field,
      label: STUDY_FIELD_LABELS[field],
      value: getFieldValue(card, field) || '—',
      lang: fieldLang(field),
    })
  }

  return out
}

function renderFaceContent(card: FlashCard, fields: StudyField[], role: 'front' | 'back') {
  const items = buildDisplayItems(card, fields)
  const fontSizeForKey = (key: string) =>
    key === 'pinyin'
      ? { xs: '1.5rem', sm: '1.75rem' }
      : { xs: '1.75rem', sm: '2.25rem' }

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: '100%' }}>
      {items.map((item) => (
        <Box key={item.key} sx={{ maxWidth: '100%' }} role="group" aria-label={`${item.label} on ${role}`}>
          {(items.length > 1 || item.alwaysShowLabel) && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {item.label}
            </Typography>
          )}
          <Typography
            variant="h4"
            component="div"
            lang={item.lang}
            sx={{
              fontSize: items.length > 1 ? { xs: '1.5rem', sm: '1.75rem' } : fontSizeForKey(item.key),
              wordBreak: 'break-word',
            }}
          >
            {item.value}
          </Typography>
          {item.secondLine ? (
            <Typography
              variant="h4"
              component="div"
              lang={item.secondLineLang}
              sx={{
                mt: 1,
                fontSize: items.length > 1 ? { xs: '1.5rem', sm: '1.75rem' } : fontSizeForKey('traditional'),
                wordBreak: 'break-word',
              }}
            >
              {item.secondLine}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Stack>
  )
}

function isValidStudyState(s: unknown): s is StudyState {
  if (!s || typeof s !== 'object') {
    return false
  }
  const o = s as Record<string, unknown>
  const f = o.front
  const b = o.back
  if (!Array.isArray(f) || !Array.isArray(b) || f.length === 0 || b.length === 0) {
    return false
  }
  const ok = (arr: unknown[]): arr is StudyField[] =>
    arr.every(
      (x) =>
        x === 'pinyin' || x === 'simplified' || x === 'traditional' || x === 'english',
    )
  if (!ok(f) || !ok(b)) return false
  if (!Array.isArray(o.cards)) return false
  if (typeof o.deckId !== 'string') return false
  if (o.studyStarredOnly !== undefined && typeof o.studyStarredOnly !== 'boolean') {
    return false
  }
  return true
}

/** Bright yellow for starred state (study mode). */
const STAR_ACTIVE_COLOR = '#FFD600'

function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = copy[i]!
    copy[i] = copy[j]!
    copy[j] = t
  }
  return copy
}

export default function StudyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  /** Incremented on each card change; drives enter animation. */
  const [slideKey, setSlideKey] = useState(0)
  /** "next" = from right, "prev" = from left (or null for initial card). */
  const [cardStep, setCardStep] = useState<'next' | 'prev' | null>(null)
  const state = isValidStudyState(location.state) ? location.state : null

  /** Live card list for this session (full deck or starred subset). */
  const [studyCards, setStudyCards] = useState<FlashCard[]>(() => state?.cards ?? [])
  /** Full deck from storage — source for switching between full vs starred study. */
  const [fullDeckCards, setFullDeckCards] = useState<FlashCard[]>([])
  /** Starred-only subset session (from button or deck editor). */
  const [studyStarredOnlyMode, setStudyStarredOnlyMode] = useState(() =>
    Boolean(state?.studyStarredOnly),
  )
  const [shuffleEnabled, setShuffleEnabled] = useState(false)
  /** Finished reviewing past the last card — congrats + navigation exits without returning here on back. */
  const [sessionComplete, setSessionComplete] = useState(false)
  const sessionCompleteRef = useRef(false)

  const deckId = state?.deckId

  useEffect(() => {
    sessionCompleteRef.current = sessionComplete
  }, [sessionComplete])

  useLayoutEffect(() => {
    if (!state) {
      void navigate('/', { replace: true })
    }
  }, [state, navigate])

  useEffect(() => {
    if (!deckId) return
    let cancelled = false
    void loadDecks().then((decks) => {
      if (cancelled) return
      const deck = decks.find((d) => d.id === deckId)
      if (deck) {
        setFullDeckCards(deck.cards)
      }
    })
    return () => {
      cancelled = true
    }
  }, [deckId])

  const cards = studyCards
  const n = cards.length

  const hasStarredInFullDeck = fullDeckCards.some((c) => c.starred)
  const starredCountInDeck = fullDeckCards.filter((c) => c.starred).length

  const persistStarToggle = useCallback(
    async (cardId: string) => {
      if (!deckId) return
      const decks = await loadDecks()
      const deck = decks.find((d) => d.id === deckId)
      if (!deck) return
      await saveDeck({
        ...deck,
        cards: deck.cards.map((c) =>
          c.id === cardId ? { ...c, starred: !c.starred } : c,
        ),
      })
    },
    [deckId],
  )

  const toggleStarForCardId = useCallback(
    (cardId: string) => {
      setFullDeckCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, starred: !c.starred } : c)),
      )
      setStudyCards((prev) => {
        const mapped = prev.map((c) =>
          c.id === cardId ? { ...c, starred: !c.starred } : c,
        )
        if (studyStarredOnlyMode) {
          return mapped.filter((c) => c.starred)
        }
        return mapped
      })
      void persistStarToggle(cardId)
    },
    [persistStarToggle, studyStarredOnlyMode],
  )

  const rebuildCanonicalStudyCards = useCallback((): FlashCard[] => {
    if (studyStarredOnlyMode) {
      return fullDeckCards.filter((c) => c.starred)
    }
    return [...fullDeckCards]
  }, [fullDeckCards, studyStarredOnlyMode])

  const toggleShuffle = useCallback(() => {
    setSessionComplete(false)
    setShuffleEnabled((wasOn) => {
      if (!wasOn) {
        setStudyCards((cards) => shuffleCards(cards))
      } else {
        setStudyCards(rebuildCanonicalStudyCards())
      }
      return !wasOn
    })
    setIndex(0)
    setIsFlipped(false)
    setSlideKey((k) => k + 1)
  }, [rebuildCanonicalStudyCards])

  const enterStarredOnlyStudy = useCallback(() => {
    const starred = fullDeckCards.filter((c) => c.starred)
    if (starred.length === 0) return
    setSessionComplete(false)
    setShuffleEnabled(false)
    setStudyCards(starred)
    setStudyStarredOnlyMode(true)
    setIndex(0)
    setIsFlipped(false)
    setSlideKey((k) => k + 1)
  }, [fullDeckCards])

  const backToFullDeckStudy = useCallback(() => {
    setSessionComplete(false)
    setShuffleEnabled(false)
    setStudyCards([...fullDeckCards])
    setStudyStarredOnlyMode(false)
    setIndex(0)
    setIsFlipped(false)
    setSlideKey((k) => k + 1)
  }, [fullDeckCards])

  const studyAgain = useCallback(() => {
    setSessionComplete(false)
    setIndex(0)
    setIsFlipped(false)
    setSlideKey((k) => k + 1)
  }, [])

  const clampedIndex = n === 0 ? 0 : Math.min(index, n - 1)

  const toggleCurrentStar = useCallback(() => {
    if (sessionCompleteRef.current || n === 0) return
    const ci = Math.min(index, n - 1)
    const cardId = cards[ci]?.id
    if (!cardId) return
    toggleStarForCardId(cardId)
  }, [n, cards, index, toggleStarForCardId])

  const go = useCallback((delta: number) => {
    if (n === 0) return
    setCardStep(delta > 0 ? 'next' : 'prev')
    setSlideKey((k) => k + 1)
    setIsFlipped(false)

    if (sessionCompleteRef.current) {
      setSessionComplete(false)
      setIndex(delta > 0 ? 0 : n - 1)
      return
    }

    setIndex((i) => {
      const cur = Math.min(i, n - 1)
      if (delta > 0 && cur === n - 1) {
        setSessionComplete(true)
        return cur
      }
      return (cur + delta + n) % n
    })
  }, [n])

  useEffect(() => {
    if (!sessionComplete) return
    void confetti({
      particleCount: 140,
      spread: 72,
      origin: { y: 0.62 },
      scalar: 1,
    })
  }, [sessionComplete])

  useEffect(() => {
    if (!state || n === 0) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) {
        return
      }
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        toggleCurrentStar()
        return
      }
      if (e.code === 'Space') {
        if (sessionCompleteRef.current) return
        e.preventDefault()
        setIsFlipped((f) => !f)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [state, n, go, toggleCurrentStar])

  if (!state) {
    return null
  }

  const backPath = state.deckId ? `/deck/${state.deckId}` : '/'
  const current = cards[clampedIndex]
  const showEmpty = n === 0

  const starred = sessionComplete ? false : (current?.starred ?? false)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => void navigate(backPath)} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {studyStarredOnlyMode ? 'Study · Starred terms' : 'Study'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          px: 2,
        }}
      >
        {showEmpty ? (
          <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
            {studyStarredOnlyMode ? (
              <>
                <Typography>No starred cards left.</Typography>
                <Button variant="contained" onClick={backToFullDeckStudy}>
                  Back to full deck
                </Button>
              </>
            ) : (
              <>
                <Typography>No cards to study. Add cards in the list and try again.</Typography>
                <Button variant="outlined" onClick={() => void navigate(backPath)}>
                  Back to deck
                </Button>
              </>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 480 }}>
            {/* Fixed-height strip so showing/hiding the button does not shift the card. */}
            <Box
              sx={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 36,
                  flex: 1,
                  minWidth: 0,
                  flexWrap: 'wrap',
                }}
              >
                {studyStarredOnlyMode ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={backToFullDeckStudy}
                  >
                    Back to full deck
                  </Button>
                ) : hasStarredInFullDeck ? (
                  <Button variant="outlined" size="small" onClick={enterStarredOnlyStudy}>
                    Study starred terms
                  </Button>
                ) : (
                  <Box component="span" aria-hidden sx={{ display: 'block', height: 36 }} />
                )}
              </Box>
              <Tooltip title={shuffleEnabled ? 'Unshuffle cards' : 'Shuffle cards'}>
                <IconButton
                  size="small"
                  onClick={toggleShuffle}
                  aria-label={shuffleEnabled ? 'Turn off shuffle' : 'Shuffle cards'}
                  aria-pressed={shuffleEnabled}
                  sx={{
                    flexShrink: 0,
                    ...(shuffleEnabled
                      ? {
                          bgcolor: 'error.main',
                          color: 'error.contrastText',
                          '&:hover': { bgcolor: 'error.dark' },
                        }
                      : { color: 'text.secondary' }),
                  }}
                >
                  <ShuffleIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              key={slideKey}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 480,
                perspective: '1200px',
                transformStyle: 'preserve-3d',
                overflow: 'hidden',
                borderRadius: 1,
                ...(cardStep != null && slideKey > 0 && !sessionComplete
                  ? {
                      animation: `${cardStep === 'next' ? slideInNext : slideInPrev} 0.32s ease-out both`,
                    }
                  : {}),
              }}
            >
              {sessionComplete ? (
                <Stack
                  spacing={2}
                  sx={{
                    width: '100%',
                    alignItems: 'center',
                    py: 2,
                    px: 1,
                    textAlign: 'center',
                  }}
                >
                  <Stack spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Nice job!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      You studied {n} {n === 1 ? 'card' : 'cards'}
                    </Typography>
                    {starredCountInDeck > 0 ? (
                      <Typography variant="body1" color="text.secondary">
                        and have {starredCountInDeck}{' '}
                        {starredCountInDeck === 1 ? 'starred card' : 'starred cards'}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Box sx={{ pt: 0.5 }}>
                    <Button variant="contained" size="medium" onClick={studyAgain}>
                      Study Again
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <>
                  <Tooltip title={starred ? 'Unstar card (S)' : 'Star card (S)'}>
                    <IconButton
                      aria-label={starred ? 'Unstar card' : 'Star card'}
                      aria-pressed={starred}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStarForCardId(current!.id)
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        zIndex: 10,
                        color: starred ? STAR_ACTIVE_COLOR : 'action.disabled',
                      }}
                    >
                      {starred ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Tooltip>
                  <Box
                    onClick={() => setIsFlipped((f) => !f)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsFlipped((f) => !f)
                      }
                    }}
                    aria-label={isFlipped ? 'Show front' : 'Show back'}
                    sx={{
                      width: '100%',
                      maxWidth: 480,
                      perspective: '1000px',
                      cursor: 'pointer',
                      outline: 'none',
                      mx: 'auto',
                      '&:focus-visible': { boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}` },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        minHeight: 280,
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                        transformOrigin: 'center center',
                      }}
                    >
                      <Box
                        sx={{
                          ...faceBase,
                          transform: 'rotateX(0deg)',
                          zIndex: 2,
                        }}
                      >
                        {renderFaceContent(current!, state.front, 'front')}
                      </Box>
                      <Box
                        sx={{
                          ...faceBase,
                          transform: 'rotateX(180deg)',
                          zIndex: 1,
                        }}
                      >
                        {renderFaceContent(current!, state.back, 'back')}
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}
            >
              <IconButton onClick={() => go(-1)} aria-label="Previous card">
                <ArrowBackIosNewIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary" aria-live="polite">
                {sessionComplete ? 'Done' : `${clampedIndex + 1} / ${n}`}
              </Typography>
              <IconButton onClick={() => go(1)} aria-label="Next card">
                <ArrowForwardIosIcon />
              </IconButton>
            </Stack>
          </Stack>
        )}
      </Container>
    </Box>
  )
}
