import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { keyframes } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import type { FlashCard } from './flashcardStorage'
import { loadFlashcards } from './flashcardStorage'
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
  alwaysShowLabel?: boolean
}

function buildDisplayItems(card: FlashCard, fields: StudyField[]): DisplayItem[] {
  const hasBoth = fields.includes('simplified') && fields.includes('traditional')

  if (hasBoth) {
    const simplifiedVal = getFieldValue(card, 'simplified')
    const traditionalVal = getFieldValue(card, 'traditional')
    const sameOrNoTraditional = !traditionalVal || simplifiedVal === traditionalVal

    const chineseItems: DisplayItem[] = sameOrNoTraditional
      ? [
          {
            key: 'simplified-traditional',
            label: 'Simplified / Traditional',
            value: simplifiedVal || '—',
            lang: 'zh-Hans',
            alwaysShowLabel: true,
          },
        ]
      : [
          {
            key: 'simplified',
            label: STUDY_FIELD_LABELS['simplified'],
            value: simplifiedVal || '—',
            lang: 'zh-Hans',
          },
          {
            key: 'traditional',
            label: STUDY_FIELD_LABELS['traditional'],
            value: traditionalVal,
            lang: 'zh-Hant',
          },
        ]

    const rest = fields
      .filter((f) => f !== 'simplified' && f !== 'traditional')
      .map((f) => ({
        key: f,
        label: STUDY_FIELD_LABELS[f],
        value: getFieldValue(card, f) || '—',
        lang: f === 'english' ? 'en' : 'zh-Latn',
      }))
    const insertAt = Math.min(fields.indexOf('simplified'), fields.indexOf('traditional'))
    return [...rest.slice(0, insertAt), ...chineseItems, ...rest.slice(insertAt)]
  }

  return fields.map((f) => {
    let value = getFieldValue(card, f)
    if (f === 'traditional' && fields.length === 1 && !value) {
      value = getFieldValue(card, 'simplified')
    }
    return {
      key: f,
      label: STUDY_FIELD_LABELS[f],
      value: value || '—',
      lang: f === 'english' ? 'en' : f === 'simplified' ? 'zh-Hans' : f === 'traditional' ? 'zh-Hant' : 'zh-Latn',
    }
  })
}

function renderFaceContent(card: FlashCard, fields: StudyField[], role: 'front' | 'back') {
  const items = buildDisplayItems(card, fields)
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
              fontSize: items.length > 1
                ? { xs: '1.5rem', sm: '1.75rem' }
                : item.key === 'pinyin'
                  ? { xs: '1.5rem', sm: '1.75rem' }
                  : { xs: '1.75rem', sm: '2.25rem' },
              wordBreak: 'break-word',
            }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

function isValidStudyState(s: unknown): s is StudyConfig {
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
  return ok(f) && ok(b)
}

export default function StudyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [cards, setCards] = useState<FlashCard[]>([])
  const [loadReady, setLoadReady] = useState(false)
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  /** Incremented on each card change; drives enter animation. */
  const [slideKey, setSlideKey] = useState(0)
  /** "next" = from right, "prev" = from left (or null for initial card). */
  const [cardStep, setCardStep] = useState<'next' | 'prev' | null>(null)
  const state = isValidStudyState(location.state) ? location.state : null

  useEffect(() => {
    if (!state) {
      return
    }
    let cancel = false
    void (async () => {
      setLoadReady(false)
      setCards([])
      setIndex(0)
      setIsFlipped(false)
      setSlideKey(0)
      setCardStep(null)
      const loaded = await loadFlashcards()
      if (cancel) {
        return
      }
      setCards(loaded)
      setLoadReady(true)
    })()
    return () => {
      cancel = true
    }
  }, [state])

  useLayoutEffect(() => {
    if (!state) {
      void navigate('/', { replace: true })
    }
  }, [state, navigate])

  const go = useCallback(
    (delta: number) => {
      if (cards.length === 0) {
        return
      }
      setCardStep(delta > 0 ? 'next' : 'prev')
      setSlideKey((k) => k + 1)
      setIndex((i) => (i + delta + cards.length) % cards.length)
      setIsFlipped(false)
    },
    [cards.length],
  )

  useEffect(() => {
    if (!state || !loadReady || cards.length === 0) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) {
        return
      }
      if (e.code === 'Space') {
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
  }, [state, loadReady, cards.length, go])

  if (!state) {
    return null
  }

  const current = cards[index]
  const n = cards.length
  const showEmpty = loadReady && n === 0
  const showLoading = !loadReady

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => void navigate('/')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Study
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
        {showLoading ? (
          <Typography>Loading…</Typography>
        ) : showEmpty ? (
          <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <Typography>No cards to study. Add cards in the list and try again.</Typography>
            <Button variant="outlined" onClick={() => void navigate('/')}>
              Back to vocabulary
            </Button>
          </Stack>
        ) : (
          <>
            <Box
              key={slideKey}
              sx={{
                width: '100%',
                maxWidth: 480,
                perspective: '1200px',
                transformStyle: 'preserve-3d',
                overflow: 'hidden',
                borderRadius: 1,
                ...(cardStep != null && slideKey > 0
                  ? {
                      animation: `${cardStep === 'next' ? slideInNext : slideInPrev} 0.32s ease-out both`,
                    }
                  : {}),
              }}
            >
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
                    {renderFaceContent(current, state.front, 'front')}
                  </Box>
                  <Box
                    sx={{
                      ...faceBase,
                      transform: 'rotateX(180deg)',
                      zIndex: 1,
                    }}
                  >
                    {renderFaceContent(current, state.back, 'back')}
                  </Box>
                </Box>
              </Box>
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
              <IconButton onClick={() => go(-1)} aria-label="Previous card">
                <ArrowBackIosNewIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary" aria-live="polite">
                {index + 1} / {n}
              </Typography>
              <IconButton onClick={() => go(1)} aria-label="Next card">
                <ArrowForwardIosIcon />
              </IconButton>
            </Stack>
          </>
        )}
      </Container>
    </Box>
  )
}
