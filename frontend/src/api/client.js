// In production, set VITE_API_URL in your hosting platform's environment
// variables (e.g. Vercel project settings) to your deployed backend's URL.
// Locally, it falls back to your dev backend.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ACCESS_CODE_KEY = 'kumpas_access_code'

export function getStoredAccessCode() {
  return sessionStorage.getItem(ACCESS_CODE_KEY) || ''
}

export function setStoredAccessCode(code) {
  sessionStorage.setItem(ACCESS_CODE_KEY, code)
}

export function clearStoredAccessCode() {
  sessionStorage.removeItem(ACCESS_CODE_KEY)
}

// A lightweight, standalone check used only by the password gate itself —
// deliberately bypasses apiFetch's reload-on-401 behavior (that's meant for
// an already-unlocked session losing its code mid-use, not for the initial
// "is this password even right" check, which should just show a clean
// inline error instead of reloading the page).
export async function checkAccessCode(code) {
  const response = await fetch(`${BASE_URL}/songs`, {
    headers: { 'X-Access-Code': code },
  })
  return response.ok
}

// Centralized fetch wrapper — attaches the access code to every request and
// gives every API function the same error handling, instead of repeating
// this logic (and forgetting it) in each function individually.
async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    'X-Access-Code': getStoredAccessCode(),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    // Wrong or missing code — clear it and reload so the password gate reappears
    clearStoredAccessCode()
    window.location.reload()
    throw new Error('Access code required')
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Request failed (status ${response.status})`)
  }

  return response.json()
}

export async function getAppInfo() {
  return apiFetch('/appinfo')
}

export async function getSongs() {
  return apiFetch('/songs')
}

export async function createSong(song) {
  return apiFetch('/songs', {
    method: 'POST',
    body: JSON.stringify(song),
  })
}

export async function updateSong(id, updates) {
  return apiFetch(`/songs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteSong(id) {
  return apiFetch(`/songs/${id}`, { method: 'DELETE' })
}

export async function getRehearsalPlans() {
  return apiFetch('/rehearsal-plans')
}

export async function getRehearsalPlan(id) {
  return apiFetch(`/rehearsal-plans/${id}`)
}

export async function createRehearsalPlan(plan) {
  return apiFetch('/rehearsal-plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  })
}

export async function updateRehearsalPlan(id, updates) {
  return apiFetch(`/rehearsal-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function addPlanItem(planId, item) {
  return apiFetch(`/rehearsal-plans/${planId}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

export async function updatePlanItem(planId, itemId, updates) {
  return apiFetch(`/rehearsal-plans/${planId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deletePlanItem(planId, itemId) {
  return apiFetch(`/rehearsal-plans/${planId}/items/${itemId}`, { method: 'DELETE' })
}
