type VowelClass = 'a' | 'e' | 'i' | 'o' | 'u' | 'ü'

const TONED: Record<VowelClass, { lower: [string, string, string, string]; upper: [string, string, string, string] }> = {
  a: {
    lower: ['ā', 'á', 'ǎ', 'à'],
    upper: ['Ā', 'Á', 'Ǎ', 'À'],
  },
  e: {
    lower: ['ē', 'é', 'ě', 'è'],
    upper: ['Ē', 'É', 'Ě', 'È'],
  },
  i: {
    lower: ['ī', 'í', 'ǐ', 'ì'],
    upper: ['Ī', 'Í', 'Ǐ', 'Ì'],
  },
  o: {
    lower: ['ō', 'ó', 'ǒ', 'ò'],
    upper: ['Ō', 'Ó', 'Ǒ', 'Ò'],
  },
  u: {
    lower: ['ū', 'ú', 'ǔ', 'ù'],
    upper: ['Ū', 'Ú', 'Ǔ', 'Ù'],
  },
  ü: {
    lower: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
    upper: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ'],
  },
}

function classifyVowelChar(ch: string): VowelClass | null {
  const c = ch.toLowerCase()
  if (c === 'a') return 'a'
  if (c === 'e') return 'e'
  if (c === 'i') return 'i'
  if (c === 'o') return 'o'
  if (c === 'u') return 'u'
  if (c === 'v' || c === '\u00fc') return 'ü'
  return null
}

function isLetterForRun(ch: string): boolean {
  return /[a-zA-Z]/.test(ch) || ch === '\u00fc' || ch === '\u00dc'
}

/** Pinyin tone placement on the letter run before a tone digit. */
export function toneVowelIndexInRun(run: string): number {
  const vowels: { idx: number; cls: VowelClass }[] = []
  for (let i = 0; i < run.length; i++) {
    const cls = classifyVowelChar(run[i])
    if (cls) {
      vowels.push({ idx: i, cls })
    }
  }
  if (vowels.length === 0) {
    return -1
  }
  const first = (cls: VowelClass) => vowels.find((v) => v.cls === cls)?.idx ?? -1
  const a = first('a')
  if (a >= 0) {
    return a
  }
  const e = first('e')
  if (e >= 0) {
    return e
  }
  const o = first('o')
  if (o >= 0) {
    return o
  }
  const onlyIu = vowels.every((v) => v.cls === 'i' || v.cls === 'u' || v.cls === 'ü')
  if (onlyIu) {
    return vowels[vowels.length - 1].idx
  }
  return vowels[0].idx
}

function withTone(original: string, cls: VowelClass, tone: 1 | 2 | 3 | 4): string {
  if (cls === 'ü' && original.toLowerCase() === 'v') {
    return TONED.ü.lower[tone - 1]
  }
  const upper = original === original.toUpperCase() && original.toLowerCase() !== original
  const table = upper ? TONED[cls].upper : TONED[cls].lower
  return table[tone - 1]
}

/**
 * If the character before `caret` is a tone digit (1–5, 0), apply standard pinyin tone marking
 * on the preceding letter run and remove the digit. Returns null if no change.
 */
export function applyToneDigitAtCaret(value: string, caret: number): { value: string; caret: number } | null {
  if (caret < 1) {
    return null
  }
  const digitIdx = caret - 1
  const d = value[digitIdx]
  if (!/^[0-5]$/.test(d)) {
    return null
  }
  const toneNum = d === '0' ? 0 : Number.parseInt(d, 10)

  let runStart = digitIdx - 1
  while (runStart >= 0 && isLetterForRun(value[runStart])) {
    runStart--
  }
  runStart++
  const run = value.slice(runStart, digitIdx)
  if (run.length === 0) {
    return null
  }

  if (toneNum === 0 || toneNum === 5) {
    const next = value.slice(0, digitIdx) + value.slice(digitIdx + 1)
    return { value: next, caret: digitIdx }
  }
  if (toneNum < 1 || toneNum > 4) {
    return null
  }

  const local = toneVowelIndexInRun(run)
  if (local < 0) {
    return null
  }
  const globalIdx = runStart + local
  const original = value[globalIdx]
  const cls = classifyVowelChar(original)
  if (!cls) {
    return null
  }
  const toned = withTone(original, cls, toneNum as 1 | 2 | 3 | 4)
  const next =
    value.slice(0, globalIdx) + toned + value.slice(globalIdx + 1, digitIdx) + value.slice(digitIdx + 1)
  return { value: next, caret: globalIdx + toned.length }
}
