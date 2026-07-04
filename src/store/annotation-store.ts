import { create } from 'zustand'

interface AnnotationState {
  pendingAnnotatedImage: string | null
  setPendingAnnotatedImage: (url: string | null) => void
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  pendingAnnotatedImage: null,
  setPendingAnnotatedImage: (url) => set({ pendingAnnotatedImage: url }),
}))
