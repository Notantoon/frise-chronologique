import { useRef, useEffect, useMemo, useCallback } from 'react'
import type { TimelineEvent, DisplayMode } from '../types'

// ─── Constantes de layout ─────────────────────────────────────────────────────
const PX_PER_YEAR = 40
const START_YEAR = 1700
const END_YEAR = 2030
const H_PADDING = 80
const CONTAINER_HEIGHT = 560   // plus haut pour loger les événements sous l'axe
const AXIS_Y = 290             // axe horizontal
const LABEL_Y = AXIS_Y + 13   // étiquettes des décennies
const DOT_RADIUS = 5
const CARD_WIDTH = 152
const CARD_H_INTERMEDIATE = 52
const CARD_H_COMPLETE = 90

const TOTAL_WIDTH = H_PADDING * 2 + (END_YEAR - START_YEAR) * PX_PER_YEAR

// ─── Système de niveaux bilatéral ─────────────────────────────────────────────
//
// Niveaux PAIRS   → AU-DESSUS de l'axe (tiges vers le haut)
// Niveaux IMPAIRS → EN-DESSOUS de l'axe (tiges vers le bas, après les étiquettes)
//
// Above: taille de tige (px au-dessus de AXIS_Y)
const ABOVE_STEMS = [55, 110, 165, 220]
// Below: décalage depuis AXIS_Y (laisse ~40px pour les étiquettes de décennie)
const BELOW_OFFSETS = [50, 105, 160, 215]

// Nombre de positions visuelles distinctes = 8 (4 + 4)
const NUM_VISUAL_LEVELS = ABOVE_STEMS.length + BELOW_OFFSETS.length

interface LevelConfig {
  above: boolean
  value: number  // stem height (above) ou offset depuis AXIS_Y (below)
}

function getLevelConfig(level: number): LevelConfig {
  // Alterne : 0=dessus, 1=dessous, 2=dessus, 3=dessous ...
  const bounded = level % NUM_VISUAL_LEVELS
  if (bounded % 2 === 0) {
    const i = Math.min(bounded / 2, ABOVE_STEMS.length - 1)
    return { above: true, value: ABOVE_STEMS[i] }
  } else {
    const i = Math.min((bounded - 1) / 2, BELOW_OFFSETS.length - 1)
    return { above: false, value: BELOW_OFFSETS[i] }
  }
}

// ─── Année décimale ───────────────────────────────────────────────────────────
function eventDecimalYear(ev: TimelineEvent): number {
  const y = ev.year
  if (!ev.month) return y
  const m = (ev.month - 0.5) / 12
  const d = ev.day ? (ev.day - 0.5) / 365 : 0
  return y + m + d
}

function eventX(decimalYear: number): number {
  return H_PADDING + (decimalYear - START_YEAR) * PX_PER_YEAR
}

// ─── Calcul des positions ─────────────────────────────────────────────────────
interface EventPos {
  event: TimelineEvent
  x: number
  level: number
}

function computePositions(events: TimelineEvent[]): EventPos[] {
  const sorted = [...events].sort((a, b) => eventDecimalYear(a) - eventDecimalYear(b))
  const result: EventPos[] = []

  for (const ev of sorted) {
    const x = eventX(eventDecimalYear(ev))
    // Cherche les événements proches (dans le rayon d'une carte)
    const nearby = result.filter((p) => Math.abs(p.x - x) < CARD_WIDTH + 10)
    const taken = new Set(nearby.map((p) => p.level % NUM_VISUAL_LEVELS))

    // Premier niveau visuel disponible
    let level = 0
    while (taken.has(level % NUM_VISUAL_LEVELS) && level < NUM_VISUAL_LEVELS) level++

    result.push({ event: ev, x, level })
  }

  return result
}

// ─── Marqueurs de décennies ───────────────────────────────────────────────────
interface Decade { year: number; isMajor: boolean; isVeryMajor: boolean }
const DECADES: Decade[] = []
for (let y = START_YEAR; y <= END_YEAR; y += 10) {
  DECADES.push({ year: y, isMajor: y % 50 === 0, isVeryMajor: y % 100 === 0 })
}
const TODAY_YEAR = new Date().getFullYear()

// ─── Composant EventMarker ────────────────────────────────────────────────────
interface MarkerProps {
  pos: EventPos
  displayMode: DisplayMode
  onClick: () => void
  didDragRef: React.MutableRefObject<boolean>
}

function EventMarker({ pos, displayMode, onClick, didDragRef }: MarkerProps) {
  const { event, x, level } = pos
  const cfg = getLevelConfig(level)
  const cardH = displayMode === 'complete' ? CARD_H_COMPLETE : CARD_H_INTERMEDIATE

  // Positions de la tige et de la carte
  let stemTop: number, stemHeight: number, cardTop: number

  if (cfg.above) {
    stemHeight = cfg.value
    stemTop = AXIS_Y - stemHeight
    cardTop = Math.max(2, stemTop - cardH - 6)
  } else {
    // En dessous : tige depuis l'axe vers le bas, carte sous la tige
    stemTop = AXIS_Y + 2
    stemHeight = cfg.value - 2
    cardTop = AXIS_Y + cfg.value
  }

  const cardLeft = Math.max(4, Math.min(TOTAL_WIDTH - CARD_WIDTH - 4, x - CARD_WIDTH / 2))

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!didDragRef.current) onClick()
  }
  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <>
      {/* Tige */}
      {displayMode !== 'minimal' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: stemTop,
            width: 1,
            height: stemHeight,
            backgroundColor: event.color + '55',
          }}
        />
      )}

      {/* Carte */}
      {displayMode !== 'minimal' && (
        <div
          className="absolute rounded-xl cursor-pointer hover:shadow-md transition-shadow duration-150"
          style={{
            left: cardLeft,
            top: cardTop,
            width: CARD_WIDTH,
            padding: '7px 9px',
            backgroundColor: event.color + '12',
            borderLeft: `3px solid ${event.color}`,
          }}
          onClick={handleClick}
          onMouseDown={stopProp}
        >
          <div
            className="font-semibold leading-tight truncate"
            style={{ fontSize: 11, color: '#1e293b' }}
          >
            {event.title}
          </div>
          {displayMode === 'complete' && event.description && (
            <div
              className="mt-0.5 leading-snug"
              style={{
                fontSize: 10,
                color: '#64748b',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.description}
            </div>
          )}
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
            {event.date_label}
          </div>
        </div>
      )}

      {/* Point sur l'axe */}
      <div
        className="absolute rounded-full cursor-pointer transition-transform duration-100 hover:scale-125"
        style={{
          left: x - DOT_RADIUS,
          top: AXIS_Y - DOT_RADIUS,
          width: DOT_RADIUS * 2,
          height: DOT_RADIUS * 2,
          backgroundColor: event.color,
          boxShadow: `0 0 0 2.5px white, 0 0 0 4px ${event.color}40`,
          zIndex: 20,
        }}
        onClick={handleClick}
        onMouseDown={stopProp}
        title={`${event.title} — ${event.date_label}`}
      />
    </>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props {
  events: TimelineEvent[]
  displayMode: DisplayMode
  onEventClick: (event: TimelineEvent) => void
}

export function TimelineCanvas({ events, displayMode, onEventClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const didDrag = useRef(false)
  const dragStartX = useRef(0)
  const dragStartScrollLeft = useRef(0)

  const positions = useMemo(() => computePositions(events), [events])

  // Scroll initial centré sur 1900
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      const x1900 = eventX(1900)
      el.scrollLeft = Math.max(0, x1900 - el.clientWidth / 2)
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true
    didDrag.current = false
    dragStartX.current = e.pageX
    dragStartScrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return
    const dx = e.pageX - dragStartX.current
    if (Math.abs(dx) > 4) didDrag.current = true
    scrollRef.current.scrollLeft = dragStartScrollLeft.current - dx
  }, [])

  const stopDrag = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
    setTimeout(() => { didDrag.current = false }, 10)
  }, [])

  return (
    <div
      ref={scrollRef}
      className="w-full h-full overflow-x-auto overflow-y-hidden timeline-scroll no-select"
      style={{ cursor: 'grab', height: CONTAINER_HEIGHT }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <div className="relative" style={{ width: TOTAL_WIDTH, height: CONTAINER_HEIGHT }}>
        {/* Axe */}
        <div
          className="absolute bg-slate-200"
          style={{ left: 0, right: 0, top: AXIS_Y, height: 2 }}
        />

        {/* Ligne aujourd'hui */}
        {TODAY_YEAR >= START_YEAR && TODAY_YEAR <= END_YEAR && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{
                left: eventX(TODAY_YEAR),
                top: 10,
                width: 1,
                height: CONTAINER_HEIGHT - 10,
                backgroundColor: '#f43f5e18',
              }}
            />
            <div
              className="absolute text-center font-medium pointer-events-none"
              style={{ left: eventX(TODAY_YEAR) - 20, top: LABEL_Y + 22, width: 40, fontSize: 9, color: '#fb7185' }}
            >
              Auj.
            </div>
          </>
        )}

        {/* Marqueurs de décennies */}
        {DECADES.map(({ year, isMajor, isVeryMajor }) => {
          const x = eventX(year)
          const tickH = isVeryMajor ? 10 : isMajor ? 6 : 3
          return (
            <div key={year}>
              <div
                className="absolute pointer-events-none"
                style={{
                  left: x, top: AXIS_Y - tickH,
                  width: 1, height: tickH * 2,
                  backgroundColor: isVeryMajor ? '#94a3b8' : isMajor ? '#cbd5e1' : '#e2e8f0',
                }}
              />
              <div
                className="absolute text-center pointer-events-none"
                style={{
                  left: x - 20, top: LABEL_Y, width: 40,
                  fontSize: isVeryMajor ? 11 : 10,
                  fontWeight: isVeryMajor ? 600 : 400,
                  color: isVeryMajor ? '#64748b' : '#94a3b8',
                }}
              >
                {year}
              </div>
            </div>
          )
        })}

        {/* Événements */}
        {positions.map((pos) => (
          <EventMarker
            key={pos.event.id}
            pos={pos}
            displayMode={displayMode}
            onClick={() => onEventClick(pos.event)}
            didDragRef={didDrag}
          />
        ))}

        {/* État vide */}
        {events.length === 0 && (
          <div
            className="absolute pointer-events-none text-center"
            style={{ left: '50%', top: AXIS_Y - 60, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
          >
            <p className="text-sm text-slate-300">Aucun événement sur cette frise</p>
          </div>
        )}
      </div>
    </div>
  )
}
