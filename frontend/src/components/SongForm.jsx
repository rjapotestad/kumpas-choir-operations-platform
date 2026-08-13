import { useState, useEffect } from 'react'
import { createSong, updateSong } from '../api/client'

function SongForm({ existingSong, onSaved, existingGenres = [] }) {
  const [title, setTitle] = useState('')
  const [composerArranger, setComposerArranger] = useState('')
  const [notes, setNotes] = useState('')
  const [genre, setGenre] = useState('')

  useEffect(() => {
    if (existingSong) {
      setTitle(existingSong.title)
      setComposerArranger(existingSong.composer_arranger || '')
      setNotes(existingSong.notes || '')
      setGenre(existingSong.genre || '')
    } else {
      setTitle('')
      setComposerArranger('')
      setNotes('')
      setGenre('')
    }
  }, [existingSong])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { title, composer_arranger: composerArranger, notes, genre }

    if (existingSong) {
      await updateSong(existingSong.id, payload)
    } else {
      await createSong(payload)
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
      />
      <input
        value={composerArranger}
        onChange={(e) => setComposerArranger(e.target.value)}
        placeholder="Composer / Arranger"
      />
      <input
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        placeholder="Genre / Category"
        list="song-genre-options"
      />
      {/* Suggests genres already used in the library so labels stay
          consistent (and therefore group/sort sensibly) without locking
          the field to a fixed taxonomy — free text still works. */}
      <datalist id="song-genre-options">
        {existingGenres.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
      />
      <button type="submit">{existingSong ? 'Update' : 'Add'} Song</button>
    </form>
  )
}

export default SongForm
