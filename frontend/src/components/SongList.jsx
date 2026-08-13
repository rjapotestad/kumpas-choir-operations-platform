import { useDraggable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const UNCATEGORIZED_LABEL = 'Uncategorized'

function songMatchesSearch(song, searchQuery) {
  if (!searchQuery) return true
  const q = searchQuery.toLowerCase()
  return (
    song.title.toLowerCase().includes(q) ||
    (song.composer_arranger || '').toLowerCase().includes(q) ||
    (song.genre || '').toLowerCase().includes(q)
  )
}

// Presentational row, shared by both the sortable (manual order) and plain
// draggable (grouped-by-genre) variants below — keeps the markup in one place.
function SongRow({ song, onEdit, onDelete, hidden, setNodeRef, style, listeners, attributes }) {
  return (
    <li ref={setNodeRef} style={{ ...style, display: hidden ? 'none' : style?.display }}>
      <span className="song-list-title" {...listeners} {...attributes}>
        {song.title}
        {song.composer_arranger && ` — ${song.composer_arranger}`}
        {song.genre && <span className="song-list-genre"> · {song.genre}</span>}
      </span>
      <div className="song-actions">
        <button onClick={() => onEdit(song)}>Edit</button>
        <button onClick={() => onDelete(song.id)}>Delete</button>
      </div>
    </li>
  )
}

// Manual-order mode: sortable within the library list (drag to reorder)
// and draggable onto the rehearsal plan grid.
function SortableSongItem({ song, onEdit, onDelete, searchQuery }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `song-${song.id}`,
    data: { song },
  })

  return (
    <SongRow
      song={song}
      onEdit={onEdit}
      onDelete={onDelete}
      hidden={!songMatchesSearch(song, searchQuery)}
      setNodeRef={setNodeRef}
      listeners={listeners}
      attributes={attributes}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    />
  )
}

// Genre-grouped mode: still draggable onto the rehearsal plan grid, but not
// sortable within the library list — reordering across group boundaries
// while grouped isn't worth the complexity for this app's scale. Songs
// within a group keep their existing order_index order; switch back to
// "Manual order" to drag-reorder the library itself.
function DraggableSongItem({ song, onEdit, onDelete, searchQuery }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `song-${song.id}`,
    data: { song },
  })

  return (
    <SongRow
      song={song}
      onEdit={onEdit}
      onDelete={onDelete}
      hidden={!songMatchesSearch(song, searchQuery)}
      setNodeRef={setNodeRef}
      listeners={listeners}
      attributes={attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
    />
  )
}

function SongList({ songs, onEdit, onDelete, searchQuery, groupByGenre = false }) {
  if (groupByGenre) {
    const groups = new Map()
    for (const song of songs) {
      const key = (song.genre || '').trim() || UNCATEGORIZED_LABEL
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(song)
    }
    const sortedKeys = [...groups.keys()].sort((a, b) => {
      if (a === UNCATEGORIZED_LABEL) return 1
      if (b === UNCATEGORIZED_LABEL) return -1
      return a.localeCompare(b)
    })

    return (
      <div className="song-genre-groups">
        {sortedKeys.map((key) => {
          const groupSongs = groups.get(key)
          const anyVisible = groupSongs.some((s) => songMatchesSearch(s, searchQuery))
          return (
            <div key={key} className="song-genre-group" style={{ display: anyVisible ? undefined : 'none' }}>
              <h3 className="song-genre-group-title">
                {key} <span className="song-genre-group-count">({groupSongs.length})</span>
              </h3>
              <ul className="song-management-list">
                {groupSongs.map((song) => (
                  <DraggableSongItem
                    key={song.id}
                    song={song}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    searchQuery={searchQuery}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <SortableContext items={songs.map((s) => `song-${s.id}`)} strategy={verticalListSortingStrategy}>
      <ul className="song-management-list">
        {songs.map((song) => (
          <SortableSongItem key={song.id} song={song} onEdit={onEdit} onDelete={onDelete} searchQuery={searchQuery} />
        ))}
      </ul>
    </SortableContext>
  )
}

export default SongList
