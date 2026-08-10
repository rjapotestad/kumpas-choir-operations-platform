import { useState, useEffect } from 'react'
import GigForm from './GigForm'
import GigList from './GigList'
import GigRepertoire from './GigRepertoire'
import GigPersonnel from './GigPersonnel'
import { getGig } from '../api/client'

// openGigId is set by the Calendar view when a gig date is clicked — this
// is Gigs' equivalent of Rehearsal Planning loading a specific plan. There's
// no separate "Gig detail" page in this module (same list/form pattern as
// Members), so "opening" a gig means populating the edit form with it.
function GigsView({ openGigId }) {
  const [editingGig, setEditingGig] = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [repertoireGigId, setRepertoireGigId] = useState(null)
  const [personnelGigId, setPersonnelGigId] = useState(null)

  useEffect(() => {
    if (openGigId) {
      getGig(openGigId).then(setEditingGig)
    }
  }, [openGigId])

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
