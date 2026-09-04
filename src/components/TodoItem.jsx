import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import AttachmentPreview, { FileTypeIcon } from './AttachmentPreview'

const getWeekdayColorClass = (value) => {
  if (!value) return ''
  return `weekday-color-${new Date(`${value}T12:00:00`).getDay()}`
}

function TodoItem({ todo, onToggle, onDelete, onEditNotes, isCompleting }) {
  const [isNotesPinned, setIsNotesPinned] = useState(false)
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const singleClickTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(singleClickTimerRef.current), [])

  const notesText = (todo.notes || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const hasNotes = Boolean(notesText)
  const isLong = notesText.length > 120
  const safeNotesHtml = DOMPurify.sanitize(todo.notes || '', {
    ALLOWED_TAGS: ['p', 'br', 'div', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'span', 'font'],
    ALLOWED_ATTR: ['color', 'size'],
  })
  const displayNotes = isNotesExpanded
  ? notesText
  : isLong
    ? notesText.slice(0, 120) + '...'
    : notesText

  const handleCardClick = (event) => {
    if (!hasNotes || event.target.closest('button, input, label, a')) return

    clearTimeout(singleClickTimerRef.current)
    singleClickTimerRef.current = setTimeout(() => {
      setIsNotesPinned((isPinned) => {
        if (isPinned) setIsNotesExpanded(false)
        return !isPinned
      })
    }, 220)
  }

  const handleCardDoubleClick = (event) => {
    if (event.target.closest('button, input, label, a')) return

    clearTimeout(singleClickTimerRef.current)
    setIsNotesPinned(false)
    setIsNotesExpanded(false)
    onEditNotes(todo)
  }

  return (
    <li className={`todo-item${hasNotes ? ' has-notes' : ''}${isNotesPinned ? ' is-notes-pinned' : ''}${isNotesExpanded ? ' is-notes-expanded' : ''}`}>
      <div
        className={`todo-item-header todo-slide todo-slide1 todo-priority-${todo.priority || 'blue'} flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 pt-1 pr-1 "`}
        onClick={handleCardClick}
        onDoubleClick={handleCardDoubleClick}
      >
        <div className={`checkbox-wrapper-18 ${isCompleting === todo.id ? 'is-completing' : ''}`}>
        <div className="round">
          <input
            type="checkbox"
            id={`todo-checkbox-${todo.id}`}
            checked={todo.completed || isCompleting === todo.id}
            onChange={() => onToggle(todo.id)}
            aria-label={`Mark ${todo.text} as completed`}
          />
          <label htmlFor={`todo-checkbox-${todo.id}`}>
            <svg className="checkmark" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="checkmark-circle-line" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </label>
        </div>
      </div>

        <div className={`todo-date-block ${todo.date ? '' : 'is-empty'} ${getWeekdayColorClass(todo.date)}`}>
          {todo.date && (
            <>
              <strong>{new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(new Date(`${todo.date}T12:00:00`))}</strong>
              <span>{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${todo.date}T12:00:00`))}</span>
            </>
          )}
        </div>

        <div className="todo-item-copy">
          {todo.time && <span className="todo-item-time">{todo.time}</span>}
          <div
            className={`todo-item-content ${
              todo.completed ? 'line-through text-slate-400' : 'text-slate-800'
            }`}
            dangerouslySetInnerHTML={{ __html: todo.text }}
          />
        </div>

        <div className="todo-item-meta">
          {todo.attachments?.length > 0 && (
            <button
              type="button"
              className="attachment-pin-button"
              onClick={() => setPreviewAttachment(todo.attachments[0])}
              title="Open attachments"
              aria-label={`Open ${todo.attachments.length} attachment${todo.attachments.length === 1 ? '' : 's'}`}
            >
              <span className="attachment-pin-mark" aria-hidden="true">
                <img src="/file%20pic.svg" alt="" />
              </span>
              <FileTypeIcon
                attachment={todo.attachments[0]}
                className="attachment-file-badge"
              />
              {todo.attachments.length > 1 && <span>{todo.attachments.length}</span>}
            </button>
          )}
        </div>

        <div className="todo-item-actions">
<div className="close-button">
  <button type="button"
  onClick={() => onDelete(todo.id)}
            className="delete-button"
            title="Delete"
            aria-label={`Delete ${todo.text}`}>
    <span className="left">
      <span className="circle-left"></span>
      <span className="circle-right"></span>
    </span>

    <span className="right">
      <span className="circle-left"></span>
      <span className="circle-right"></span>
    </span>
  </button>
</div>


          <button
            type="button"
            onPointerDown={(event) => {
              event.stopPropagation()
              onEditNotes(todo)
            }}
            onClick={(event) => {
              event.stopPropagation()
              onEditNotes(todo)
            }}
            className="todo-edit-button"
            title="Edit notes"
          >
<svg width="35px" height="35px" viewBox="0 0 24 24" fill="none">
<path d="M13.5 5.5L6.45321 12.5468C6.22845 12.7716 6.11607 12.8839 6.04454 13.0229C5.97301 13.1619 5.94689 13.3187 5.89463 13.6322L5.11508 18.3095C5.06262 18.6243 5.03639 18.7817 5.12736 18.8726C5.21833 18.9636 5.37571 18.9374 5.69048 18.8849L10.3678 18.1054L10.3678 18.1054C10.6813 18.0531 10.8381 18.027 10.9771 17.9555C11.1161 17.8839 11.2284 17.7716 11.4532 17.5468L11.4532 17.5468L18.5 10.5C19.5171 9.48295 20.0256 8.97442 20.1384 8.36277C20.1826 8.12295 20.1826 7.87705 20.1384 7.63723C20.0256 7.02558 19.5171 6.51705 18.5 5.5C17.4829 4.48295 16.9744 3.97442 16.3628 3.8616C16.1229 3.81737 15.8771 3.81737 15.6372 3.8616C15.0256 3.97442 14.5171 4.48294 13.5 5.5Z" fill="#ec6810" fill-opacity="0.24"/>
<path d="M12.2929 6.70711L6.45321 12.5468C6.22845 12.7716 6.11607 12.8839 6.04454 13.0229C5.97301 13.1619 5.94689 13.3187 5.89463 13.6322L5.11508 18.3095C5.06262 18.6243 5.03639 18.7817 5.12736 18.8726C5.21833 18.9636 5.37571 18.9374 5.69048 18.8849L10.3678 18.1054L10.3678 18.1054C10.6813 18.0531 10.8381 18.027 10.9771 17.9555C11.1161 17.8839 11.2284 17.7716 11.4532 17.5468L11.4532 17.5468L17.2929 11.7071C17.6262 11.3738 17.7929 11.2071 17.7929 11C17.7929 10.7929 17.6262 10.6262 17.2929 10.2929L17.2929 10.2929L13.7071 6.70711C13.3738 6.37377 13.2071 6.20711 13 6.20711C12.7929 6.20711 12.6262 6.37377 12.2929 6.70711Z" fill="#222222"/>
</svg>

            {/* Edit */}
          </button>
        </div>
      </div>
      

      {hasNotes && (
        <div className="todo-notes border-t border-slate-100 px-4 pb-3">
          <div className="todo-notes-toggle todo-slide todo-slide2">
            <span className="todo-notes-text">
              {isNotesExpanded ? (
                <span dangerouslySetInnerHTML={{ __html: safeNotesHtml }} />
              ) : (
                <span>{displayNotes}</span>
              )}
            </span>

            {isLong && (
              <button
                type="button"
                className={`todo-notes-arrow ${isNotesExpanded ? 'is-expanded' : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setIsNotesPinned(true)
                  setIsNotesExpanded((expanded) => !expanded)
                }}
                aria-label={isNotesExpanded ? 'Collapse notes' : 'Expand notes'}
                aria-expanded={isNotesExpanded}
                title={isNotesExpanded ? 'Collapse notes' : 'Show full notes'}
              >
                ↓
              </button>
            )}
          </div>
        </div>
      )}
      {previewAttachment && (
        <AttachmentPreview
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </li>
  )
}

export default TodoItem
