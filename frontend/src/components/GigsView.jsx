import { useState } from 'react'
import GigForm from './GigForm'
import GigList from './GigList'
import GigDetail from './GigDetail'

// openGigId comes from the Calendar (clicking a gig chip). The view remounts
// on every tab switch, so initial state is enough — no sync effect needed.
function GigsView({ openGigId }) {
  const [selectedGigId, setSelectedGigId] = useState(openGigId || null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  if (selectedGigId) {
    return (
      <GigDetail
        gigId={selectedGigId}
        onBack={() => {
          setSelectedGigId(null)
          setRefreshSignal((n) => n + 1)
        }}
      />
    )
  }

  return (
    <div className="members-view">
      <h2>Gigs</h2>
      <div className="gig-add-form">
        <GigForm existingGig={null} onSaved={() => setRefreshSignal((n) => n + 1)} />
      </div>
      <GigList onOpen={setSelectedGigId} refreshSignal={refreshSignal} />
    </div>
  )
}

export default GigsView
