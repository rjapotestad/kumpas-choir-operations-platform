import { useState, useEffect } from 'react'
import { useActivePlan } from '../hooks/useActivePlan'
import { getRoster, markAttendance } from '../api/client'

const STATUS_OPTIONS = ['Present', 'Absent', 'Excused', 'Late']

// Fixed display order, not alphabetical — matches how the choir actually
// lines up (SATB), same convention noted in the roadmap's Future Fixes.
const SECTION_ORDER = ['Soprano', 'Alto', 'Tenor', 'Bass']
const SECTION_GROUP_TITLES = {
  Soprano: 'Sopranos',
  Alto: 'Altos',
  Tenor: 'Tenors',
  Bass: 'Basses',
}

function sectionLabel(entry) {
  const initial = entry.section[0]
  return entry.subsection ? `${initial}${entry.subsection}` : initial
}

// Groups the roster by section (SATB order), then by subsection/name within
// each group — same "grouped list with headers" pattern as the Library's
// group-by-genre view (see SongList.jsx).
function groupRosterBySection(roster) {
  const groups = new Map()
  for (const entry of roster) {
    if (!groups.has(entry.section)) groups.set(entry.section, [])
    groups.get(entry.section).push(entry)
  }
  for (const entries of groups.values()) {
    entries.sort((a, b) => {
      const subA = (a.subsection ?? '').toString()
      const subB = (b.subsection ?? '').toString()
      if (subA !== subB) return subA.localeCompare(subB)
      return a.name.localeCompare(b.name)
    })
  }
  const orderedSections = [
    ...SECTION_ORDER.filter((s) => groups.has(s)),
    ...[...groups.keys()].filter((s) => !SECTION_ORDER.includes(s)),
  ]
  return orderedSections.map((section) => ({ section, entries: groups.get(section) }))
}

function AttendanceChecker({ planId, onDateSelect }) {
  const { activePlan } = useActivePlan(planId)
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

  const sectionGroups = groupRosterBySection(roster)

  return (
    <div className="attendance-view">
      <div className="attendance-header">
        <h2>Attendance — {activePlan.date}</h2>
        <input
          type="date"
          className="plan-date-input"
          value={activePlan.date}
          onChange={(e) => onDateSelect?.(e.target.value)}
        />
        <button onClick={handleMarkAllPresent}>Mark All Present</button>
      </div>
      <div className="attendance-section-groups">
        {sectionGroups.map(({ section, entries }) => (
          <div key={section} className="attendance-section-group">
            <h3 className="attendance-section-group-title">
              {SECTION_GROUP_TITLES[section] || section}{' '}
              <span className="attendance-section-group-count">({entries.length})</span>
            </h3>
            <ul className="attendance-roster">
              {entries.map((entry) => (
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
        ))}
      </div>
    </div>
  )
}

export default AttendanceChecker
