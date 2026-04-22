import { useMemo } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme, type Shadows } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import VocabularyView from './VocabularyView'
import StudyPage from './StudyPage'

const flatShadows = Array(25).fill('none') as Shadows

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<VocabularyView />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
