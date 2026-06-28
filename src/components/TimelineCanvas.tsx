import { useRef, useEffect, useMemo, useCallback } from 'react'
import type { TimelineEvent, DisplayMode } from '../types'

// ─── Constantes de layout ─────────────────────────────────────────────────────
const PX_PER_YEAR = 40         // pixels par année
const START_YEAR = 1700
const END_YEAR = 2030
const H_PADDING = 80           // marge gauche/droite
const CONTAINER_HEIGHT = 440   // hauteur totale du canvas
const AXIS_Y = 340             // position de l'axe depuis le haut
const LABEL_Y = AXIS_Y + 14   // position des étiquettes de décennie
const DOT_RADIUS = 5

// Hauteur des tiges (distance entre l'axe et le bas de la carte)
const LEVEL_HEIGHTS = [55, 115, 175, 235]

// Largeur des cartes d'événements
const CARD_WIDTH = 152

// Hauteur des cartes selon le mode
const CARD_H_INTERMEDIATE = 52
const CARD_H_COMPLETE = 90

const TOTAL_WIDTH = H_PADDING * 2 + (END_YEAR - START_YEAR) * PX_PER_YEAR

function eventX(year: number): number {
  return H_PADDING + (year - START_YEAR) * PX_PER_YEAR
}

// ─── Calcul des positions ─────────────────────────────────────────────────────
interface EventPos {
  event: TimelineEvent
  x: number
  level: number
}

function computePositions(events: TimelineEvent[]): EventPos[] {
  const sorted = [...events].sort((a, b) => a.year - b.year)
  const result: EventPos[] = []

  for (const ev of sorted) {
    const x = eventX(ev.year)
    const nearby = result.filter((p) => Math.abs(p.x - x) < CARD_WIDTH + 10)
    const taken = new Set(nearby.map((p) => p.level))

    let level = 0
    while (taken.has(level) && level < LEVEL_HEIGHTS.length - 1) level++

    result.push({ event: ev, x, level })
  }

  return result
}

// ─── Marqueurs de décennies ───────────────────────────────────────────────────
interface Decade {
  year: number
  isMajor: boolean    // multiple de 50
  isVeryMajor: boolean // multiple de 100
}

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
  const stemH = LEVEL_HEIGHTS[level]
  const stemTopY = AXIS_Y - stemH

  const cardH = displayMode === 'complete' ? CARD_H_COMPLETE : CARD_H_INTERMEDIATE
  const cardTopY = Math.max(4, stemTopY - cardH - 6)
  const cardLeft = Math.max(4, Math.min(TOTAL_WIDTH - CARD_WIDTH - 4, x - CARD_WIDTH / 2))

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!didDragRef.current) onClick()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <g>
      {/* Tige verticale */}
      {displayMode !== 'minimal' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: stemTopY,
            width: 1,
            height: stemH,
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
            top: cardTopY,
            width: CARD_WIDTH,
            padding: '7px 9px',
            backgroundColor: event.color + '12',
            borderLeft: `3px solid ${event.color}`,
          }}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
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
        onMouseDown={handleMouseDown}
        title={`${event.title} — ${event.date_label}`}
      />
    </g>
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
    // Réinitialise didDrag après un tick (le click event arrive après mouseup)
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
      <div
        className="relative"
        style={{ width: TOTAL_WIDTH, height: CONTAINER_HEIGHT }}
      >
        {/* Axe */}
        <div
          className="absolute bg-slate-200"
          style={{ left: 0, right: 0, top: AXIS_Y, height: 2 }}
        />

        {/* Ligne "aujourd'hui" */}
        {TODAY_YEAR >= START_YEAR && TODAY_YEAR <= END_YEAR && (
          <>
            <div
              className="absolute"
              style={{
                left: eventX(TODAY_YEAR),
                top: 20,
                width: 1,
                height: AXIS_Y - 16,
                backgroundColor: '#f43f5e25',
              }}
            />
            <div
              className="absolute text-center font-medium"
              style={{
                left: eventX(TODAY_YEAR) - 20,
                top: LABEL_Y + 22,
                width: 40,
                fontSize: 9,
                color: '#fb7185',
              }}
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
                  left: x,
                  top: AXIS_Y - tickH,
                  width: 1,
                  height: tickH * 2,
                  backgroundColor: isVeryMajor ? '#94a3b8' : isMajor ? '#cbd5e1' : '#e2e8f0',
                }}
              />
              <div
                className="absolute text-center pointer-events-none"
                style={{
                  left: x - 20,
                  top: LABEL_Y,
                  width: 40,
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
            style={{
              left: '50%',
              top: AXIS_Y - 70,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}
          >
            <p className="text-sm text-slate-300">Aucun événement sur cette frise</p>
          </div>
        )}
      </div>
    </div>
  )
}
