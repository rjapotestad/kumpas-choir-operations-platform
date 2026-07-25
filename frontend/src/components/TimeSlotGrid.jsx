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

function DroppableSlot({ index }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${index}`,
    data: { slotIndex: index },
  })

  return (
    <div ref={setNodeRef} className={`time-slot ${isOver ? 'time-slot-over' : ''}`}>
      <span className="time-label">{slotIndexToTime(index)}</span>
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
    left: 66,
    right: 4,
    cursor: 'grab',
    ...(transform && { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }),
  }

  return (
    <div className="song-block" style={style} ref={setNodeRef} {...listeners} {...attributes}>
      <span className="song-block-title">
        {item.song.title}
        <span className="duration-label"> {span * SLOT_MINUTES} min</span>
      </span>
      <button onClick={() => onRemoveItem(item.id)}>×</button>
      <div className="resize-handle" onPointerDown={handleResizePointerDown} />
    </div>
  )
}

function TimeSlotGrid({ items, onRemoveItem, onResizeItem }) {
  return (
    <div className="time-slot-grid" style={{ position: 'relative' }}>
      {Array.from({ length: TOTAL_SLOTS }, (_, index) => (
        <DroppableSlot key={index} index={index} />
      ))}

      {items.map((item) => (
        <PlacedItemOverlay
          key={item.id}
          item={item}
          onRemoveItem={onRemoveItem}
          onResizeItem={onResizeItem}
        />
      ))}
    </div>
  )
}

export default TimeSlotGrid
