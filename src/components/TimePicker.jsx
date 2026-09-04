import { useEffect, useState } from 'react'

const MINUTE_STEP = 15

const padTimePart = (value) => String(value).padStart(2, '0')

const getInitialTime = (value) => {
  if (/^\d{2}:\d{2}$/.test(value || '')) {
    const [hours, minutes] = value.split(':').map(Number)
    return {
      hours: Math.min(23, Math.max(0, hours)),
      minutes: Math.min(59, Math.max(0, minutes)),
    }
  }

  const now = new Date()
  const roundedMinutes = Math.ceil(now.getMinutes() / MINUTE_STEP) * MINUTE_STEP
  return {
    hours: (now.getHours() + Math.floor(roundedMinutes / 60)) % 24,
    minutes: roundedMinutes % 60,
  }
}

function TimePicker({ value, onChange }) {
  const initialTime = getInitialTime(value)
  const [isOpen, setIsOpen] = useState(false)
  const [draftHours, setDraftHours] = useState(initialTime.hours)
  const [draftMinutes, setDraftMinutes] = useState(initialTime.minutes)

  const openPicker = () => {
    const nextTime = getInitialTime(value)
    setDraftHours(nextTime.hours)
    setDraftMinutes(nextTime.minutes)
    setIsOpen(true)
  }

  const closePicker = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closePicker()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen])

  const changeHours = (direction) => {
    setDraftHours((current) => (current + direction + 24) % 24)
  }

  const changeMinutes = (direction) => {
    setDraftMinutes((current) => {
      const next = current + direction * MINUTE_STEP
      if (next >= 60) {
        changeHours(1)
        return next - 60
      }
      if (next < 0) {
        changeHours(-1)
        return next + 60
      }
      return next
    })
  }

  const saveTime = () => {
    onChange(`${padTimePart(draftHours)}:${padTimePart(draftMinutes)}`)
    closePicker()
  }

  const adjacentHour = (direction) => (draftHours + direction + 24) % 24
  const adjacentMinute = (direction) => (
    draftMinutes + direction * MINUTE_STEP + 60
  ) % 60

  return (
    <>
      <button
        type="button"
        className={`time-picker-trigger${value ? ' has-value' : ''}`}
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>{value || 'Select'}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5l3.2 1.8" />
        </svg>
      </button>

      {isOpen && (
        <div className="time-picker-overlay" role="presentation" onMouseDown={closePicker}>
          <section
            className="time-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="time-picker-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="time-picker-title">Set time</h3>

            <div className="time-wheel-labels" aria-hidden="true">
              <span>Hour</span>
              <span>Minute</span>
            </div>

            <div className="time-wheel" aria-label="Selected time">
              <div className="time-wheel-row time-wheel-row-muted">
                <button type="button" onClick={() => changeHours(-1)} aria-label="Previous hour">
                  {padTimePart(adjacentHour(-1))}
                </button>
                <span>:</span>
                <button type="button" onClick={() => changeMinutes(-1)} aria-label="Previous 15 minutes">
                  {padTimePart(adjacentMinute(-1))}
                </button>
              </div>

              <div className="time-wheel-row time-wheel-row-selected" aria-live="polite">
                <button
                  type="button"
                  onWheel={(event) => {
                    event.preventDefault()
                    changeHours(event.deltaY > 0 ? 1 : -1)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      changeHours(event.key === 'ArrowUp' ? -1 : 1)
                    }
                  }}
                  aria-label={`Hour ${padTimePart(draftHours)}. Use arrow keys to change.`}
                >
                  {padTimePart(draftHours)}
                </button>
                <span>:</span>
                <button
                  type="button"
                  onWheel={(event) => {
                    event.preventDefault()
                    changeMinutes(event.deltaY > 0 ? 1 : -1)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                      event.preventDefault()
                      changeMinutes(event.key === 'ArrowUp' ? -1 : 1)
                    }
                  }}
                  aria-label={`Minute ${padTimePart(draftMinutes)}. Use arrow keys to change.`}
                >
                  {padTimePart(draftMinutes)}
                </button>
              </div>

              <div className="time-wheel-row time-wheel-row-muted">
                <button type="button" onClick={() => changeHours(1)} aria-label="Next hour">
                  {padTimePart(adjacentHour(1))}
                </button>
                <span>:</span>
                <button type="button" onClick={() => changeMinutes(1)} aria-label="Next 15 minutes">
                  {padTimePart(adjacentMinute(1))}
                </button>
              </div>
            </div>

            <div className="time-picker-actions">
              <button type="button" className="time-picker-cancel cursor-box pointer" onClick={closePicker}>Cancel</button>
              <button type="button" className="time-picker-save cursor-box pointer" onClick={saveTime}>Save</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default TimePicker
