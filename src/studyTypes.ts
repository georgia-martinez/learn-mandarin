import type { FlashCard } from './flashcardStorage'

export type StudyField = 'pinyin' | 'simplified' | 'traditional' | 'english'

export const ALL_STUDY_FIELDS: readonly StudyField[] = [
  'pinyin',
  'simplified',
  'traditional',
  'english',
] as const

export const STUDY_FIELD_LABELS: Record<StudyField, string> = {
  pinyin: 'Pinyin',
  simplified: 'Simplified',
  traditional: 'Traditional',
  english: 'English',
}

export function getFieldValue(card: FlashCard, field: StudyField): string {
  return card[field] ?? ''
}

export type StudyConfig = {
  front: StudyField[]
  back: StudyField[]
}
