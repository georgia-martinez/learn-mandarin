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
import Ruby from './Ruby'
import { describeTemperature, randomTemperature } from './chineseTemperature'
import type { HanziPinyin } from './chineseNumber'

const QUESTION_LABEL: HanziPinyin = {
  hanzi: '今天氣溫幾度？',
  pinyin: 'Jīn tiān qì wēn jǐ dù',
}

export default function TemperaturePage() {
  const navigate = useNavigate()
  const [celsius, setCelsius] = useState<number>(() => randomTemperature())
  const [revealed, setRevealed] = useState(false)

  const info = useMemo(() => describeTemperature(celsius), [celsius])

  const newTemperature = useCallback(() => {
    setCelsius(randomTemperature())
    setRevealed(false)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => void navigate('/')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
            Temperature · 氣溫
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
                    Temperature
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                    {info.englishLabel}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Ruby item={QUESTION_LABEL} size="1.75rem" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    (What is today's temperature — how many degrees?)
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
                  <Ruby item={info.exact} />
                  {info.approximate ? (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Approximate (X-something degrees)
                      </Typography>
                      <Ruby item={info.approximate} size="1.5rem" />
                    </Box>
                  ) : null}
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
              onClick={newTemperature}
            >
              New Temperature
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
