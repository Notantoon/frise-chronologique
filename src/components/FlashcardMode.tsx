import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Trophy } from 'lucide-react'
import type { TimelineEvent } from '../types'

type Mode = 'date-to-event' | 'event-to-date'
type Phase = 'select' | 'playing' | 'finished'

interface Props {
  events: TimelineEvent[]
  profileName: string
  onBack: () => void
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function FlashcardMode({ events, profileName, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('select')
  const [mode, setMode] = useState<Mode>('date-to-event')
  const [cards, setCards] = useState<TimelineEvent[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const startGame = (m: Mode) => {
    setMode(m)
    setCards(shuffled(events))
    setIdx(0)
    setFlipped(false)
    setPhase('playing')
  }

  const restart = useCallback(() => {
    setCards(shuffled(events))
    setIdx(0)
    setFlipped(false)
    setPhase('playing')
  }, [events])

  const goNext = useCallback(() => {
    if (idx < cards.length - 1) {
      setIdx((i) => i + 1)
      setFlipped(false)
    } else {
      setPhase('finished')
    }
  }, [idx, cards.length])

  const goPrev = useCallback(() => {
    if (idx > 0) {
      setIdx((i) => i - 1)
      setFlipped(false)
    }
  }, [idx])

  const handleFlip = useCallback(() => {
    setFlipped((f) => !f)
  }, [])

  // Navigation clavier
  useEffect(() => {
    if (phase !== 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === ' ') {
        e.preventDefault()
        handleFlip()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, goNext, goPrev, handleFlip])

  // ── Sélection du mode ──────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Flashcards</h2>
            <p className="text-xs text-slate-400">{profileName}</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4">
          <div className="text-center mb-2">
            <span className="text-4xl">🎴</span>
            <h3 className="text-lg font-bold text-slate-700 mt-3 mb-1">
              Choisir un mode
            </h3>
            <p className="text-sm text-slate-400">
              {events.length} événement{events.length > 1 ? 's' : ''} dans cette frise
            </p>
          </div>

          {/* Mode 1 : Date → Événement */}
          <button
            onClick={() => startGame('date-to-event')}
            className="w-full max-w-sm bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md rounded-2xl p-5 text-left transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-indigo-100 transition-colors">
                📅
              </div>
              <div>
                <div className="font-bold text-slate-700 text-sm">Date → Événement</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Je vois une date, je retrouve l&apos;événement
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded-full font-medium">
                Mémorisation
              </span>
              <span className="text-slate-300">→</span>
            </div>
          </button>

          {/* Mode 2 : Événement → Date */}
          <button
            onClick={() => startGame('event-to-date')}
            className="w-full max-w-sm bg-white border-2 border-violet-200 hover:border-violet-400 hover:shadow-md rounded-2xl p-5 text-left transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-violet-100 transition-colors">
                📖
              </div>
              <div>
                <div className="font-bold text-slate-700 text-sm">Événement → Date</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Je vois l&apos;événement, je retrouve la date
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-violet-50 text-violet-500 px-2.5 py-1 rounded-full font-medium">
                Plus difficile
              </span>
              <span className="text-slate-300">→</span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ── Écran de fin ──────────────────────────────────────────────────────────
  if (phase === 'finished') {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setPhase('select')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="font-bold text-slate-800 text-sm">Flashcards — {profileName}</h2>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <Trophy size={52} className="text-amber-400" />
          <div>
            <h3 className="text-xl font-bold text-slate-700 mb-1">Terminé !</h3>
            <p className="text-sm text-slate-400">
              Tu as parcouru {cards.length} événement{cards.length > 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
            <button
              onClick={restart}
              className="flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-colors text-sm"
            >
              <Shuffle size={15} />
              Recommencer (mélangé)
            </button>
            <button
              onClick={() => setPhase('select')}
              className="py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-white transition-colors text-sm"
            >
              Changer de mode
            </button>
            <button
              onClick={onBack}
              className="py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Retour à la frise
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Jeu en cours ──────────────────────────────────────────────────────────
  const card = cards[idx]
  const progress = ((idx + 1) / cards.length) * 100
  const isLast = idx === cards.length - 1

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setPhase('select')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">
            {mode === 'date-to-event' ? 'Date → Événement' : 'Événement → Date'}
          </p>
          <p className="text-xs text-slate-400">{profileName}</p>
        </div>
        <button
          onClick={restart}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          title="Mélanger et recommencer"
        >
          <Shuffle size={15} />
        </button>
      </header>

      {/* Barre de progression */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 w-12 text-right tabular-nums">
          {idx + 1}/{cards.length}
        </span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 w-8 tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Carte flip */}
      <div className="flex-1 flex items-center justify-center px-5 py-4">
        <div
          className="w-full max-w-sm cursor-pointer"
          style={{ perspective: '1200px' }}
          onClick={handleFlip}
        >
          <div
            className="relative w-full select-none"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
              height: 280,
            }}
          >
            {/* ── Face avant ── */}
            <div
              className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col items-center justify-center p-7"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-5">
                {mode === 'date-to-event' ? 'Quel événement ?' : 'Quelle date ?'}
              </p>

              {mode === 'date-to-event' ? (
                <p className="text-3xl font-bold text-indigo-500 text-center leading-tight">
                  {card.date_label}
                </p>
              ) : (
                <div className="text-center space-y-2 px-2">
                  <p className="text-lg font-bold text-slate-700 leading-snug">{card.title}</p>
                  {card.description && (
                    <p
                      className="text-sm text-slate-500 leading-relaxed"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {card.description}
                    </p>
                  )}
                </div>
              )}

              <p className="absolute bottom-4 text-xs text-slate-300">
                Cliquer ou Espace pour retourner
              </p>
            </div>

            {/* ── Face arrière ── */}
            <div
              className="absolute inset-0 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col items-center justify-center p-7"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Point coloré de l'événement */}
              <div
                className="w-3 h-3 rounded-full mb-5"
                style={{ backgroundColor: card.color }}
              />

              {mode === 'date-to-event' ? (
                <div className="text-center space-y-2 px-2">
                  <p className="text-lg font-bold text-slate-700 leading-snug">{card.title}</p>
                  {card.description && (
                    <p
                      className="text-sm text-slate-500 leading-relaxed"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {card.description}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-3xl font-bold text-indigo-500 text-center leading-tight">
                  {card.date_label}
                </p>
              )}

              <p className="absolute bottom-4 text-xs text-slate-300">
                Cliquer pour retourner
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-6 flex items-center gap-2">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={15} />
          Préc.
        </button>

        <button
          onClick={handleFlip}
          className="flex-1 py-2.5 text-sm text-slate-500 bg-white border border-slate-200 rounded-xl hover:shadow-sm flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw size={13} />
          Retourner
        </button>

        <button
          onClick={goNext}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
            isLast
              ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm'
              : 'text-slate-600 bg-white border border-slate-200 hover:shadow-sm'
          }`}
        >
          {isLast ? 'Terminer' : 'Suiv.'}
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
