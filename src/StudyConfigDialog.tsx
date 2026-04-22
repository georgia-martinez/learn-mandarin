import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
  ALL_STUDY_FIELDS,
  type StudyConfig,
  type StudyField,
  STUDY_FIELD_LABELS,
} from './studyTypes'

type Props = {
  open: boolean
  onClose: () => void
  onStart: (config: StudyConfig) => void
  hasCards: boolean
}

function toggleInList(list: StudyField[], field: StudyField): StudyField[] {
  if (list.includes(field)) {
    return list.filter((f) => f !== field)
  }
  return [...list, field]
}

export function StudyConfigDialog({ open, onClose, onStart, hasCards }: Props) {
  const [front, setFront] = useState<StudyField[]>(['simplified', 'traditional'])
  const [back, setBack] = useState<StudyField[]>(['pinyin', 'english'])

  const canStart = hasCards && front.length > 0 && back.length > 0

  const handleStart = () => {
    if (!canStart) {
      return
    }
    onStart({ front, back })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Study session</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
          {!hasCards ? (
            <Typography color="text.secondary">Add at least one card before studying.</Typography>
          ) : null}
          <FormControl component="fieldset" variant="standard" disabled={!hasCards}>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              Shown first (front of card)
            </FormLabel>
            <FormGroup>
              {ALL_STUDY_FIELDS.map((field) => (
                <FormControlLabel
                  key={`front-${field}`}
                  control={
                    <Checkbox
                      checked={front.includes(field)}
                      onChange={() => setFront((s) => toggleInList(s, field))}
                    />
                  }
                  label={STUDY_FIELD_LABELS[field]}
                />
              ))}
            </FormGroup>
          </FormControl>
          <FormControl component="fieldset" variant="standard" disabled={!hasCards}>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              Revealed on flip (back of card)
            </FormLabel>
            <FormGroup>
              {ALL_STUDY_FIELDS.map((field) => (
                <FormControlLabel
                  key={`back-${field}`}
                  control={
                    <Checkbox
                      checked={back.includes(field)}
                      onChange={() => setBack((s) => toggleInList(s, field))}
                    />
                  }
                  label={STUDY_FIELD_LABELS[field]}
                />
              ))}
            </FormGroup>
          </FormControl>
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Choose one or more fields for each side. The same field can appear on both sides.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleStart} disabled={!canStart}>
          Start studying
        </Button>
      </DialogActions>
    </Dialog>
  )
}
