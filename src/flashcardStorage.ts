export type FlashCard = {
  id: string
  simplified: string
  traditional: string
  pinyin: string
  english: string
}

const LOCAL_STORAGE_KEY = 'learn-mandarin-flashcards'

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function normalizeOne(row: unknown): FlashCard | null {
  if (!row || typeof row !== 'object') {
    return null
  }
  const r = row as Record<string, unknown>
  const id = typeof r.id === 'string' && r.id.length > 0 ? r.id : crypto.randomUUID()
  return {
    id,
    simplified: str(r.simplified),
    traditional: str(r.traditional),
    pinyin: str(r.pinyin),
    english: str(r.english),
  }
}

export function normalizeCards(data: unknown): FlashCard[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.map(normalizeOne).filter((c): c is FlashCard => c !== null)
}

export async function loadFlashcards(): Promise<FlashCard[]> {
  const api = window.electronAPI
  if (api?.loadCards) {
    const raw = await api.loadCards()
    return normalizeCards(raw)
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) {
      return []
    }
    return normalizeCards(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

export async function saveFlashcards(cards: FlashCard[]): Promise<void> {
  const api = window.electronAPI
  if (api?.saveCards) {
    await api.saveCards(cards)
    return
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards, null, 2))
}
