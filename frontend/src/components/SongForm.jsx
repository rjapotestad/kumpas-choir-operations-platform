import { useState, useEffect } from 'react'
import { createSong, updateSong } from '../api/client'

function SongForm({ existingSong, onSaved }) {
  const [title, setTitle] = useState('')
  const [composerArranger, setComposerArranger] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (existingSong) {
      setTitle(existingSong.title)
      setComposerArranger(existingSong.composer_arranger || '')
      setNotes(existingSong.notes || '')
    } else {
      setTitle('')
      setComposerArranger('')
      setNotes('')
    }
  }, [existingSong])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { title, composer_arranger: composerArranger, notes }

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
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
      />
      <button type="submit">{existingSong ? 'Update' : 'Add'} Song</button>
    </form>
  )
}

export default SongForm