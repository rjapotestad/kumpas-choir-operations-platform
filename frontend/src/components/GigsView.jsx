import { useState } from 'react'
import GigForm from './GigForm'
import GigList from './GigList'

function GigsView() {
  const [editingGig, setEditingGig] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  function handleSaved() {
    setEditingGig(null)
    setRefreshSignal((prev) => prev + 1)
  }

  return (
    <div className="members-view">
      <h2>Gigs</h2>
      <GigForm existingGig={editingGig} onSaved={handleSaved} />
      <GigList onEdit={setEditingGig} refreshSignal={refreshSignal} />
    </div>
  )
}

export default GigsView
