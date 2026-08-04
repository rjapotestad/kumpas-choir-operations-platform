import { useState } from 'react'
import './App.css'
import RehearsalPlanningView from './components/RehearsalPlanningView'
import MembersView from './components/MembersView'
import AttendanceChecker from './components/AttendanceChecker'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import CalendarView from './components/CalendarView'
import GigsView from './components/GigsView'
import { getRehearsalPlans, createRehearsalPlan } from './api/client'

function App() {
  const [activeView, setActiveView] = useState('rehearsal')
  const [selectedPlanId, setSelectedPlanId] = useState(null)

  function handleOpenPlan(planId) {
    setSelectedPlanId(planId)
    setActiveView('rehearsal')
  }

  // Shared by the date pickers in Rehearsal Planning and Attendance: picking
  // a date switches to whichever plan already exists for that date, or
  // creates one if none exists — same existing-or-create logic the Calendar
  // already uses, just triggered from a date input instead of a grid click.
  async function handleDateSelect(dateStr) {
    const plans = await getRehearsalPlans()
    const existing = plans.find((p) => p.date === dateStr)
    if (existing) {
      setSelectedPlanId(existing.id)
    } else {
      const newPlan = await createRehearsalPlan({ date: dateStr, title: 'Untitled Rehearsal' })
      setSelectedPlanId(newPlan.id)
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>Kumpas</h1>
        <nav className="app-nav">
          <button className={activeView === 'calendar' ? 'active' : ''} onClick={() => setActiveView('calendar')}>Calendar</button>
          <button className={activeView === 'rehearsal' ? 'active' : ''} onClick={() => setActiveView('rehearsal')}>Rehearsal Planning</button>
          <button className={activeView === 'attendance' ? 'active' : ''} onClick={() => setActiveView('attendance')}>Attendance</button>
          <button className={activeView === 'gigs' ? 'active' : ''} onClick={() => setActiveView('gigs')}>Gigs</button>
          <button className={activeView === 'members' ? 'active' : ''} onClick={() => setActiveView('members')}>Members</button>
          <button className={activeView === 'analytics' ? 'active' : ''} onClick={() => setActiveView('analytics')}>Analytics</button>
        </nav>
      </header>

      {activeView === 'calendar' && <CalendarView onOpenPlan={handleOpenPlan} />}
      {activeView === 'rehearsal' && <RehearsalPlanningView planId={selectedPlanId} onDateSelect={handleDateSelect} />}
      {activeView === 'attendance' && <AttendanceChecker planId={selectedPlanId} onDateSelect={handleDateSelect} />}
      {activeView === 'gigs' && <GigsView />}
      {activeView === 'members' && <MembersView />}
      {activeView === 'analytics' && <AnalyticsDashboard />}
    </>
  )
}

export default App
