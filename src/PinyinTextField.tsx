import { useLayoutEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import { applyToneDigitAtCaret } from './pinyinTone'

type Props = {
  value: string
  onValueChange: (value: string) => void
} & Omit<TextFieldProps, 'value' | 'onChange' | 'multiline'>

export function PinyinTextField({ value, onValueChange, ...rest }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingCaret = useRef<number | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const caret = input.selectionStart ?? input.value.length
    const applied = applyToneDigitAtCaret(input.value, caret)
    if (applied) {
      pendingCaret.current = applied.caret
      onValueChange(applied.value)
      return
    }
    onValueChange(input.value)
  }

  useLayoutEffect(() => {
    const el = inputRef.current
    const pos = pendingCaret.current
    if (el && pos != null) {
      pendingCaret.current = null
      el.setSelectionRange(pos, pos)
    }
  }, [value])

  return (
    <TextField
      {...rest}
      value={value}
      onChange={handleChange}
      inputRef={inputRef}
      multiline={false}
    />
  )
}
