import { useState, useEffect } from 'react'
import { createGig, updateGig } from '../api/client'

function GigForm({ existingGig, onSaved }) {
  const [eventName, setEventName] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [performanceTime, setPerformanceTime] = useState('')
  const [costume, setCostume] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (existingGig) {
      setEventName(existingGig.event_name)
      setDate(existingGig.date)
      setVenue(existingGig.venue || '')
      setPerformanceTime(existingGig.performance_time || '')
      setCostume(existingGig.costume || '')
      setNotes(existingGig.notes || '')
    } else {
      setEventName('')
      setDate('')
      setVenue('')
      setPerformanceTime('')
      setCostume('')
      setNotes('')
    }
  }, [existingGig])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      event_name: eventName,
      date,
      venue: venue || null,
      performance_time: performanceTime || null,
      costume: costume || null,
      notes: notes || null,
    }
    if (existingGig) {
      await updateGig(existingGig.id, payload)
    } else {
      await createGig(payload)
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="member-form">
      <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event name" required />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue (optional)" />
      <input type="time" value={performanceTime} onChange={(e) => setPerformanceTime(e.target.value)} />
      <input value={costume} onChange={(e) => setCostume(e.target.value)} placeholder="Costume (optional)" />
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (call time, soundcheck, etc.)" />
      <button type="submit">{existingGig ? 'Update' : 'Add'} Gig</button>
    </form>
  )
}

export default GigForm
