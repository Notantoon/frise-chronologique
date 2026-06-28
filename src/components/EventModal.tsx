import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { TimelineEvent } from '../types'
import { EVENT_COLORS } from '../types'

// ─── Helpers date ─────────────────────────────────────────────────────────────
const MONTH_SHORT = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const MONTHS = [
  { v: 1, l: 'Janvier' }, { v: 2, l: 'Février' }, { v: 3, l: 'Mars' },
  { v: 4, l: 'Avril' }, { v: 5, l: 'Mai' }, { v: 6, l: 'Juin' },
  { v: 7, l: 'Juillet' }, { v: 8, l: 'Août' }, { v: 9, l: 'Septembre' },
  { v: 10, l: 'Octobre' }, { v: 11, l: 'Novembre' }, { v: 12, l: 'Décembre' },
]

function buildDateLabel(year: number, month?: number, day?: number): string {
  if (!year || isNaN(year)) return ''
  if (!month) return `${year}`
  const m = MONTH_SHORT[month - 1]
  if (!day) return `${m} ${year}`
  return `${day} ${m} ${year}`
}

// ─── Composant ────────────────────────────────────────────────────────────────
interface Props {
  profileId: string
  event?: TimelineEvent
  onSave: (event: Omit<TimelineEvent, 'id' | 'created_at'>) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}

export function EventModal({ profileId, event, onSave, onClose, onDelete }: Props) {
  const isEdit = Boolean(event)

  const [year, setYear] = useState(event?.year?.toString() ?? '')
  const [month, setMonth] = useState<number | undefined>(event?.month)
  const [day, setDay] = useState<number | undefined>(event?.day)
  const [dateLabel, setDateLabel] = useState(event?.date_label ?? '')
  // Pour les événements existants, on ne touche pas au label sauf si on change les champs date
  const [manualLabel, setManualLabel] = useState(isEdit)
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [color, setColor] = useState(event?.color ?? EVENT_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-remplissage du label de date
  useEffect(() => {
    if (manualLabel) return
    const y = parseInt(year, 10)
    setDateLabel(buildDateLabel(y, month, day))
  }, [year, month, day, manualLabel])

  const handleMonthChange = (val: number | undefined) => {
    setMonth(val)
    if (!val) setDay(undefined)
    setManualLabel(false)
  }

  const handleDayChange = (val: number | undefined) => {
    setDay(val)
    setManualLabel(false)
  }

  const handleSave = async () => {
    const yearNum = parseInt(year, 10)
    if (!year || isNaN(yearNum) || yearNum < 1700 || yearNum > 2030) {
      setError('Année invalide — doit être entre 1700 et 2030')
      return
    }
    if (!title.trim()) {
      setError('Le titre est obligatoire')
      return
    }
    if (day && !month) {
      setError('Sélectionne un mois avant le jour')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSave({
        profile_id: profileId,
        year: yearNum,
        month,
        day,
        date_label: dateLabel.trim() || year,
        title: title.trim(),
        description: description.trim() || undefined,
        color,
      })
    } catch {
      setError('Erreur lors de la sauvegarde. Réessaie.')
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSave()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">
            {isEdit ? "Modifier l'événement" : 'Nouvel événement'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="px-5 py-4 space-y-4">
          {/* Ligne date : Année | Mois | Jour */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Année <span className="text-indigo-400">*</span>
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => { setYear(e.target.value); setError(''); setManualLabel(false) }}
                onKeyDown={handleKeyDown}
                placeholder="1914"
                min={1700}
                max={2030}
                autoFocus
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Mois</label>
              <select
                value={month ?? ''}
                onChange={(e) => handleMonthChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all bg-white appearance-none"
              >
                <option value="">—</option>
                {MONTHS.map((m) => (
                  <option key={m.v} value={m.v}>{m.l.slice(0, 3)}.</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Jour</label>
              <input
                type="number"
                value={day ?? ''}
                onChange={(e) => {
                  const v = e.target.value ? parseInt(e.target.value, 10) : undefined
                  handleDayChange(v && v >= 1 && v <= 31 ? v : undefined)
                }}
                onKeyDown={handleKeyDown}
                placeholder="14"
                min={1}
                max={31}
                disabled={!month}
                className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Label affiché (auto-rempli) */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Date affichée
              <span className="ml-1 text-slate-300 font-normal">(auto-remplie)</span>
            </label>
            <input
              type="text"
              value={dateLabel}
              onChange={(e) => { setDateLabel(e.target.value); setManualLabel(true) }}
              onKeyDown={handleKeyDown}
              placeholder="ex : 28 juil. 1914"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all"
            />
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Titre <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              placeholder="Déclaration de guerre de l'Autriche"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails, contexte, notes…"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c,
                    transform: color === c ? 'scale(1.25)' : undefined,
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Pied de modal */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          {isEdit && onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 size={13} />
              Supprimer
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-60"
            >
              {saving ? 'Sauvegarde…' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
