import { useState, useEffect, useMemo } from 'react'
import { DndContext } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import SongForm from './SongForm'
import SongList from './SongList'
import { getSongs, updateSong, deleteSong } from '../api/client'

// Dedicated full-page view for browsing/managing the song library — the
// Rehearsal Plan builder's sidebar (RehearsalPlanningView) still exists and
// still does drag-into-grid; this view is for the case where you just want
// to see/edit/organize the whole library without a rehearsal plan open.
function LibraryView() {
  const [songs, setSongs] = useState([])
  const [editingSong, setEditingSong] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState('manual') // 'manual' | 'genre'

  useEffect(() => {
    getSongs().then(setSongs)
  }, [refreshSignal])

  const existingGenres = useMemo(
    () => [...new Set(songs.map((s) => s.genre).filter(Boolean))].sort(),
    [songs]
  )

  function handleSaved() {
    setEditingSong(null)
    setRefreshSignal((prev) => prev + 1)
  }

  async function handleDeleteSong(id) {
    try {
      await deleteSong(id)
      setRefreshSignal((prev) => prev + 1)
    } catch (error) {
      alert(error.message)
    }
  }

  // Manual-order reordering only — same rule as the Rehearsal Plan sidebar
  // (see decisions.md): drag-to-reorder is Manual-mode-only. There's also no
  // rehearsal grid to drop a song onto here, since this view is purely for
  // browsing/managing the library itself, not building a plan.
  async function handleDragEnd(event) {
    if (sortMode !== 'manual') return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIsSong = typeof active.id === 'string' && active.id.startsWith('song-')
    const overIsSong = typeof over.id === 'string' && over.id.startsWith('song-')
    if (!activeIsSong || !overIsSong) return

    const oldIndex = songs.findIndex((s) => `song-${s.id}` === active.id)
    const newIndex = songs.findIndex((s) => `song-${s.id}` === over.id)
    const reordered = arrayMove(songs, oldIndex, newIndex)

    setSongs(reordered) // optimistic UI update, feels instant
    // Persist order for the whole list — simpler and safer than only
    // updating the two swapped items, since arrayMove shifts everything between them
    await Promise.all(reordered.map((song, index) => updateSong(song.id, { order_index: index })))
  }

  return (
    <div className="library-view">
      <div className="library-view-header">
        <h2>Song Library</h2>
        <span className="library-view-count">
          {songs.length} song{songs.length === 1 ? '' : 's'}
        </span>
      </div>

      <SongForm existingSong={editingSong} onSaved={handleSaved} existingGenres={existingGenres} />

      <input
        type="text"
        className="song-search-input"
        placeholder="Search songs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="song-sort-control">
        <label htmlFor="library-sort-select">Sort by</label>
        <select id="library-sort-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
          <option value="manual">Manual order</option>
          <option value="genre">Genre</option>
        </select>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <SongList
          songs={songs}
          onEdit={setEditingSong}
          onDelete={handleDeleteSong}
          searchQuery={searchQuery}
          groupByGenre={sortMode === 'genre'}
        />
      </DndContext>
    </div>
  )
}

export default LibraryView
