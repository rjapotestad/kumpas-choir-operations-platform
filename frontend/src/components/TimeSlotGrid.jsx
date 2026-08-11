import { useDroppable, useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import {
  getTotalSlots,
  ROW_HEIGHT,
  SLOT_MINUTES,
  LABEL_EVERY_N_SLOTS,
  slotIndexToTime,
  timeToSlotIndex,
  durationToSlotSpan,
  formatTimeLabel,
} from '../utils/timeGrid'

// A curated on-brand palette for song blocks — the three brand accent hues
// plus a couple of tints derived from them, so blocks read as distinct even
// when there are more blocks than base colors. Each pairing keeps text
// readable against its own fill (dark text on the lighter/brighter swatches).
const BLOCK_COLORS = [
  { bg: '#EE4004', text: '#ffffff', buttonBg: 'rgba(255,255,255,0.22)' }, // Vermilion
  { bg: '#53863b', text: '#ffffff', buttonBg: 'rgba(255,255,255,0.22)' }, // Olivine
  { bg: '#F5E439', text: '#042a37', buttonBg: 'rgba(4,42,55,0.15)' },     // Sunrise
  { bg: '#f97144', text: '#042a37', buttonBg: 'rgba(4,42,55,0.15)' },     // Vermilion tint
  { bg: '#7fb65c', text: '#042a37', buttonBg: 'rgba(4,42,55,0.15)' },     // Olivine tint
  { bg: '#d9be1b', text: '#042a37', buttonBg: 'rgba(4,42,55,0.15)' },     // Sunrise shade
]

function getBlockColor(itemId) {
  return BLOCK_COLORS[itemId % BLOCK_COLORS.length]
}

function DroppableSlot({ index }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    data: { slotIndex: index },
  })

  return <div ref={setNodeRef} className={`time-slot ${isOver ? 'time-slot-over' : ''}`} />
}

function TimeGutter({ startTime, totalSlots }) {
  return (
    <div className="time-gutter" style={{ position: 'relative' }}>
      {Array.from({ length: totalSlots }, (_, index) => (
        <div key={index} className="time-gutter-row">
          {index % LABEL_EVERY_N_SLOTS === 0 && (
            <span className="time-label">{formatTimeLabel(slotIndexToTime(index, startTime))}</span>
          )}
        </div>
      ))}
      {/* Boundary label marking the end of the window — sits right on the
          grid's last gridline, not a real row/slot of its own */}
      <span
        className="time-label time-label-boundary"
        style={{ position: 'absolute', top: totalSlots * ROW_HEIGHT, right: 0 }}
      >
        {formatTimeLabel(slotIndexToTime(totalSlots, startTime))}
      </span>
    </div>
  )
}

function PlacedItemOverlay({ item, onRemoveItem, onResizeItem, startTime, totalSlots }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `item-${item.id}`,
    data: { item },
  })

  const startSlot = timeToSlotIndex(item.start_time, startTime)
  const baseSpan = durationToSlotSpan(item.duration_minutes)
  const color = getBlockColor(item.id)

  // Live preview while resizing — null means "not currently resizing"
  const [previewSpan, setPreviewSpan] = useState(null)
  const span = previewSpan ?? baseSpan

  function handleResizePointerDown(e) {
    e.stopPropagation() // don't let this bubble into the block's own drag listeners
    e.preventDefault()
    const startY = e.clientY

    function handlePointerMove(moveEvent) {
      const deltaY = moveEvent.clientY - startY
      const deltaSlots = Math.round(deltaY / ROW_HEIGHT)
      const maxSpan = totalSlots - startSlot
      const newSpan = Math.min(maxSpan, Math.max(1, baseSpan + deltaSlots))
      setPreviewSpan(newSpan)
    }

    function handlePointerUp(upEvent) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      const deltaY = upEvent.clientY - startY
      const deltaSlots = Math.round(deltaY / ROW_HEIGHT)
      const maxSpan = totalSlots - startSlot
      const newSpan = Math.min(maxSpan, Math.max(1, baseSpan + deltaSlots))

      setPreviewSpan(null)
      if (newSpan !== baseSpan) {
        onResizeItem(item, newSpan * SLOT_MINUTES)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const style = {
    position: 'absolute',
    top: startSlot * ROW_HEIGHT,
    height: span * ROW_HEIGHT,
    left: 8,
    right: 8,
    cursor: 'grab',
    background: color.bg,
    color: color.text,
    ...(transform && { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }),
  }

  return (
    <div className="song-block" style={style} ref={setNodeRef} {...listeners} {...attributes}>
      <div className="song-block-content">
        <div className="song-block-header">
          {/* Invisible spacer matching the delete button's width — without it,
              the title's flex:1 box is narrower on the right (button) than
              the left (nothing), so text-align:center only centers within
              that shrunk box, not the full block. This balances both sides. */}
          <span className="song-block-header-spacer" aria-hidden="true" />
          <span className="song-block-title">
            {item.song.title}
            <span className="duration-label"> {span * SLOT_MINUTES} min</span>
          </span>
          <button
            onClick={() => onRemoveItem(item.id)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ background: color.buttonBg, color: color.text }}
          >
            ×
          </button>
        </div>
        {item.song.composer_arranger && (
          <div className="song-block-composer">{item.song.composer_arranger}</div>
        )}
        {item.song.notes && <div className="song-block-notes">{item.song.notes}</div>}
      </div>
      <div className="resize-handle" onPointerDown={handleResizePointerDown} />
    </div>
  )
}

function TimeSlotGrid({ items, onRemoveItem, onResizeItem, startTime, endTime }) {
  const totalSlots = getTotalSlots(startTime, endTime)

  return (
    <div className="time-grid-wrapper">
      <TimeGutter startTime={startTime} totalSlots={totalSlots} />
      <div className="time-slot-grid" style={{ position: 'relative' }}>
        {Array.from({ length: totalSlots }, (_, index) => (
          <DroppableSlot key={index} index={index} />
        ))}

        {items.map((item) => (
          <PlacedItemOverlay
            key={item.id}
            item={item}
            onRemoveItem={onRemoveItem}
            onResizeItem={onResizeItem}
            startTime={startTime}
            totalSlots={totalSlots}
          />
        ))}
      </div>
    </div>
  )
}

export default TimeSlotGrid
