import { useState } from 'react'
import { Plus, ChevronRight, Trash2, Settings, BookOpen } from 'lucide-react'
import type { Profile } from '../types'
import { isSupabaseConfigured } from '../lib/supabase'

interface Props {
  profiles: Profile[]
  loading: boolean
  onSelect: (profile: Profile) => void
  onCreateProfile: (name: string) => Promise<void>
  onDeleteProfile: (id: string) => void
  onOpenSettings: () => void
}

const PROFILE_EMOJIS = ['📚', '🔬', '🌍', '📅', '⚡', '🎨', '🏛️', '🌱']

export function ProfileList({
  profiles,
  loading,
  onSelect,
  onCreateProfile,
  onDeleteProfile,
  onOpenSettings,
}: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await onCreateProfile(newName.trim())
      setNewName('')
      setIsCreating(false)
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') { setIsCreating(false); setNewName('') }
  }

  const getEmoji = (index: number) => PROFILE_EMOJIS[index % PROFILE_EMOJIS.length]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-sm mx-auto px-4 py-10">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={18} className="text-indigo-500" />
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Mes frises
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              {isSupabaseConfigured ? 'Synchronisé ☁' : 'Stockage local'}
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm transition-all"
            title="Paramètres"
          >
            <Settings size={17} />
          </button>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="group flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
              >
                <button
                  onClick={() => onSelect(profile)}
                  className="flex-1 flex items-center gap-3 px-4 py-4 text-left"
                >
                  <span className="text-xl flex-shrink-0">{getEmoji(index)}</span>
                  <span className="font-semibold text-slate-700 text-sm">{profile.name}</span>
                  <ChevronRight
                    size={15}
                    className="ml-auto text-slate-300 group-hover:text-slate-400 transition-colors"
                  />
                </button>
                <button
                  onClick={() => onDeleteProfile(profile.id)}
                  className="pr-4 pl-1 py-4 text-slate-300 hover:text-red-400 transition-colors"
                  title="Supprimer cette frise"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {profiles.length === 0 && !isCreating && (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">📅</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Aucune frise pour l'instant.
                  <br />
                  Crée-en une pour commencer !
                </p>
              </div>
            )}
          </div>
        )}

        {/* Création */}
        {isCreating ? (
          <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nom de la frise (ex: Histoire)"
              autoFocus
              className="w-full text-sm text-slate-800 placeholder-slate-300 focus:outline-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setIsCreating(false); setNewName('') }}
                className="px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="px-4 py-1.5 text-sm bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-3.5 flex items-center justify-center gap-2 text-sm text-indigo-500 font-medium border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all"
          >
            <Plus size={16} />
            Nouvelle frise
          </button>
        )}
      </div>
    </div>
  )
}
