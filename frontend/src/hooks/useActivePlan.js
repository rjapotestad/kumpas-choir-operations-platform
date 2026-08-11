import { useState, useEffect, useRef } from 'react'
import { getRehearsalPlans, createRehearsalPlan, getRehearsalPlan } from '../api/client'

// Remembers whichever plan was last opened (by id), so a fresh page load
// (no planId prop, i.e. not arriving via Calendar/date-picker) reopens that
// same plan/date instead of always falling back to the earliest-dated one.
const LAST_PLAN_ID_KEY = 'kumpas_last_rehearsal_plan_id'

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
        if (currentPlanIdRef.current === planId) {
          setActivePlan(data)
          localStorage.setItem(LAST_PLAN_ID_KEY, String(planId))
        }
      })
      return
    }

    if (loadStartedRef.current) return
    loadStartedRef.current = true

    async function loadOrCreatePlan() {
      // Prefer reopening whichever plan was last accessed (any session,
      // any tab) over always defaulting to the earliest-dated plan.
      const lastPlanId = localStorage.getItem(LAST_PLAN_ID_KEY)
      if (lastPlanId) {
        try {
          const lastPlan = await getRehearsalPlan(Number(lastPlanId))
          currentPlanIdRef.current = lastPlan.id
          setActivePlan(lastPlan)
          return
        } catch {
          // Plan no longer exists (e.g. deleted) — fall through to the
          // usual "first plan, or create one" logic below.
        }
      }

      const plans = await getRehearsalPlans()
      const plan =
        plans.length > 0
          ? plans[0]
          : await createRehearsalPlan({ date: getLocalDateString(), title: 'Untitled Rehearsal' })

      currentPlanIdRef.current = plan.id
      setActivePlan(plan)
      localStorage.setItem(LAST_PLAN_ID_KEY, String(plan.id))
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
