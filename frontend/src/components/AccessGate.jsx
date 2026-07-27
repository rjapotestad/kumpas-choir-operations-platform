import { useState, useEffect } from 'react'
import { getStoredAccessCode, setStoredAccessCode, checkAccessCode } from '../api/client'

function AccessGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // On first load, silently try whatever code was stored from a previous
  // visit this session — avoids re-prompting on every page refresh
  useEffect(() => {
    async function tryStoredCode() {
      const stored = getStoredAccessCode()
      if (stored && (await checkAccessCode(stored))) {
        setUnlocked(true)
      }
      setChecking(false)
    }
    tryStoredCode()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const valid = await checkAccessCode(code)
    if (valid) {
      setStoredAccessCode(code)
      setUnlocked(true)
      setError('')
    } else {
      setError('Incorrect access code')
    }
  }

  if (checking) return null // avoid a flash of the gate while the stored code is being checked
  if (unlocked) return children

  return (
    <div className="access-gate">
      <form onSubmit={handleSubmit} className="access-gate-form">
        <h1>Kumpas</h1>
        <p>Enter the access code to continue.</p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          autoFocus
        />
        <button type="submit">Continue</button>
        {error && <p className="access-gate-error">{error}</p>}
      </form>
    </div>
  )
}

export default AccessGate
