// frontend/src/utils/timeGrid.js
export const SLOT_MINUTES = 5
export const LABEL_EVERY_N_SLOTS = 3   // labels shown every 3 slots = every 15 min
export const ROW_HEIGHT = 16           // px — must match .time-slot's height in App.css

function parseTimeToMinutes(time) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

// How many 5-min rows fit between a plan's start_time and end_time
export function getTotalSlots(startTime, endTime) {
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)
  return Math.max(1, Math.round((endMinutes - startMinutes) / SLOT_MINUTES))
}

export function slotIndexToTime(index, startTime) {
  const startMinutes = parseTimeToMinutes(startTime)
  const totalMinutes = startMinutes + index * SLOT_MINUTES
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function timeToSlotIndex(time, startTime) {
  const startMinutes = parseTimeToMinutes(startTime)
  const totalMinutes = parseTimeToMinutes(time)
  return Math.round((totalMinutes - startMinutes) / SLOT_MINUTES)
}

export function durationToSlotSpan(durationMinutes) {
  if (!durationMinutes) return 1
  return Math.max(1, Math.round(durationMinutes / SLOT_MINUTES))
}

// --- 24-hour <-> 12-hour AM/PM conversion, for the editable time picker ---

export function to12Hour(time24) {
  const [hourStr, minuteStr] = time24.split(':')
  const hour24 = Number(hourStr)
  const period = hour24 >= 12 ? 'PM' : 'AM'
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12
  return { hour: hour12, minute: Number(minuteStr), period }
}

export function to24Hour(hour12, minute, period) {
  let hour24 = hour12 % 12
  if (period === 'PM') hour24 += 12
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// Formats a 24-hour "HH:MM" string as a 12-hour label for display, e.g. "5:30 PM"
export function formatTimeLabel(time24) {
  const { hour, minute, period } = to12Hour(time24)
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`
}
