import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { HanziPinyin } from './chineseNumber'

/** Characters that carry no pinyin and are skipped when zipping syllables. */
const PUNCTUATION = new Set(['，', ',', '。', '？', '?', '、', '！', '!', '/', '／'])

/**
 * Chinese hanzi with pinyin shown above — each syllable centered over its own
 * character (punctuation gets no syllable), matching the worksheet layout.
 */
export default function Ruby({ item, size = '2rem' }: { item: HanziPinyin; size?: string }) {
  const chars = [...item.hanzi]
  const syllables = item.pinyin.split(/\s+/).filter(Boolean)
  let s = 0
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 1 }}>
      {chars.map((ch, i) => {
        const pinyin = PUNCTUATION.has(ch) ? '' : (syllables[s++] ?? '')
        return (
          <Box
            key={i}
            sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <Typography
              variant="caption"
              lang="zh-Latn"
              sx={{ color: 'text.secondary', lineHeight: 1.2, fontSize: '0.8rem', minHeight: '1.2em' }}
            >
              {pinyin}
            </Typography>
            <Typography lang="zh-Hant" sx={{ fontSize: size, lineHeight: 1.25 }}>
              {ch}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
