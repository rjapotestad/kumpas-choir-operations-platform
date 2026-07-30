import { useState, useEffect } from 'react'
import { useActivePlan } from '../hooks/useActivePlan'
import { getRoster, markAttendance } from '../api/client'

const STATUS_OPTIONS = ['Present', 'Absent', 'Excused', 'Late']

function sectionLabel(entry) {
  const initial = entry.section[0]
  return entry.subsection ? `${initial}${entry.subsection}` : initial
}

function AttendanceChecker() {
  const { activePlan } = useActivePlan()
  const [roster, setRoster] = useState([])

  useEffect(() => {
    if (activePlan) {
      getRoster(activePlan.id).then(setRoster)
    }
  }, [activePlan])

  async function refreshRoster() {
    const updated = await getRoster(activePlan.id)
    setRoster(updated)
  }

  async function handleMark(memberId, status) {
    await markAttendance(activePlan.id, memberId, { status })
    refreshRoster()
  }

  async function handleMarkAllPresent() {
    await Promise.all(roster.map((entry) => markAttendance(activePlan.id, entry.member_id, { status: 'Present' })))
    refreshRoster()
  }

  if (!activePlan) return <p className="attendance-view">Loading plan...</p>

  return (
    <div className="attendance-view">
      <div className="attendance-header">
        <h2>Attendance — {activePlan.date}</h2>
        <button onClick={handleMarkAllPresent}>Mark All Present</button>
      </div>
      <ul className="attendance-roster">
        {roster.map((entry) => (
          <li key={entry.member_id}>
            <span className="member-section-badge">{sectionLabel(entry)}</span>
            <span className="member-name">{entry.name}</span>
            <div className="attendance-status-buttons">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  className={entry.status === status ? `active status-${status.toLowerCase()}` : ''}
                  onClick={() => handleMark(entry.member_id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AttendanceChecker
