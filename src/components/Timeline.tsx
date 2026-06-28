import { useState } from 'react'
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Circle,
  AlignLeft,
  AlignJustify,
  Layers,
} from 'lucide-react'
import type { Profile, TimelineEvent, DisplayMode } from '../types'
import { TimelineCanvas } from './TimelineCanvas'
import { EventModal } from './EventModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { FlashcardMode } from './FlashcardMode'

interface Props {
  profile: Profile
  events: TimelineEvent[]
  onBack: () => void
  onAddEvent: (event: Omit<TimelineEvent, 'id' | 'created_at'>) => Promise<void>
  onUpdateEvent: (event: TimelineEvent) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
}

const DISPLAY_MODES: { mode: DisplayMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'minimal', icon: <Circle size={12} />, label: 'Minimal' },
  { mode: 'intermediate', icon: <AlignLeft size={12} />, label: 'Titres' },
  { mode: 'complete', icon: <AlignJustify size={12} />, label: 'Complet' },
]

export function Timeline({ profile, events, onBack, onAddEvent, onUpdateEvent, onDeleteEvent }: Props) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('intermediate')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TimelineEvent | null>(null)
  const [showFlashcards, setShowFlashcards] = useState(false)

  // ── Mode flashcards ────────────────────────────────────────────────────────
  if (showFlashcards) {
    return (
      <FlashcardMode
        events={events}
        profileName={profile.name}
        onBack={() => setShowFlashcards(false)}
      />
    )
  }

  const filteredEvents = searchQuery.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.date_label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events

  const handleAdd = async (data: Omit<TimelineEvent, 'id' | 'created_at'>) => {
    await onAddEvent(data)
    setShowAddModal(false)
  }

  const handleUpdate = async (data: Omit<TimelineEvent, 'id' | 'created_at'>) => {
    if (!editingEvent) return
    await onUpdateEvent({ ...editingEvent, ...data })
    setEditingEvent(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await onDeleteEvent(deleteTarget.id)
    setDeleteTarget(null)
  }

  const openDeleteFromEdit = () => {
    if (!editingEvent) return
    const target = editingEvent
    setEditingEvent(null)
    setDeleteTarget(target)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Barre d'outils */}
      <div className="bg-white border-b border-slate-100 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        {showSearch ? (
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un événement…"
              autoFocus
              className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <h2 className="flex-1 font-bold text-slate-800 text-sm truncate">{profile.name}</h2>

            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
              title="Rechercher"
            >
              <Search size={15} />
            </button>

            {/* Bouton Flashcards */}
            <button
              onClick={() => setShowFlashcards(true)}
              disabled={events.length === 0}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Mode flashcards"
            >
              <Layers size={15} />
            </button>

            {/* Mode d'affichage */}
            <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
              {DISPLAY_MODES.map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setDisplayMode(mode)}
                  title={label}
                  className={`p-1.5 rounded-lg transition-all ${
                    displayMode === mode
                      ? 'bg-white text-indigo-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Bandeau recherche */}
      {searchQuery.trim() && (
        <div className="px-4 py-1.5 text-xs text-indigo-600 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
          {filteredEvents.length === 0
            ? 'Aucun résultat'
            : `${filteredEvents.length} résultat${filteredEvents.length > 1 ? 's' : ''} pour « ${searchQuery} »`}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <TimelineCanvas
          events={filteredEvents}
          displayMode={displayMode}
          onEventClick={setEditingEvent}
        />
      </div>

      {/* Barre du bas */}
      <div className="bg-white border-t border-slate-100 px-4 py-2 flex-shrink-0 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {events.length} événement{events.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setShowFlashcards(true)}
          disabled={events.length === 0}
          className="text-xs text-indigo-400 hover:text-indigo-600 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Layers size={11} />
          Flashcards
        </button>
      </div>

      {showAddModal && (
        <EventModal
          profileId={profile.id}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingEvent && (
        <EventModal
          profileId={profile.id}
          event={editingEvent}
          onSave={handleUpdate}
          onClose={() => setEditingEvent(null)}
          onDelete={openDeleteFromEdit}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
