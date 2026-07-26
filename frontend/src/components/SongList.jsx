import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableSongItem({ song, onEdit, onDelete, searchQuery }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `song-${song.id}`,
    data: { song },
  })

  const matchesSearch =
    !searchQuery ||
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.composer_arranger || '').toLowerCase().includes(searchQuery.toLowerCase())

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: matchesSearch ? undefined : 'none',
  }

  return (
    <li ref={setNodeRef} style={style}>
      <span className="song-list-title" {...listeners} {...attributes}>
        {song.title}
        {song.composer_arranger && ` — ${song.composer_arranger}`}
      </span>
      <div className="song-actions">
        <button onClick={() => onEdit(song)}>Edit</button>
        <button onClick={() => onDelete(song.id)}>Delete</button>
      </div>
    </li>
  )
}

function SongList({ songs, onEdit, onDelete, searchQuery }) {
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
