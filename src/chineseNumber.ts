/** Chinese hanzi paired with its space-separated pinyin syllables. */
export interface HanziPinyin {
  hanzi: string
  /** Space-separated syllables, e.g. "èr shí liù". */
  pinyin: string
}

/** Single digits 0–9, plus 十 for the tens helper. */
export const DIGIT_HANZI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const
export const DIGIT_PINYIN = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'] as const
const TEN_HANZI = '十'
const TEN_PINYIN = 'shí'

/** Cardinal number 1–99 as spoken Chinese. */
export function cardinal(n: number): HanziPinyin {
  if (n < 10) {
    return { hanzi: DIGIT_HANZI[n], pinyin: DIGIT_PINYIN[n] }
  }
  if (n < 20) {
    const ones = n - 10
    if (ones === 0) return { hanzi: TEN_HANZI, pinyin: TEN_PINYIN }
    return { hanzi: TEN_HANZI + DIGIT_HANZI[ones], pinyin: `${TEN_PINYIN} ${DIGIT_PINYIN[ones]}` }
  }
  const tens = Math.floor(n / 10)
  const ones = n % 10
  const hanzi = DIGIT_HANZI[tens] + TEN_HANZI + (ones === 0 ? '' : DIGIT_HANZI[ones])
  const pinyin =
    `${DIGIT_PINYIN[tens]} ${TEN_PINYIN}` + (ones === 0 ? '' : ` ${DIGIT_PINYIN[ones]}`)
  return { hanzi, pinyin }
}

/** Join hanzi/pinyin segments into one, space-joining the pinyin. */
export function joinHanziPinyin(...parts: HanziPinyin[]): HanziPinyin {
  return {
    hanzi: parts.map((p) => p.hanzi).join(''),
    pinyin: parts.map((p) => p.pinyin).join(' '),
  }
}
