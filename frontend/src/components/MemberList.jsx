import { useState, useEffect } from 'react'
import { getMembers, deleteMember } from '../api/client'

const STATUS_OPTIONS = ['Active', 'Inactive', 'Probationary', 'Trainee']
const SECTION_OPTIONS = ['Soprano', 'Alto', 'Tenor', 'Bass']

function sectionLabel(member) {
  const initial = member.section[0]
  return member.subsection ? `${initial}${member.subsection}` : initial
}

function MemberList({ onEdit, refreshSignal }) {
  const [members, setMembers] = useState([])
  const [sectionFilter, setSectionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    getMembers({ section: sectionFilter, status: statusFilter }).then(setMembers)
  }, [refreshSignal, sectionFilter, statusFilter])

  async function handleDelete(id) {
    try {
      await deleteMember(id)
      setMembers(members.filter((m) => m.id !== id))
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div>
      <div className="member-filters">
        <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
          <option value="">All sections</option>
          {SECTION_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <ul className="member-management-list">
        {members.map((member) => (
          <li key={member.id}>
            <span className="member-section-badge">{sectionLabel(member)}</span>
            <span className="member-name">{member.name}</span>
            <span className="member-status-badge">{member.status}</span>
            <div className="song-actions">
              <button onClick={() => onEdit(member)}>Edit</button>
              <button onClick={() => handleDelete(member.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MemberList
