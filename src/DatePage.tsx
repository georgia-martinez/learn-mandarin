import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import { describeDate, randomDateInYear, type HanziPinyin } from './chineseDate'

/** Characters that carry no pinyin and are skipped when zipping syllables. */
const PUNCTUATION = new Set(['，', ',', '。', '？', '?', '、', '！', '!'])

/**
 * Chinese hanzi with pinyin shown above — each syllable centered over its own
 * character (punctuation gets no syllable), matching the worksheet layout.
 */
function Ruby({ item, size = '2rem' }: { item: HanziPinyin; size?: string }) {
  const chars = [...item.hanzi]
  const syllables = item.pinyin.split(/\s+/).filter(Boolean)
  let s = 0
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 1 }}>
      {chars.map((ch, i) => {
        const pinyin = PUNCTUATION.has(ch) ? '' : (syllables[s++] ?? '')
        return (
          <Box
            key={i}
            sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <Typography
              variant="caption"
              lang="zh-Latn"
              sx={{ color: 'text.secondary', lineHeight: 1.2, fontSize: '0.8rem', minHeight: '1.2em' }}
            >
              {pinyin}
            </Typography>
            <Typography lang="zh-Hant" sx={{ fontSize: size, lineHeight: 1.25 }}>
              {ch}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

const QUESTION_LABEL: HanziPinyin = {
  hanzi: '今天是幾年，幾月，幾號，星期幾？',
  pinyin: 'Jīn tiān shì jǐ nián jǐ yuè jǐ hào xīng qī jǐ',
}

const TODAY_IS: HanziPinyin = { hanzi: '今天是', pinyin: 'Jīn tiān shì' }

export default function DatePage() {
  const navigate = useNavigate()
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [date, setDate] = useState<Date>(() => randomDateInYear(currentYear))
  const [revealed, setRevealed] = useState(false)

  const info = useMemo(() => describeDate(date), [date])

  const newDate = useCallback(() => {
    setDate(randomDateInYear(currentYear))
    setRevealed(false)
  }, [currentYear])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => void navigate('/')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
            Date · 日期
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4, flex: 1, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {/* Prompt card */}
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="overline" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                    {info.englishLabel}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Ruby item={QUESTION_LABEL} size="1.75rem" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    (Today is which year, which month, which date, which day of the week?)
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Answer */}
          {revealed ? (
            <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="overline" color="text.secondary">
                    Answer
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 1 }}>
                    <Ruby item={TODAY_IS} />
                    <Ruby item={info.year} />
                    <Typography sx={{ fontSize: '2rem', alignSelf: 'flex-end', mx: 0.25 }}>，</Typography>
                    <Ruby item={info.month} />
                    <Typography sx={{ fontSize: '2rem', alignSelf: 'flex-end', mx: 0.25 }}>，</Typography>
                    <Ruby item={info.day} />
                    <Typography sx={{ fontSize: '2rem', alignSelf: 'flex-end', mx: 0.25 }}>，</Typography>
                    <Ruby item={info.weekday} />
                    <Typography sx={{ fontSize: '2rem', alignSelf: 'flex-end', mx: 0.25 }}>。</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          <Stack direction="row" spacing={2}>
            {!revealed ? (
              <Button variant="contained" size="large" onClick={() => setRevealed(true)}>
                Show Answer
              </Button>
            ) : null}
            <Button
              variant={revealed ? 'contained' : 'outlined'}
              size="large"
              startIcon={<RefreshIcon />}
              onClick={newDate}
            >
              New Date
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
