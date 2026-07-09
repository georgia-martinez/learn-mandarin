/**
 * Helpers for rendering a Gregorian date the way it is spoken in Mandarin:
 * year read digit-by-digit, month/day as cardinal numbers, weekday as 星期N.
 */
import { cardinal, DIGIT_HANZI, DIGIT_PINYIN, type HanziPinyin } from './chineseNumber'

export type { HanziPinyin }

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
