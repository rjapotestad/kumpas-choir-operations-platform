// In production, set VITE_API_URL in your hosting platform's environment
// variables (e.g. Vercel project settings) to your deployed backend's URL.
// Locally, it falls back to your dev backend.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getAppInfo() {
  const response = await fetch(`${BASE_URL}/appinfo`)
  return response.json()
}
export async function getSongs(){
  const response = await fetch(`${BASE_URL}/songs`)
  return response.json()
}
export async function createSong(song){
  const response = await fetch (`${BASE_URL}/songs`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(song),
  })
  return response.json()
}
export async function updateSong(id, updates) {
  const response = await fetch(`${BASE_URL}/songs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function deleteSong(id) {
  const response = await fetch(`${BASE_URL}/songs/${id}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function getRehearsalPlans() {
  const response = await fetch(`${BASE_URL}/rehearsal-plans`)
  return response.json()
}

export async function getRehearsalPlan(id) {
  const response = await fetch(`${BASE_URL}/rehearsal-plans/${id}`)
  return response.json()
}

export async function createRehearsalPlan(plan) {
  const response = await fetch(`${BASE_URL}/rehearsal-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  })
  return response.json()
}

export async function updateRehearsalPlan(id, updates) {
  const response = await fetch(`${BASE_URL}/rehearsal-plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function addPlanItem(planId, item) {
  const response = await fetch(`${BASE_URL}/rehearsal-plans/${planId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return response.json()
}

export async function updatePlanItem(planId, itemId, updates) {
  const response = await fetch(`${BASE_URL}/rehearsal-plans/${planId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return response.json()
}

export async function deletePlanItem(planId, itemId) {
  const response = await fetch(`${BASE_URL}/rehearsal-plans/${planId}/items/${itemId}`, {
    method: 'DELETE',
  })
  return response.json()
}