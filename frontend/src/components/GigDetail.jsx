import { useState, useEffect } from 'react'
import { getGig } from '../api/client'
import GigForm from './GigForm'
import GigRepertoire from './GigRepertoire'
import GigPersonnel from './GigPersonnel'
import GigSummary from './GigSummary'

// The separate view a gig opens into: details, repertoire and personnel are
// all edited here, with the announcement summary kept in sync below them.
function GigDetail({ gigId, onBack }) {
  const [gig, setGig] = useState(null)
  const [summaryRefresh, setSummaryRefresh] = useState(0)

  useEffect(() => {
    getGig(gigId).then(setGig)
  }, [gigId])

  function refreshSummary() {
    setSummaryRefresh((n) => n + 1)
  }

  async function handleDetailsSaved() {
    setGig(await getGig(gigId))
    refreshSummary()
  }

  if (!gig) return <p className="attendance-view">Loading gig...</p>

  return (
    <div className="members-view gig-detail">
      <div className="gig-detail-header">
        <button type="button" className="secondary-action" onClick={onBack}>← All gigs</button>
        <h2>{gig.event_name}</h2>
      </div>

      <section className="gig-detail-section">
        <h3>Details</h3>
        <GigForm existingGig={gig} onSaved={handleDetailsSaved} />
      </section>

      <section className="gig-detail-section">
        <GigRepertoire gigId={gigId} onChange={refreshSummary} />
      </section>

      <section className="gig-detail-section">
        <GigPersonnel gigId={gigId} onChange={refreshSummary} />
      </section>

      <GigSummary gigId={gigId} refreshKey={summaryRefresh} />
    </div>
  )
}

export default GigDetail
