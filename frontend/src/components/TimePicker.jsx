import { to12Hour, to24Hour } from '../utils/timeGrid'

function TimePicker({ value, onChange }) {
  const { hour, minute, period } = to12Hour(value)

  function update(newHour, newMinute, newPeriod) {
    onChange(to24Hour(newHour, newMinute, newPeriod))
  }

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5) // 0, 5, 10, ..., 55 — matches the grid's 5-min granularity

  return (
    <div className="time-picker">
      <select value={hour} onChange={(e) => update(Number(e.target.value), minute, period)}>
        {hourOptions.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span>:</span>
      <select value={minute} onChange={(e) => update(hour, Number(e.target.value), period)}>
        {minuteOptions.map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      <select value={period} onChange={(e) => update(hour, minute, e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

export default TimePicker
