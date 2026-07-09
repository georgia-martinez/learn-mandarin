/**
 * Helpers for rendering a Gregorian date the way it is spoken in Mandarin:
 * year read digit-by-digit, month/day as cardinal numbers, weekday as 星期N.
 */

/** Single digits 0–9, plus 十 for the tens helper. */
const DIGIT_HANZI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const
const DIGIT_PINYIN = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'] as const
const TEN_HANZI = '十'
const TEN_PINYIN = 'shí'

export interface HanziPinyin {
  hanzi: string
  /** Space-separated syllables, e.g. "èr shí liù". */
  pinyin: string
}

/** Cardinal number 1–99 as spoken Chinese (enough for days 1–31). */
function cardinal(n: number): HanziPinyin {
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

/** Year spoken digit-by-digit, e.g. 2026 → 二〇二六. */
export function yearToChinese(year: number): HanziPinyin {
  const digits = String(year).split('').map((d) => Number.parseInt(d, 10))
  return {
    hanzi: digits.map((d) => DIGIT_HANZI[d]).join('') + '年',
    pinyin: digits.map((d) => DIGIT_PINYIN[d]).join(' ') + ' nián',
  }
}

/** Month 1–12 as 一月…十二月. */
export function monthToChinese(month: number): HanziPinyin {
  const c = cardinal(month)
  return { hanzi: `${c.hanzi}月`, pinyin: `${c.pinyin} yuè` }
}

/** Day of month 1–31 as N號. */
export function dayToChinese(day: number): HanziPinyin {
  const c = cardinal(day)
  return { hanzi: `${c.hanzi}號`, pinyin: `${c.pinyin} hào` }
}

const WEEKDAY_HANZI = ['日', '一', '二', '三', '四', '五', '六'] as const
const WEEKDAY_PINYIN = ['rì', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù'] as const

/** Weekday from JS getDay() (0 = Sunday) as 星期N (Sunday → 星期日). */
export function weekdayToChinese(jsDay: number): HanziPinyin {
  return {
    hanzi: `星期${WEEKDAY_HANZI[jsDay]}`,
    pinyin: `xīng qī ${WEEKDAY_PINYIN[jsDay]}`,
  }
}

const WEEKDAY_ENGLISH = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export interface ChineseDate {
  year: HanziPinyin
  month: HanziPinyin
  day: HanziPinyin
  weekday: HanziPinyin
  /** English gloss like "Friday, 05/01/2026". */
  englishLabel: string
}

export function describeDate(date: Date): ChineseDate {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const wd = date.getDay()
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return {
    year: yearToChinese(y),
    month: monthToChinese(m),
    day: dayToChinese(d),
    weekday: weekdayToChinese(wd),
    englishLabel: `${WEEKDAY_ENGLISH[wd]}, ${mm}/${dd}/${y}`,
  }
}

/** A random calendar date within the given year. */
export function randomDateInYear(year: number): Date {
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  const t = start + Math.random() * (end - start)
  const date = new Date(t)
  date.setHours(0, 0, 0, 0)
  return date
}
