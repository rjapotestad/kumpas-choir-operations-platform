import { useState } from 'react'
import './App.css'
import RehearsalPlanningView from './components/RehearsalPlanningView'
import MembersView from './components/MembersView'

function App() {
  const [activeView, setActiveView] = useState('rehearsal')

  return (
    <>
      <header className="app-header">
        <h1>Kumpas</h1>
        <nav className="app-nav">
          <button
            className={activeView === 'rehearsal' ? 'active' : ''}
            onClick={() => setActiveView('rehearsal')}
          >
            Rehearsal Planning
          </button>
          <button
            className={activeView === 'members' ? 'active' : ''}
            onClick={() => setActiveView('members')}
          >
            Members
          </button>
        </nav>
      </header>

      {activeView === 'rehearsal' ? <RehearsalPlanningView /> : <MembersView />}
    </>
  )
}

export default App
