import { useEffect, useState } from 'react'

const getFileKind = (attachment) => {
  const type = attachment.type || ''
  const extension = attachment.name?.split('.').pop()?.toLowerCase() || ''

  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf' || extension === 'pdf') return 'pdf'
  if (type.startsWith('audio/')) return 'audio'
  if (type.startsWith('video/')) return 'video'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive'
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) return 'document'
  if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) return 'spreadsheet'
  if (type.startsWith('text/') || ['csv', 'json', 'md', 'xml', 'log', 'js', 'jsx', 'css', 'html'].includes(extension)) return 'text'
  return 'other'
}

const getFileLabel = (attachment) => {
  const kind = getFileKind(attachment)
  const extension = attachment.name?.split('.').pop()?.toUpperCase() || ''
  const labels = {
    image: 'IMG',
    pdf: 'PDF',
    audio: 'AUDIO',
    video: 'VIDEO',
    archive: 'ZIP',
    document: extension || 'DOC',
    spreadsheet: extension || 'XLS',
    text: extension || 'TXT',
    other: extension || 'FILE',
  }
  return labels[kind]
}

export const FileTypeIcon = ({ attachment, className = '' }) => (
  <span className={`file-type-icon file-type-${getFileKind(attachment)} ${className}`} aria-hidden="true">
    <span>{getFileLabel(attachment)}</span>
  </span>
)

const getFileIcon = (attachment) => (
  <FileTypeIcon attachment={attachment} />
)

function AttachmentPreview({ attachment, onClose }) {
  const [textContent, setTextContent] = useState('')
  const kind = getFileKind(attachment)
  const hasData = Boolean(attachment.data)

  useEffect(() => {
    if (kind !== 'text' || !hasData) {
      setTextContent('')
      return undefined
    }

    let isCurrent = true
    fetch(attachment.data)
      .then((response) => response.text())
      .then((value) => {
        if (isCurrent) setTextContent(value)
      })
      .catch(() => {
        if (isCurrent) setTextContent('Unable to preview this text file.')
      })

    return () => {
      isCurrent = false
    }
  }, [attachment, kind, hasData])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const openFile = () => {
    if (attachment.data) window.open(attachment.data, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="attachment-preview-overlay" role="presentation" onMouseDown={onClose}>
      <section className="attachment-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="attachment-preview-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="attachment-preview-header">
          <div>
            <p className="attachment-preview-kind">{getFileIcon(attachment)} <span>{getFileKind(attachment)}</span></p>
            <h2 id="attachment-preview-title" title={attachment.name}>{attachment.name}</h2>
          </div>
          <button type="button" className="attachment-preview-close" onClick={onClose} aria-label="Close preview" title="Close preview">×</button>
        </header>

        <div className={`attachment-preview-content attachment-preview-${kind}`}>
          {!hasData && <p className="attachment-empty-message">This file has no preview data.</p>}
          {kind === 'image' && hasData && <img src={attachment.data} alt={attachment.name} />}
          {kind === 'pdf' && hasData && <iframe src={attachment.data} title={attachment.name} />}
          {kind === 'text' && hasData && <pre>{textContent}</pre>}
          {kind === 'other' && (
            <div className="attachment-file-card">
              <FileTypeIcon attachment={attachment} className="attachment-file-icon" />
              <h3>{attachment.name}</h3>
              <p>This file type cannot be previewed here.</p>
              <div className="attachment-file-actions">
                <a className="attachment-download-button" href={attachment.data} download={attachment.name}>Download</a>
                <button type="button" className="attachment-open-button" onClick={openFile} disabled={!hasData}>Open</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default AttachmentPreview
