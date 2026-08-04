import { useState, useEffect, useRef } from 'react'
import { getRehearsalPlans, createRehearsalPlan, getRehearsalPlan } from '../api/client'

function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// If planId is given, loads that specific plan (driven by Calendar/date-picker
// selection). Otherwise falls back to "load or create the first plan".
export function useActivePlan(planId = null) {
  const [activePlan, setActivePlan] = useState(null)
  const loadStartedRef = useRef(false)
  // Tracks whichever plan is CURRENTLY intended to be shown — any async
  // response that resolves after the user has already navigated elsewhere
  // gets discarded instead of silently overwriting the newer plan.
  const currentPlanIdRef = useRef(planId)

  useEffect(() => {
    currentPlanIdRef.current = planId
  }, [planId])

  useEffect(() => {
    if (planId) {
      getRehearsalPlan(planId).then((data) => {
        if (currentPlanIdRef.current === planId) setActivePlan(data)
      })
      return
    }

    if (loadStartedRef.current) return
    loadStartedRef.current = true

    async function loadOrCreatePlan() {
      const plans = await getRehearsalPlans()
      if (plans.length > 0) {
        currentPlanIdRef.current = plans[0].id
        setActivePlan(plans[0])
      } else {
        const newPlan = await createRehearsalPlan({ date: getLocalDateString(), title: 'Untitled Rehearsal' })
        currentPlanIdRef.current = newPlan.id
        setActivePlan(newPlan)
      }
    }
    loadOrCreatePlan()
  }, [planId])

  async function refreshActivePlan() {
    if (!activePlan) return
    const idToRefresh = activePlan.id
    const updated = await getRehearsalPlan(idToRefresh)
    // Only apply if the user hasn't navigated to a different plan while this was in flight
    if (currentPlanIdRef.current === idToRefresh) setActivePlan(updated)
  }

  return { activePlan, setActivePlan, refreshActivePlan }
}
