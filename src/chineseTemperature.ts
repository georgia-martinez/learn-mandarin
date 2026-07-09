/**
 * Rendering an air temperature the way it is spoken in Mandarin:
 * 零上 (above zero) / 零下 (below zero) + number + 度, with the worksheet's
 * approximate "X多度" (X-something degrees) form for non-round readings.
 */
import { cardinal, joinHanziPinyin, type HanziPinyin } from './chineseNumber'

const TODAY_TEMP_IS: HanziPinyin = { hanzi: '今天氣溫是', pinyin: 'jīn tiān qì wēn shì' }
const ABOVE_ZERO: HanziPinyin = { hanzi: '零上', pinyin: 'líng shàng' }
const BELOW_ZERO: HanziPinyin = { hanzi: '零下', pinyin: 'líng xià' }
const DEGREE: HanziPinyin = { hanzi: '度', pinyin: 'dù' }
const ZERO: HanziPinyin = { hanzi: '零', pinyin: 'líng' }
const MANY: HanziPinyin = { hanzi: '多', pinyin: 'duō' }

export interface ChineseTemperature {
  /** e.g. "23°C" / "-7°C". */
  englishLabel: string
  /** Exact spoken form, e.g. 零上二十三度. */
  exact: HanziPinyin
  /** Approximate "X多度" form, or null when the temperature is a round ten / under 10. */
  approximate: HanziPinyin | null
}

export function describeTemperature(celsius: number): ChineseTemperature {
  const englishLabel = `${celsius}°C`
  const magnitude = Math.abs(celsius)

  if (celsius === 0) {
    return {
      englishLabel,
      exact: joinHanziPinyin(TODAY_TEMP_IS, ZERO, DEGREE),
      approximate: null,
    }
  }

  const sign = celsius > 0 ? ABOVE_ZERO : BELOW_ZERO
  const exact = joinHanziPinyin(TODAY_TEMP_IS, sign, cardinal(magnitude), DEGREE)

  // "X多度" only makes sense for a value above ten with a non-zero ones digit,
  // e.g. 23 → 二十多度 (twenty-something degrees).
  const tens = Math.floor(magnitude / 10) * 10
  const hasApprox = magnitude > 10 && magnitude % 10 !== 0
  const approximate = hasApprox
    ? joinHanziPinyin(TODAY_TEMP_IS, sign, cardinal(tens), MANY, DEGREE)
    : null

  return { englishLabel, exact, approximate }
}

/** A random whole-degree temperature within [min, max] (inclusive). */
export function randomTemperature(min = -30, max = 45): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
