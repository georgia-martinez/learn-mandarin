import type { FlashCard } from './flashcardStorage'

export {}

declare global {
  interface Window {
    electronAPI?: {
      platform: NodeJS.Platform
      loadCards: () => Promise<unknown>
      saveCards: (cards: FlashCard[]) => Promise<void>
    }
  }
}
