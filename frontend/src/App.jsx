import { useState } from 'react'
import './App.css'
import RehearsalPlanningView from './components/RehearsalPlanningView'
import MembersView from './components/MembersView'
import AttendanceChecker from './components/AttendanceChecker'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import CalendarView from './components/CalendarView'

function App() {
  const [activeView, setActiveView] = useState('rehearsal')
  const [selectedPlanId, setSelectedPlanId] = useState(null)

  function handleOpenPlan(planId) {
    setSelectedPlanId(planId)
    setActiveView('rehearsal')
  }

  return (
    <>
      <header className="app-header">
        <h1>Kumpas</h1>
        <nav className="app-nav">
          <button className={activeView === 'calendar' ? 'active' : ''} onClick={() => setActiveView('calendar')}>Calendar</button>
          <button className={activeView === 'rehearsal' ? 'active' : ''} onClick={() => setActiveView('rehearsal')}>Rehearsal Planning</button>
          <button className={activeView === 'attendance' ? 'active' : ''} onClick={() => setActiveView('attendance')}>Attendance</button>
          <button className={activeView === 'members' ? 'active' : ''} onClick={() => setActiveView('members')}>Members</button>
          <button className={activeView === 'analytics' ? 'active' : ''} onClick={() => setActiveView('analytics')}>Analytics</button>
        </nav>
      </header>

      {activeView === 'calendar' && <CalendarView onOpenPlan={handleOpenPlan} />}
      {activeView === 'rehearsal' && <RehearsalPlanningView planId={selectedPlanId} />}
      {activeView === 'attendance' && <AttendanceChecker planId={selectedPlanId} />}
      {activeView === 'members' && <MembersView />}
      {activeView === 'analytics' && <AnalyticsDashboard />}
    </>
  )
}

export default App
