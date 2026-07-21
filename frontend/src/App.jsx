import { useState } from 'react'
import SongList from './components/SongList'
import SongForm from './components/SongForm'

function App() {
  const [editingSong, setEditingSong] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  function handleSaved() {
    setEditingSong(null)
    setRefreshSignal((prev) => prev + 1)
  }

  return (
    <div>
      <h1>Kumpas — Song Library</h1>
      <SongForm existingSong={editingSong} onSaved={handleSaved} />
      <SongList onEdit={setEditingSong} refreshSignal={refreshSignal} />
    </div>
  )
}

export default App