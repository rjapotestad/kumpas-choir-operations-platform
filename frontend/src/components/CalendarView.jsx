import { useState, useEffect } from 'react'
import { getRehearsalPlans, createRehearsalPlan, deleteRehearsalPlan, getGigs } from '../api/client'

function getLocalDateString(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CalendarView({ onOpenPlan, onOpenGig }) {
  const [cursor, setCursor] = useState(new Date())
  const [plans, setPlans] = useState([])
  const [gigs, setGigs] = useState([])
  const [creatingDates, setCreatingDates] = useState(new Set())

  const year = cursor.getFullYear()
  const month = cursor.getMonth() // 0-indexed
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    getRehearsalPlans(monthKey).then(setPlans)
  }, [monthKey])

  // Gigs have no month-filtered endpoint (unlike rehearsal plans), and a
  // choir's gig list is small enough that fetching the full list once and
  // filtering client-side per cell is simpler than adding backend support.
  useEffect(() => {
    getGigs().then(setGigs)
  }, [])

  const plansByDate = {}
  plans.forEach((p) => {
    plansByDate[p.date] = p
  })

  // Unlike rehearsal plans (one per date by convention), a choir can have
  // more than one gig on the same date, so this maps to an array.
  const gigsByDate = {}
  gigs.forEach((g) => {
    if (!gigsByDate[g.date]) gigsByDate[g.date] = []
    gigsByDate[g.date].push(g)
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
      return
    }
    // Guard against double-clicking an empty date before the first create
    // request resolves — without this, a quick second click could create
    // a second plan for the same date before `plans` state updates.
    if (creatingDates.has(dateStr)) return
    setCreatingDates((prev) => new Set(prev).add(dateStr))

    try {
      const newPlan = await createRehearsalPlan({ date: dateStr, title: 'Untitled Rehearsal' })
      setPlans((prev) => [...prev, newPlan]) // keep the calendar's own list in sync immediately
      onOpenPlan(newPlan.id)
    } finally {
      setCreatingDates((prev) => {
        const next = new Set(prev)
        next.delete(dateStr)
        return next
      })
    }
  }

  async function handleDeletePlan(planId) {
    await deleteRehearsalPlan(planId)
    setPlans((prev) => prev.filter((p) => p.id !== planId))
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
          const plan = plansByDate[dateStr]
          const dayGigs = gigsByDate[dateStr] || []
          return (
            <div
              key={i}
              className={`calendar-cell ${plan ? 'has-plan' : ''} ${dayGigs.length ? 'has-gig' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="calendar-day-number">{day}</span>
              <div className="calendar-cell-events">
                {plan && (
                  <div className="calendar-event calendar-event-rehearsal" title={plan.title || 'Rehearsal'}>
                    <span className="calendar-event-label">{plan.title || 'Rehearsal'}</span>
                    <button
                      type="button"
                      className="calendar-event-delete"
                      title="Delete rehearsal"
                      onClick={(e) => {
                        e.stopPropagation() // don't also trigger the cell's open/create click-through
                        handleDeletePlan(plan.id)
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {dayGigs.map((gig) => (
                  <button
                    key={gig.id}
                    type="button"
                    className="calendar-event calendar-event-gig"
                    title={gig.event_name}
                    onClick={(e) => {
                      e.stopPropagation() // don't also trigger the cell's rehearsal click-through
                      onOpenGig(gig.id)
                    }}
                  >
                    {gig.event_name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <p className="calendar-hint">Click a date to open its rehearsal (creates one if none exists yet), or click a gig to view its details.</p>
    </div>
  )
}

export default CalendarView
