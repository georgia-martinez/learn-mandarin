import { useMemo, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeProvider, createTheme } from '@mui/material/styles'

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
      }),
    [prefersDarkMode],
  )
  const [count, setCount] = useState(0)
  const platform = window.electronAPI?.platform

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

        <Container component="main" maxWidth="md" sx={{ py: 4, flex: 1 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1">
              React + Electron + Material UI
            </Typography>
            <Typography color="text.secondary">
              Run <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>npm run electron</Typography> for the desktop shell, or{' '}
              <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>npm run dev</Typography> for the Vite dev server in the browser.
            </Typography>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="subtitle1">Interactive demo</Typography>
                <Button variant="contained" color="primary" onClick={() => setCount((c) => c + 1)}>
                  Count is {count}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
