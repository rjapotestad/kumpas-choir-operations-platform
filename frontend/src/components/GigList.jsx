import { useState, useEffect } from 'react'
import { getGigs, deleteGig } from '../api/client'

function GigList({ onOpen, refreshSignal }) {
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
    <ul className="member-management-list gig-list">
      {gigs.map((gig) => (
        <li key={gig.id} className="gig-list-row" onClick={() => onOpen(gig.id)}>
          <span className="member-name">{gig.event_name} — {gig.date}{gig.venue ? ` @ ${gig.venue}` : ''}</span>
          <div className="song-actions">
            <button
              onClick={(e) => {
                e.stopPropagation() // don't also open the gig
                handleDelete(gig.id)
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default GigList
