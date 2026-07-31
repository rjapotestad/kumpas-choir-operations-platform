import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import {
  getOverallRate,
  getAttendanceBySection,
  getTopAttendees,
  getMostAbsences,
  getTrend,
  getAtRisk,
} from '../api/client'

function AnalyticsDashboard() {
  const [overall, setOverall] = useState(null)
  const [bySection, setBySection] = useState([])
  const [topAttendees, setTopAttendees] = useState([])
  const [mostAbsences, setMostAbsences] = useState([])
  const [trend, setTrend] = useState([])
  const [atRisk, setAtRisk] = useState([])

  useEffect(() => {
    getOverallRate().then(setOverall)
    getAttendanceBySection().then(setBySection)
    getTopAttendees(1).then(setTopAttendees)
    getMostAbsences(1).then(setMostAbsences)
    getTrend().then(setTrend)
    getAtRisk().then(setAtRisk)
  }, [])

  const topAttendee = topAttendees[0]
  const mostAbsent = mostAbsences[0]

  return (
    <div className="analytics-view">
      <h2>Analytics</h2>

      <div className="analytics-cards">
        <div className="analytics-card">
          <span className="analytics-card-label">Overall Attendance</span>
          <span className="analytics-card-value">{overall ? `${overall.attendance_rate}%` : '—'}</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card-label">Most Present</span>
          <span className="analytics-card-value">{topAttendee ? topAttendee.name : '—'}</span>
          {topAttendee && <span className="analytics-card-sub">{topAttendee.attendance_rate}%</span>}
        </div>
        <div className="analytics-card">
          <span className="analytics-card-label">Most Absences</span>
          <span className="analytics-card-value">{mostAbsent ? mostAbsent.name : '—'}</span>
          {mostAbsent && <span className="analytics-card-sub">{mostAbsent.absent_count} absences</span>}
        </div>
      </div>

      <h3>Attendance by Section</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={bySection}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,245,240,0.1)" />
          <XAxis dataKey="section" stroke="#f5f5f0" fontSize={12} />
          <YAxis stroke="#f5f5f0" fontSize={12} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: '#0a3a4a', border: '1px solid rgba(245,245,240,0.2)' }} />
          <Bar dataKey="attendance_rate" fill="#EE4004" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <h3>Attendance Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trend}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,245,240,0.1)" />
          <XAxis dataKey="date" stroke="#f5f5f0" fontSize={12} />
          <YAxis stroke="#f5f5f0" fontSize={12} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: '#0a3a4a', border: '1px solid rgba(245,245,240,0.2)' }} />
          <Line type="monotone" dataKey="attendance_rate" stroke="#53863b" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>

      <h3>At Risk</h3>
      {atRisk.length === 0 ? (
        <p className="analytics-empty">No members currently flagged.</p>
      ) : (
        <ul className="analytics-at-risk-list">
          {atRisk.map((m) => (
            <li key={m.member_id}>
              <span className="member-name">{m.name}</span>
              <span className="analytics-card-sub">
                {m.recent_rate}% recent vs {m.historical_rate}% historical
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AnalyticsDashboard
