import { useState, useEffect } from 'react'
import { getGigs, deleteGig } from '../api/client'

function GigList({ onEdit, onOpenRepertoire, refreshSignal }) {
  const [gigs, setGigs] = useState([])

  useEffect(() => {
    getGigs().then(setGigs)
  }, [refreshSignal])

  async function handleDelete(id) {
    try {
      await deleteGig(id)
      setGigs(gigs.filter((g) => g.id !== id))
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <ul className="member-management-list">
      {gigs.map((gig) => (
        <li key={gig.id}>
          <span className="member-name">{gig.event_name} — {gig.date}{gig.venue ? ` @ ${gig.venue}` : ''}</span>
          <div className="song-actions">
            <button onClick={() => onOpenRepertoire(gig.id)}>Repertoire</button>
            <button onClick={() => onEdit(gig)}>Edit</button>
            <button onClick={() => handleDelete(gig.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default GigList
