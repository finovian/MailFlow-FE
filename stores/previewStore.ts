import { create } from 'zustand'

interface PreviewStore {
  mockPayload: Record<string, unknown>
  setMockPayload: (payload: Record<string, unknown>) => void
  viewportMode: 'desktop' | 'mobile'
  setViewportMode: (mode: 'desktop' | 'mobile') => void
}

export const usePreviewStore = create<PreviewStore>((set) => ({
  mockPayload: {},
  setMockPayload: (payload) => set({ mockPayload: payload }),
  viewportMode: 'desktop',
  setViewportMode: (mode) => set({ viewportMode: mode }),
}))
