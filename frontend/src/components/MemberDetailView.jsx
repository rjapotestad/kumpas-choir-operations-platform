import { useState, useEffect } from 'react'
import { getMember, getMemberAttendanceHistory } from '../api/client'

function sectionLabel(entity) {
  const initial = entity.section[0]
  return entity.subsection ? `${initial}${entity.subsection}` : initial
}

function statusClass(status) {
  return status ? `status-${status.toLowerCase()}` : ''
}

function MemberDetailView({ memberId, onBack }) {
  const [member, setMember] = useState(null)
  const [history, setHistory] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMember(memberId).then(setMember)
  }, [memberId])

  useEffect(() => {
    setLoading(true)
    getMemberAttendanceHistory(memberId, { from: dateFrom || null, to: dateTo || null })
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [memberId, dateFrom, dateTo])

  function clearRange() {
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="member-detail-view">
      <button className="member-detail-back" onClick={onBack}>&larr; Back to Members</button>

      {member && (
        <div className="member-detail-header">
          <span className="member-section-badge">{sectionLabel(member)}</span>
          <div className="member-detail-identity">
            <h2>{member.name}</h2>
            <span className="member-detail-subtitle">
              {member.section}
              {member.subsection ? ` ${member.subsection}` : ''} &middot; {member.status}
            </span>
          </div>
        </div>
      )}

      <div className="member-detail-filters">
        <label>
          From
          <input type="date" className="plan-date-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" className="plan-date-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {(dateFrom || dateTo) && (
          <button className="member-detail-clear-range" onClick={clearRange}>Clear range</button>
        )}
      </div>

      {loading || !history ? (
        <p className="member-detail-loading">Loading attendance history...</p>
      ) : (
        <>
          <div className="analytics-cards member-detail-stats">
            <div className="analytics-card">
              <span className="analytics-card-label">Attendance Rate</span>
              <span className="analytics-card-value">{history.attendance_rate}%</span>
              <span className="analytics-card-sub">{history.total_records} record{history.total_records === 1 ? '' : 's'}</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-card-label">Rehearsals Logged</span>
              <span className="analytics-card-value">{history.rehearsal_log.length}</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-card-label">Gigs Logged</span>
              <span className="analytics-card-value">{history.gig_log.length}</span>
            </div>
          </div>

          <h3 className="member-detail-section-title">Rehearsal Attendance</h3>
          {history.rehearsal_log.length === 0 ? (
            <p className="analytics-empty">No rehearsal attendance records in this range.</p>
          ) : (
            <ul className="member-detail-log-list">
              {history.rehearsal_log.map((entry) => (
                <li key={entry.rehearsal_plan_id}>
                  <span className="member-detail-log-date">{entry.date}</span>
                  <span className="member-detail-log-title">{entry.title || 'Untitled Rehearsal'}</span>
                  <span className={`member-detail-log-status ${statusClass(entry.status)}`}>{entry.status}</span>
                  <span className="member-detail-log-remarks">{entry.remarks || '—'}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="member-detail-section-title">Gig Attendance</h3>
          {history.gig_log.length === 0 ? (
            <p className="analytics-empty">No gig attendance records in this range.</p>
          ) : (
            <ul className="member-detail-log-list">
              {history.gig_log.map((entry) => (
                <li key={entry.gig_id}>
                  <span className="member-detail-log-date">{entry.date}</span>
                  <span className="member-detail-log-title">{entry.event_name}</span>
                  <span className={`member-detail-log-status ${statusClass(entry.status)}`}>{entry.status}</span>
                  <span className="member-detail-log-remarks">{entry.remarks || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export default MemberDetailView
