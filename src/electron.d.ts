import type { FlashCard } from './flashcardStorage'

export {}

declare global {
  interface Window {
    electronAPI?: {
      platform: NodeJS.Platform
      loadCards: () => Promise<unknown>
      saveCards: (cards: FlashCard[]) => Promise<void>
      loadDecks: () => Promise<unknown>
      saveDeck: (deck: unknown) => Promise<void>
      deleteDeck: (deckId: string) => Promise<void>
    }
  }
}
