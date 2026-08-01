import { useState, useEffect } from 'react'
import { getRehearsalPlans, createRehearsalPlan } from '../api/client'

function getLocalDateString(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CalendarView({ onOpenPlan }) {
  const [cursor, setCursor] = useState(new Date())
  const [plans, setPlans] = useState([])

  const year = cursor.getFullYear()
  const month = cursor.getMonth() // 0-indexed
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    getRehearsalPlans(monthKey).then(setPlans)
  }, [monthKey])

  const plansByDate = {}
  plans.forEach((p) => {
    plansByDate[p.date] = p
  })

  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  async function handleDayClick(day) {
    const dateStr = getLocalDateString(new Date(year, month, day))
    const existing = plansByDate[dateStr]
    if (existing) {
      onOpenPlan(existing.id)
    } else {
      const newPlan = await createRehearsalPlan({ date: dateStr, title: 'Untitled Rehearsal' })
      onOpenPlan(newPlan.id)
    }
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <h2>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </div>
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="calendar-cell empty" />
          const dateStr = getLocalDateString(new Date(year, month, day))
          const hasPlan = Boolean(plansByDate[dateStr])
          return (
            <button
              key={i}
              className={`calendar-cell ${hasPlan ? 'has-plan' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="calendar-day-number">{day}</span>
              {hasPlan && <span className="calendar-dot" />}
            </button>
          )
        })}
      </div>
      <p className="calendar-hint">Click a date to open its rehearsal — creates one if none exists yet.</p>
    </div>
  )
}

export default CalendarView
