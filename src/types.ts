export type DisplayMode = 'minimal' | 'intermediate' | 'complete'

export interface Profile {
  id: string
  workspace_id: string
  name: string
  created_at: string
}

export interface TimelineEvent {
  id: string
  profile_id: string
  year: number          // Année pour le positionnement (ex: 1789)
  date_label: string    // Texte affiché (ex: "14 juillet 1789")
  title: string
  description?: string
  color: string
  created_at: string
}

export const EVENT_COLORS = [
  '#4F86F7', // Bleu
  '#22C55E', // Vert
  '#EF4444', // Rouge
  '#F59E0B', // Ambre
  '#A855F7', // Violet
  '#EC4899', // Rose
  '#F97316', // Orange
  '#14B8A6', // Sarcelle
]
