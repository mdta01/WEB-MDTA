import { create } from 'zustand'

/**
 * Comment panel global state.
 *
 * Why a global store (not per-card local state)?
 * — Only ONE comment panel can be open at a time across the entire app.
 * — When user clicks "Komentar" on card B while card A's panel is open,
 *   we want panel A to auto-close and panel B to open seamlessly.
 * — This is the same UX pattern Facebook uses.
 *
 * The CommentPanel component is mounted ONCE at the root (page.tsx).
 * It reads this store and renders when isOpen === true.
 */

export type CommentItemType = 'news' | 'dakwah'

interface CommentState {
  isOpen: boolean
  itemType: CommentItemType | null
  itemId: string | null
  itemTitle: string
  /** parentId of the comment being replied to (null = top-level comment) */
  replyTo: { id: string; name: string } | null

  /** Open the panel for a specific item. Closes any previously open panel. */
  open: (itemType: CommentItemType, itemId: string, itemTitle: string) => void
  /** Close the panel. */
  close: () => void
  /** Set the reply target. null clears reply mode. */
  setReplyTo: (target: { id: string; name: string } | null) => void
}

export const useCommentStore = create<CommentState>((set) => ({
  isOpen: false,
  itemType: null,
  itemId: null,
  itemTitle: '',
  replyTo: null,

  open: (itemType, itemId, itemTitle) =>
    set({
      isOpen: true,
      itemType,
      itemId,
      itemTitle,
      replyTo: null, // reset reply target when opening new item
    }),

  close: () =>
    set({
      isOpen: false,
      // Keep itemId/itemType so exit animation can still render content.
      // They'll be cleared on next open().
      replyTo: null,
    }),

  setReplyTo: (target) => set({ replyTo: target }),
}))
