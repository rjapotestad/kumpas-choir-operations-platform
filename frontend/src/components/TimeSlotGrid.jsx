import { useDroppable, useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import {
  TOTAL_SLOTS,
  ROW_HEIGHT,
  SLOT_MINUTES,
  slotIndexToTime,
  timeToSlotIndex,
  durationToSlotSpan,
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

function TimeGutter() {
  return (
    <div className="time-gutter">
      {Array.from({ length: TOTAL_SLOTS + 1 }, (_, index) => (
        <div
          key={index}
          className="time-gutter-row"
          style={index === TOTAL_SLOTS ? { opacity: 0.55 } : undefined}
        >
          <span className="time-label">{slotIndexToTime(index)}</span>
        </div>
      ))}
    </div>
  )
}

function PlacedItemOverlay({ item, onRemoveItem, onResizeItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `item-${item.id}`,
    data: { item },
  })

  const startSlot = timeToSlotIndex(item.start_time)
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
      const maxSpan = TOTAL_SLOTS - startSlot
      const newSpan = Math.min(maxSpan, Math.max(1, baseSpan + deltaSlots))
      setPreviewSpan(newSpan)
    }

    function handlePointerUp(upEvent) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      const deltaY = upEvent.clientY - startY
      const deltaSlots = Math.round(deltaY / ROW_HEIGHT)
      const maxSpan = TOTAL_SLOTS - startSlot
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
      <div className="resize-handle" onPointerDown={handleResizePointerDown} />
    </div>
  )
}

function TimeSlotGrid({ items, onRemoveItem, onResizeItem }) {
  return (
    <div className="time-grid-wrapper">
      <TimeGutter />
      <div className="time-slot-grid" style={{ position: 'relative' }}>
        {Array.from({ length: TOTAL_SLOTS }, (_, index) => (
          <DroppableSlot key={index} index={index} />
        ))}

        {/* Visual-only boundary row — not a real, placeable slot */}
        <div className="time-slot" />

        {items.map((item) => (
          <PlacedItemOverlay
            key={item.id}
            item={item}
            onRemoveItem={onRemoveItem}
            onResizeItem={onResizeItem}
          />
        ))}
      </div>
    </div>
  )
}

export default TimeSlotGrid
