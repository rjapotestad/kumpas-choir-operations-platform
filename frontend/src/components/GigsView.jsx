import { useState } from 'react'
import GigForm from './GigForm'
import GigList from './GigList'
import GigRepertoire from './GigRepertoire'
import GigPersonnel from './GigPersonnel'

function GigsView() {
  const [editingGig, setEditingGig] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [repertoireGigId, setRepertoireGigId] = useState(null)
  const [personnelGigId, setPersonnelGigId] = useState(null)

  function handleSaved() {
    setEditingGig(null)
    setRefreshSignal((prev) => prev + 1)
  }

  return (
    <div className="members-view">
      <h2>Gigs</h2>
      <GigForm existingGig={editingGig} onSaved={handleSaved} />
      <GigList
        onEdit={setEditingGig}
        onOpenRepertoire={setRepertoireGigId}
        onOpenPersonnel={setPersonnelGigId}
        refreshSignal={refreshSignal}
      />
      {repertoireGigId && (
        <GigRepertoire gigId={repertoireGigId} onClose={() => setRepertoireGigId(null)} />
      )}
      {personnelGigId && (
        <GigPersonnel gigId={personnelGigId} onClose={() => setPersonnelGigId(null)} />
      )}
    </div>
  )
}

export default GigsView
