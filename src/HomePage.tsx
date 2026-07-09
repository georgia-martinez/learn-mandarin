import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined'
import type { SvgIconComponent } from '@mui/icons-material'

interface Exercise {
  title: string
  description: string
  icon: SvgIconComponent
  path: string
}

const exercises: Exercise[] = [
  {
    title: 'Flashcard Decks',
    description: 'Review vocabulary with your study decks.',
    icon: StyleOutlinedIcon,
    path: '/decks',
  },
  {
    title: 'Date',
    description: "Practice saying a random date in Mandarin.",
    icon: CalendarMonthOutlinedIcon,
    path: '/date',
  },
  {
    title: 'Temperature',
    description: "Practice saying a random temperature in Mandarin.",
    icon: ThermostatOutlinedIcon,
    path: '/temperature',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const platform = window.electronAPI?.platform

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
          <Typography variant="h4" component="h1">
            Exercises
          </Typography>

          <Stack spacing={2}>
            {exercises.map((exercise) => {
              const Icon = exercise.icon
              return (
                <Card key={exercise.path} variant="outlined">
                  <CardActionArea onClick={() => void navigate(exercise.path)}>
                    <CardContent>
                      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Icon color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h6" component="div">
                            {exercise.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {exercise.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              )
            })}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
