import { useState } from 'react'
import './App.css'
import RehearsalPlanningView from './components/RehearsalPlanningView'
import MembersView from './components/MembersView'
import AttendanceChecker from './components/AttendanceChecker'
import AnalyticsDashboard from './components/AnalyticsDashboard'

function App() {
  const [activeView, setActiveView] = useState('rehearsal')

  return (
    <>
      <header className="app-header">
        <h1>Kumpas</h1>
        <nav className="app-nav">
          <button className={activeView === 'rehearsal' ? 'active' : ''} onClick={() => setActiveView('rehearsal')}>Rehearsal Planning</button>
          <button className={activeView === 'attendance' ? 'active' : ''} onClick={() => setActiveView('attendance')}>Attendance</button>
          <button className={activeView === 'members' ? 'active' : ''} onClick={() => setActiveView('members')}>Members</button>
          <button className={activeView === 'analytics' ? 'active' : ''} onClick={() => setActiveView('analytics')}>Analytics</button>
        </nav>
      </header>

      {activeView === 'rehearsal' && <RehearsalPlanningView />}
      {activeView === 'attendance' && <AttendanceChecker />}
      {activeView === 'members' && <MembersView />}
      {activeView === 'analytics' && <AnalyticsDashboard />}
    </>
  )
}

export default App
