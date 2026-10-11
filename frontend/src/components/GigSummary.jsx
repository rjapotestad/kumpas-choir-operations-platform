import { useEffect, useState } from 'react'
import { getGig, getGigRoster } from '../api/client'

const SECTION_ORDER = ['Soprano', 'Alto', 'Tenor', 'Bass']

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// Plain text on purpose: it gets pasted into Messenger/Viber/email, where
// markdown or HTML wouldn't render.
function buildSummary(gig, roster) {
  const lines = [gig.event_name, '']
  lines.push(`Date: ${formatDate(gig.date)}`)
  if (gig.performance_time) lines.push(`Performance time: ${formatTime(gig.performance_time)}`)
  if (gig.venue) lines.push(`Venue: ${gig.venue}`)
  if (gig.costume) lines.push(`Costume: ${gig.costume}`)

  const personnel = roster.filter((e) => e.status !== null)
  lines.push('', `Personnel (${personnel.length}):`)
  if (personnel.length === 0) {
    lines.push('TBA')
  } else {
    SECTION_ORDER.forEach((section) => {
      const names = personnel.filter((e) => e.section === section).map((e) => e.name)
      if (names.length) lines.push(`${section}: ${names.join(', ')}`)
    })
  }

  lines.push('', 'Repertoire:')
  if (gig.items.length === 0) {
    lines.push('TBA')
  } else {
    gig.items.forEach((item, i) => lines.push(`${i + 1}. ${item.song.title}`))
  }

  if (gig.notes) lines.push('', 'Notes:', gig.notes)
  return lines.join('\n')
}

// refreshKey is bumped by the parent whenever details, repertoire or
// personnel change, so the summary never goes stale.
function GigSummary({ gigId, refreshKey }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([getGig(gigId), getGigRoster(gigId)])
      .then(([gig, roster]) => {
        setText(buildSummary(gig, roster))
        setError('')
      })
      .catch((e) => setError(e.message))
  }, [gigId, refreshKey])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy — select the text and copy it manually.')
    }
  }

  return (
    <section className="gig-detail-section">
      <div className="gig-summary-header">
        <h3>Announcement Summary</h3>
        <button type="button" onClick={handleCopy} disabled={!text}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      {error && <p className="attendance-error">{error}</p>}
      <pre className="gig-summary-text">{text || 'Loading...'}</pre>
    </section>
  )
}

export default GigSummary
