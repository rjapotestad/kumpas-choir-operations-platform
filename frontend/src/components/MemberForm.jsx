import { useState, useEffect } from 'react'
import { createMember, updateMember } from '../api/client'

const STATUS_OPTIONS = ['Active', 'Inactive', 'Probationary', 'Trainee']
const SECTION_OPTIONS = ['Soprano', 'Alto', 'Tenor', 'Bass']

function MemberForm({ existingMember, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('Active')
  const [section, setSection] = useState('Soprano')
  const [subsection, setSubsection] = useState('')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (existingMember) {
      setName(existingMember.name)
      setEmail(existingMember.email || '')
      setStatus(existingMember.status)
      setSection(existingMember.section)
      setSubsection(existingMember.subsection ? String(existingMember.subsection) : '')
      setRemarks(existingMember.remarks || '')
    } else {
      setName('')
      setEmail('')
      setStatus('Active')
      setSection('Soprano')
      setSubsection('')
      setRemarks('')
    }
  }, [existingMember])

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name,
      email: email || null,
      status,
      section,
      subsection: subsection ? Number(subsection) : null,
      remarks: remarks || null,
    }

    if (existingMember) {
      await updateMember(existingMember.id, payload)
    } else {
      await createMember(payload)
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="member-form">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (optional)"
      />
      <div className="member-form-row">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={section} onChange={(e) => setSection(e.target.value)}>
          {SECTION_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={subsection} onChange={(e) => setSubsection(e.target.value)}>
          <option value="">{'—'}</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </div>
      <input
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Remarks (optional)"
      />
      <button type="submit">{existingMember ? 'Update' : 'Add'} Member</button>
    </form>
  )
}

export default MemberForm
