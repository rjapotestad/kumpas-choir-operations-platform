import { useState, useEffect, useRef } from 'react'
import { getRehearsalPlans, createRehearsalPlan, getRehearsalPlan } from '../api/client'

function getLocalDateString() {
  // toISOString() converts to UTC, which can land on the wrong calendar
  // day depending on timezone — build the string from local date parts instead
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useActivePlan() {
  const [activePlan, setActivePlan] = useState(null)
  const loadStartedRef = useRef(false)

  // Guarded against React StrictMode's deliberate double-invoke of effects
  // in development, which could otherwise race two "no plans exist" checks
  // and create two separate plans.
  useEffect(() => {
    if (loadStartedRef.current) return
    loadStartedRef.current = true

    async function loadOrCreatePlan() {
      const plans = await getRehearsalPlans()
      if (plans.length > 0) {
        setActivePlan(plans[0])
      } else {
        const newPlan = await createRehearsalPlan({ date: getLocalDateString(), title: 'Untitled Rehearsal' })
        setActivePlan(newPlan)
      }
    }
    loadOrCreatePlan()
  }, [])

  async function refreshActivePlan() {
    if (!activePlan) return
    const updated = await getRehearsalPlan(activePlan.id)
    setActivePlan(updated)
  }

  return { activePlan, setActivePlan, refreshActivePlan }
}
