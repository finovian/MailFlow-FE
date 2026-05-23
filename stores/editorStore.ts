import { create } from 'zustand'
import { type EventType } from '@/constants/eventTypes'

interface EditorStore {
  mode: 'visual' | 'raw'
  setMode: (mode: 'visual' | 'raw') => void
  isAIPanelOpen: boolean
  toggleAIPanel: () => void
  detectedVariables: string[]
  setDetectedVariables: (vars: string[]) => void
  eventType: EventType
  setEventType: (type: EventType) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  mode: 'visual',
  setMode: (mode) => set({ mode }),
  isAIPanelOpen: false,
  toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
  detectedVariables: [],
  setDetectedVariables: (vars) => set({ detectedVariables: vars }),
  eventType: 'user.created',
  setEventType: (eventType) => set({ eventType }),
}))
