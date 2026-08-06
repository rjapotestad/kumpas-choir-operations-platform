import { useEffect, useState } from 'react'
import { getGig, getGigRoster, markGigAttendance, removeGigPersonnel } from '../api/client'

function sectionLabel(entry) {
  const initial = entry.section[0]
  return entry.subsection ? `${initial}${entry.subsection}` : initial
}

function GigPersonnel({ gigId, onClose }) {
  const [gig, setGig] = useState(null)
  const [roster, setRoster] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [gigData, rosterData] = await Promise.all([getGig(gigId), getGigRoster(gigId)])
        if (!cancelled) {
          setGig(gigData)
          setRoster(rosterData)
          setError('')
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message)
      }
    }

    load()
    return () => { cancelled = true }
  }, [gigId])

  async function refreshRoster() {
    const updated = await getGigRoster(gigId)
    setRoster(updated)
  }

  async function handleAdd() {
    if (!selectedMemberId) return

    try {
      await markGigAttendance(gigId, Number(selectedMemberId), { status: 'Present' })
      setSelectedMemberId('')
      setError('')
      await refreshRoster()
    } catch (addError) {
      setError(addError.message)
    }
  }

  async function handleRemove(memberId) {
    try {
      await removeGigPersonnel(gigId, memberId)
      setError('')
      await refreshRoster()
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  if (error && !gig) return <p className="attendance-view">Could not load personnel: {error}</p>
  if (!gig) return <p className="attendance-view">Loading personnel...</p>

  const personnel = roster.filter((entry) => entry.status !== null)
  const availableMembers = roster.filter((entry) => entry.status === null)

  return (
    <section className="gig-personnel-view">
      <div className="attendance-header">
        <div>
          <h3>{gig.event_name} — Personnel</h3>
          <p className="gig-personnel-meta">{gig.date}{gig.venue ? ` · ${gig.venue}` : ''}</p>
        </div>
        <button className="secondary-action" onClick={onClose}>Close</button>
      </div>
      {error && <p className="attendance-error">Could not update personnel: {error}</p>}

      <div className="member-form-row gig-personnel-picker">
        <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
          <option value="">Choose a member...</option>
          {availableMembers.map((entry) => (
            <option key={entry.member_id} value={entry.member_id}>
              {entry.name} ({sectionLabel(entry)})
            </option>
          ))}
        </select>
        <button type="button" onClick={handleAdd} disabled={!selectedMemberId}>Add to personnel</button>
      </div>

      {personnel.length === 0 ? (
        <p className="gig-personnel-empty">No personnel selected yet.</p>
      ) : (
        <ul className="member-management-list gig-personnel-list">
          {personnel.map((entry) => (
            <li key={entry.member_id}>
              <span className="member-section-badge">{sectionLabel(entry)}</span>
              <span className="member-name">{entry.name}</span>
              <div className="song-actions">
                <button onClick={() => handleRemove(entry.member_id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default GigPersonnel
