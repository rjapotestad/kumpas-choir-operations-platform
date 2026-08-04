import { useState, useEffect } from 'react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getGig, getSongs, addGigItem, updateGigItem, deleteGigItem } from '../api/client'

function SortableRepertoireItem({ item, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `item-${item.id}` })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <li ref={setNodeRef} style={style}>
      <span className="song-list-title" {...listeners} {...attributes}>{item.song.title}</span>
      <div className="song-actions">
        <button onClick={() => onRemove(item.id)}>Remove</button>
      </div>
    </li>
  )
}

function GigRepertoire({ gigId, onClose }) {
  const [gig, setGig] = useState(null)
  const [songs, setSongs] = useState([])
  const [selectedSongId, setSelectedSongId] = useState('')

  useEffect(() => {
    getGig(gigId).then(setGig)
    getSongs().then(setSongs)
  }, [gigId])

  async function refresh() {
    const updated = await getGig(gigId)
    setGig(updated)
  }

  async function handleAdd() {
    if (!selectedSongId) return
    await addGigItem(gigId, { song_id: Number(selectedSongId), order_index: gig.items.length })
    setSelectedSongId('')
    refresh()
  }

  async function handleRemove(itemId) {
    await deleteGigItem(gigId, itemId)
    refresh()
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = gig.items.findIndex((i) => `item-${i.id}` === active.id)
    const newIndex = gig.items.findIndex((i) => `item-${i.id}` === over.id)
    const reordered = arrayMove(gig.items, oldIndex, newIndex)
    setGig({ ...gig, items: reordered })
    await Promise.all(reordered.map((item, index) => updateGigItem(gigId, item.id, { order_index: index })))
  }

  if (!gig) return <p>Loading...</p>

  return (
    <div className="member-form" style={{ maxWidth: 480, marginTop: '1rem' }}>
      <h3>{gig.event_name} — Repertoire</h3>
      <div className="member-form-row">
        <select value={selectedSongId} onChange={(e) => setSelectedSongId(e.target.value)}>
          <option value="">Add a song...</option>
          {songs.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <button type="button" onClick={handleAdd}>Add</button>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={gig.items.map((i) => `item-${i.id}`)} strategy={verticalListSortingStrategy}>
          <ul className="member-management-list">
            {gig.items.map((item) => (
              <SortableRepertoireItem key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  )
}

export default GigRepertoire
