import { type FlashCard, normalizeCards } from './flashcardStorage'

export type Deck = {
  id: string
  title: string
  cards: FlashCard[]
}

const LOCAL_STORAGE_KEY = 'learn-mandarin-decks'
const LEGACY_CARDS_KEY = 'learn-mandarin-flashcards'

function normalizeDeck(raw: unknown): Deck | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'string' && r.id.length > 0 ? r.id : crypto.randomUUID()
  const title = typeof r.title === 'string' ? r.title : 'Untitled Deck'
  const cards = normalizeCards(r.cards)
  return { id, title, cards }
}

export function normalizeDecks(data: unknown): Deck[] {
  if (!Array.isArray(data)) return []
  return data.map(normalizeDeck).filter((d): d is Deck => d !== null)
}

export async function loadDecks(): Promise<Deck[]> {
  const api = window.electronAPI
  if (api?.loadDecks) {
    const raw = await api.loadDecks()
    return normalizeDecks(raw)
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const decks = normalizeDecks(JSON.parse(raw) as unknown)
      if (decks.length > 0) return decks
    }
    // Migrate legacy flat cards to a single deck
    const legacyRaw = localStorage.getItem(LEGACY_CARDS_KEY)
    if (legacyRaw) {
      const cards = normalizeCards(JSON.parse(legacyRaw) as unknown)
      if (cards.length > 0) {
        const deck: Deck = { id: crypto.randomUUID(), title: 'Vocabulary', cards }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([deck], null, 2))
        return [deck]
      }
    }
    return []
  } catch {
    return []
  }
}

export async function saveDeck(deck: Deck): Promise<void> {
  const api = window.electronAPI
  if (api?.saveDeck) {
    await api.saveDeck(deck)
    return
  }
  const all = await loadDecks()
  const idx = all.findIndex((d) => d.id === deck.id)
  if (idx >= 0) {
    all[idx] = deck
  } else {
    all.push(deck)
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all, null, 2))
}

export async function deleteDeck(deckId: string): Promise<void> {
  const api = window.electronAPI
  if (api?.deleteDeck) {
    await api.deleteDeck(deckId)
    return
  }
  const all = await loadDecks()
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(
      all.filter((d) => d.id !== deckId),
      null,
      2,
    ),
  )
}

export function nextUntitledName(existingTitles: string[]): string {
  const base = 'Untitled Deck'
  if (!existingTitles.includes(base)) return base
  let n = 2
  while (existingTitles.includes(`${base} ${n}`)) n++
  return `${base} ${n}`
}
