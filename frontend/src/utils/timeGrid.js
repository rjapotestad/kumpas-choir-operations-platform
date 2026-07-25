// frontend/src/utils/timeGrid.js
export const SLOT_MINUTES = 5
export const LABEL_EVERY_N_SLOTS = 3   // labels shown every 3 slots = every 15 min
export const START_HOUR = 17
export const START_MINUTE = 30   // 5:30 PM
export const TOTAL_SLOTS = 30    // 5:30 PM – 8:00 PM, in 5-min increments
export const ROW_HEIGHT = 16     // px — must match .time-slot's height in App.css

const START_TOTAL_MINUTES = START_HOUR * 60 + START_MINUTE

export function slotIndexToTime(index) {
  const totalMinutes = START_TOTAL_MINUTES + index * SLOT_MINUTES
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function timeToSlotIndex(time) {
  const [hour, minute] = time.split(':').map(Number)
  const totalMinutes = hour * 60 + minute
  return Math.round((totalMinutes - START_TOTAL_MINUTES) / SLOT_MINUTES)
}

export function durationToSlotSpan(durationMinutes) {
  if (!durationMinutes) return 1
  return Math.max(1, Math.round(durationMinutes / SLOT_MINUTES))
}
