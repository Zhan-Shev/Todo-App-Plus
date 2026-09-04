import { useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import DOMPurify from 'dompurify'
import 'react-datepicker/dist/react-datepicker.css'
import TimePicker from './TimePicker'

const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2024, month, 1))
)
const NOTES_CHARACTER_LIMIT = 1000

const getPlainText = (value = '') =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const sanitizeNotes = (value = '') => DOMPurify.sanitize(value, {
  ALLOWED_TAGS: ['p', 'br', 'div', 'ul', 'ol', 'li', 'span', 'font'],
  ALLOWED_ATTR: ['color', 'size'],
})

const formatDay = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
    new Date(`${date}T12:00:00`)
  )
}

const parseTaskDate = (value) => value ? new Date(`${value}T12:00:00`) : null

const getWeekdayColorClass = (value) => {
  const valueDate = parseTaskDate(value)
  return valueDate ? `weekday-color-${valueDate.getDay()}` : ''
}

const formatTaskDate = (value) => {
  if (!value) return ''
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function TaskEditor({ todo = {}, onSave, onCreate, onClose, title: editorTitle, }) {
  const isNewTask = !todo.id
  const [title, setTitle] = useState(getPlainText(todo.text))
  const [date, setDate] = useState(todo.date || '')
  const [draftDate, setDraftDate] = useState(() => parseTaskDate(todo.date))
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [time, setTime] = useState(todo.time || '')
  const [priority, setPriority] = useState(todo.priority || 'blue')
  const [notes, setNotes] = useState(todo.notes || '')
  const [attachments, setAttachments] = useState(todo.attachments || [])
  const [validationError, setValidationError] = useState('')
  const datePickerRef = useRef(null)
  const fileInputRef = useRef(null)
  const notesEditorRef = useRef(null)
  const notesSelectionRef = useRef(null)
  const notesCharacterCount = getPlainText(notes).length


  const getNotesEditor = () => notesEditorRef.current

  const saveNotesSelection = () => {
    const editor = getNotesEditor()
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      notesSelectionRef.current = range.cloneRange()
    }
  }

  const restoreNotesSelection = () => {
    const editor = getNotesEditor()
    const selection = window.getSelection()
    if (!editor) return
    editor.focus()
    selection.removeAllRanges()
    if (notesSelectionRef.current) {
      selection.addRange(notesSelectionRef.current)
      return
    }
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.addRange(range)
  }

  const formatNotes = (command, value = null) => {
    restoreNotesSelection()
    document.execCommand(command, false, value)
    const editor = getNotesEditor()
    if (editor) {
      setNotes(editor.innerHTML)
      saveNotesSelection()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (isDatePickerOpen) {
        setIsDatePickerOpen(false)
        datePickerRef.current?.setOpen(false)
        return
      }
      if (!document.querySelector('.time-picker-overlay')) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDatePickerOpen, onClose])

  const openDatePicker = () => {
    setDraftDate(parseTaskDate(date))
  }

  const handleNotesInput = (event) => {
    const rawNotes = event.currentTarget.innerHTML
    const nextNotes = sanitizeNotes(rawNotes)
    const nextCharacterCount = getPlainText(nextNotes).length

    if (nextCharacterCount <= NOTES_CHARACTER_LIMIT) {
      if (nextNotes !== rawNotes) event.currentTarget.innerHTML = nextNotes
      setNotes(nextNotes)
      return
    }

    event.currentTarget.innerHTML = notes
  }

  const insertPlainNotesText = (text) => {
    const editor = getNotesEditor()
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount) return

    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return

    const selectedLength = selection.toString().length
    const availableCharacters = Math.max(
      0,
      NOTES_CHARACTER_LIMIT - (getPlainText(editor.innerHTML).length - selectedLength)
    )
    const allowedText = text.slice(0, availableCharacters)
    if (!allowedText) return

    range.deleteContents()
    const textNode = document.createTextNode(allowedText)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    setNotes(sanitizeNotes(editor.innerHTML))
  }

  const handleNotesPaste = (event) => {
    event.preventDefault()
    insertPlainNotesText(event.clipboardData.getData('text/plain'))
  }

  const handleNotesDrop = (event) => {
    event.preventDefault()
    insertPlainNotesText(event.dataTransfer.getData('text/plain'))
  }

  const closeDatePicker = () => {
    setIsDatePickerOpen(false)
    datePickerRef.current?.setOpen(false)
  }

  const cancelDatePicker = () => {
    setDraftDate(parseTaskDate(date))
    closeDatePicker()
  }

  useEffect(() => {
    if (!isDatePickerOpen) return undefined

    const handleDatePickerBackdrop = (event) => {
      if (
        event.target.closest('.react-datepicker') ||
        event.target.closest('.react-datepicker__input-container')
      ) return

      setDraftDate(parseTaskDate(date))
      setIsDatePickerOpen(false)
      datePickerRef.current?.setOpen(false)
    }

    document.addEventListener('mousedown', handleDatePickerBackdrop, true)
    return () => document.removeEventListener('mousedown', handleDatePickerBackdrop, true)
  }, [date, isDatePickerOpen])

  const applyDatePicker = () => {
    if (!draftDate) return
    setDate(formatTaskDate(draftDate))
    closeDatePicker()
  }

  const handleFiles = (event) => {
    const files = [...(event.target.files || [])]
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setAttachments((current) => [
          ...current,
          { name: file.name, type: file.type, size: file.size, data: reader.result },
        ])
      }
      reader.readAsDataURL(file)
    })
    event.target.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim()) {
      setValidationError('Enter a task name.')
      return
    }
    if (!date || !time) {
      setValidationError('Date and time are required.')
      return
    }
    if (notesCharacterCount > NOTES_CHARACTER_LIMIT) {
      setValidationError(`Notes cannot exceed ${NOTES_CHARACTER_LIMIT} characters.`)
      return
    }
    setValidationError('')
    const updates = {
      text: title.trim(),
      date,
      time,
      priority,
      notes: getPlainText(notes) ? notes : '',
      attachments,
    }
    if (isNewTask) onCreate(updates)
    else onSave(todo.id, updates)
  }

  return (
    <div className="task-editor-overlay" role="presentation" onMouseDown={onClose}>
      <form className="task-editor-dialog" onSubmit={handleSubmit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="task-editor-topbar">
          <button type="button" className="back-button" onClick={onClose} aria-label="Close editor" title="Close editor">←</button>
          <h2>{editorTitle || (isNewTask ? 'Add a task' : 'Edit task')}</h2>
          <div className="container">
        <button type="submit" className="cursor-box pointer">Save</button>
      
          </div>
        </div>

        <label className="task-field">
          <span>Task name</span>
          {/* <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Walk the dog" autoFocus/> */}
          <input
  value={title}
  onChange={(event) => {
    if (event.target.value.length <= 50) {
      setTitle(event.target.value)
    }
  }}
  placeholder="Example: Walk the dog"
  autoFocus
/>
        </label>

        {validationError && <p className="task-editor-error" role="alert">{validationError}</p>}

        <fieldset className="task-fieldset">
          <legend>Schedule</legend>
          <div className="schedule-fields">
            <div className="task-field">
              <span>Date</span>
<DatePicker
    ref={datePickerRef}
    selected={isDatePickerOpen ? draftDate : parseTaskDate(date)}
    onChange={setDraftDate}
    onInputClick={openDatePicker}
    onCalendarOpen={() => setIsDatePickerOpen(true)}
    onCalendarClose={() => {
      setDraftDate(parseTaskDate(date))
      setIsDatePickerOpen(false)
    }}
    onClickOutside={cancelDatePicker}
    shouldCloseOnSelect={false}
    placeholderText="Select"
    dateFormat="dd MMM yyyy"
    className="date-picker-input"
    calendarClassName="date-picker-calendar"
    showIcon
    icon={(
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16" />
      </svg>
    )}
    calendarIconClassName="date-picker-field-icon"
    toggleCalendarOnIconClick
    calendarStartDay={1}
    showPopperArrow={false}
    renderCustomHeader={({
      date: visibleDate,
      changeYear,
      changeMonth,
      decreaseMonth,
      increaseMonth,
      prevMonthButtonDisabled,
      nextMonthButtonDisabled,
    }) => {
      const visibleYear = visibleDate.getFullYear()
      const years = Array.from({ length: 21 }, (_, index) => visibleYear - 10 + index)

      return (
        <div className="date-picker-custom-header">
          <button
            type="button"
            className="date-picker-arrow"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            aria-label="Previous month"
          >
            ‹
          </button>
          <label>
            <span>Month</span>
            <select
              value={visibleDate.getMonth()}
              onChange={(event) => changeMonth(Number(event.target.value))}
              aria-label="Month"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Year</span>
            <select
              value={visibleYear}
              onChange={(event) => changeYear(Number(event.target.value))}
              aria-label="Year"
            >
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <button
            type="button"
            className="date-picker-arrow"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      )
    }}
    withPortal
>
  <div className="date-picker-footer">
    <div className="date-picker-actions">
      <button type="button" className="date-picker-today cursor-box pointer" onClick={() => setDraftDate(new Date())}>
        Today
      </button>
      <div className="date-picker-confirm-actions">
        <button type="button" className="date-picker-cancel cursor-box pointer" onClick={cancelDatePicker}>
          Cancel
        </button>
        <button type="button" className="date-picker-apply cursor-box pointer" onClick={applyDatePicker} disabled={!draftDate}>
          Apply
        </button>
      </div>
    </div>
    <p className="date-picker-hint">Cursor keys can navigate dates</p>
  </div>
</DatePicker>
            </div>
            <div className="task-field">
              <span>Time</span>
              <TimePicker value={time} onChange={setTime} />
            </div>
          </div>
          {date && (
            <p className={`selected-day ${getWeekdayColorClass(date)}`}>
              {formatDay(date)}
            </p>
          )}
        </fieldset>

        <fieldset className="task-fieldset priority-fieldset">
          <legend>Priority</legend>
          <div className="priority-options">
            {[
              ['red', 'High'],
              ['orange', 'Medium'],
              ['green', 'Low'],
              ['blue', 'Info'],
            ].map(([value, label]) => (
              <label key={value} className={`priority-option priority-option-${value}`}>
                <input type="radio" name="priority" value={value} checked={priority === value} onChange={() => setPriority(value)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="task-field">
          <span>Notes</span>
          <div className="notes-mini-editor">
            <div
              className="notes-mini-toolbar"
              role="toolbar"
              aria-label="Notes formatting"
              onMouseDown={(event) => {
                if (event.target.closest('button, select')) {
                  saveNotesSelection()
                  if (event.target.closest('button')) event.preventDefault()
                }
              }}
            >
              <select aria-label="Notes text size" defaultValue="3" onChange={(event) => formatNotes('fontSize', event.target.value)}>
                <option value="2">Small</option>
                <option value="3">Normal</option>
                <option value="5">Large</option>
              </select>
              <div className="notes-color-palette" role="group" aria-label="Notes text color">
                {[
                  ['#172033', 'Black'],
                  ['#ef4444', 'Red'],
                  ['#f97316', 'Orange'],
                  ['#10b981', 'Green'],
                  ['#2563eb', 'Blue'],
                ].map(([color, name]) => (
                  <button key={color} type="button" className="notes-color-button" style={{ '--color': color }} onClick={() => formatNotes('foreColor', color)} title={`${name} text`} aria-label={`${name} text`} />
                ))}
              </div>
              <span className="notes-toolbar-divider" />
              <button type="button" onClick={() => formatNotes('insertUnorderedList')} title="Bullet list" aria-label="Bullet list">•</button>
              <button type="button" onClick={() => formatNotes('insertOrderedList')} title="Numbered list" aria-label="Numbered list">1.</button>
            </div>
            <div
              ref={notesEditorRef}
              className="notes-editor-content"
              contentEditable
              data-placeholder="Tap here to add notes"
              onInput={handleNotesInput}
              onPaste={handleNotesPaste}
              onDrop={handleNotesDrop}
              onDragOver={(event) => event.preventDefault()}
              onKeyUp={saveNotesSelection}
              onMouseUp={saveNotesSelection}
              onFocus={saveNotesSelection}
              dangerouslySetInnerHTML={{ __html: notes }}
              suppressContentEditableWarning
            />
            <p
              className={`notes-character-count${notesCharacterCount >= NOTES_CHARACTER_LIMIT ? ' is-at-limit' : ''}`}
              aria-live="polite"
            >
              {notesCharacterCount} / {NOTES_CHARACTER_LIMIT}
            </p>
          </div>
        </div>

        <section className="task-field attachment-section">
          <div className="attachment-heading">
            <span>Attachments</span>
            <button type="button" className="add-attachment-button" onClick={() => fileInputRef.current?.click()} aria-label="Add attachment" title="Add attachment">+</button>
          </div>
          <input ref={fileInputRef} className="hidden-file-input" type="file" multiple onChange={handleFiles} />
          {attachments.length === 0 ? (
            <button type="button" className="attachment-dropzone" onClick={() => fileInputRef.current?.click()}>Tap here to add files</button>
          ) : (
            <ul className="attachment-list">
              {attachments.map((attachment, index) => (
                <li key={`${attachment.name}-${index}`}>
                  <span title={attachment.name}>{attachment.name}</span>
                  <button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${attachment.name}`} title="Remove attachment">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </form>
    </div>
  )
}

export default TaskEditor
