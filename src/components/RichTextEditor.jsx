import { useEffect, useRef, useState } from 'react'
import { ReactSketchCanvas } from 'react-sketch-canvas'

function RichTextEditor({ initialValue = '', onSubmit, onClose, submitLabel = 'Done', placeholder = 'What needs to be done?', closeOnOutsideClick = true }) {
  const [text, setText] = useState(initialValue)
  const [mode, setMode] = useState('text')
  const canvasRef = useRef(null)
  const imageInputRef = useRef(null)
  const editorRef = useRef(null)
  const selectionRef = useRef(null)

  const getEditor = () => editorRef.current?.querySelector('[contenteditable="true"]')

  const saveSelection = () => {
    const editor = getEditor()
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) selectionRef.current = range.cloneRange()
  }

  const restoreSelection = () => {
    const editor = getEditor()
    const selection = window.getSelection()
    if (!editor) return
    editor.focus()
    selection.removeAllRanges()
    if (selectionRef.current) {
      selection.addRange(selectionRef.current)
      return
    }
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.addRange(range)
    selectionRef.current = range.cloneRange()
  }

  const execFormat = (command, value = null) => {
    restoreSelection()
    document.execCommand(command, false, value)
    const editor = getEditor()
    if (editor) {
      setText(editor.innerHTML)
      saveSelection()
    }
  }

  const toggleList = (listTag) => {
    const editor = getEditor()
    if (!editor) return
    restoreSelection()
    const currentList = editor.querySelector(`:scope > ${listTag}`)
    if (currentList) {
      currentList.outerHTML = [...currentList.children].map((item) => `<p>${item.innerHTML || '<br>'}</p>`).join('')
    } else {
      const blocks = [...editor.childNodes].flatMap((node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim() ? [node.textContent] : []
        if (node.nodeType === Node.ELEMENT_NODE && ['OL', 'UL'].includes(node.tagName)) return [...node.children].map((item) => item.innerHTML)
        return node.nodeType === Node.ELEMENT_NODE ? [node.innerHTML || '<br>'] : []
      })
      editor.innerHTML = `<${listTag}>${blocks.map((block) => `<li>${block}</li>`).join('')}</${listTag}>`
    }
    setText(editor.innerHTML)
    editor.focus()
  }

  const insertLink = () => {
    const url = window.prompt('Enter a URL')
    if (url?.trim()) execFormat('createLink', url.trim())
  }

  const insertTable = () => execFormat('insertHTML', '<table><tbody><tr><td> </td><td> </td></tr><tr><td> </td><td> </td></tr></tbody></table><p><br></p>')

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => execFormat('insertHTML', `<img src="${reader.result}" alt="Uploaded image" class="editor-image" />`)
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const applyParagraphSpacing = (value) => {
    restoreSelection()
    const selection = window.getSelection()
    const editor = getEditor()
    const block = selection?.anchorNode?.parentElement?.closest('p, li, h1, h2, h3, blockquote') || editor
    if (!editor?.contains(block)) return
    block.style.lineHeight = value
    setText(editor.innerHTML)
  }

  const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = plainText ? plainText.split(' ').length : 0
  const characterCount = plainText.length

  const save = async (event) => {
    event?.preventDefault()
    if (mode === 'text') {
      if (plainText) await onSubmit(text)
    } else if (canvasRef.current) {
      const dataUrl = await canvasRef.current.exportImage('png')
      await onSubmit(`<img src="${dataUrl}" alt="drawing" class="max-w-full rounded" />`)
      canvasRef.current.clearCanvas()
    }
    onClose?.()
  }

  useEffect(() => {
    const editor = getEditor()
    if (editor && editor.innerHTML !== initialValue) editor.innerHTML = initialValue
  }, [initialValue])

  useEffect(() => {
    if (!onClose || !closeOnOutsideClick) return undefined
    const handleOutsideClick = (event) => {
      if (editorRef.current && !editorRef.current.contains(event.target)) save()
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [onClose, closeOnOutsideClick, text, mode])

  return (
    <form ref={editorRef} onSubmit={save} className="task-editor">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('text')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}>Text</button>
        <button type="button" onClick={() => setMode('draw')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}>Draw</button>
      </div>
      {mode === 'text' && (
        <div className="custom-editor-shell">
          <div className="custom-editor-toolbar" role="toolbar" aria-label="Text formatting" onMouseDown={(event) => { if (event.target.closest('button, select')) { saveSelection(); if (event.target.closest('button')) event.preventDefault() } }}>
            <button type="button" onClick={() => execFormat('undo')} title="Undo">↶</button>
            <button type="button" onClick={() => execFormat('redo')} title="Redo">↷</button>
            <span className="editor-toolbar-divider" />
            <select className="editor-format-select" defaultValue="p" aria-label="Text style" onChange={(event) => execFormat('formatBlock', event.target.value)}><option value="p">Normal</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option></select>
            <select className="editor-format-select editor-spacing-select" defaultValue="normal" aria-label="Line and paragraph spacing" onChange={(event) => applyParagraphSpacing(event.target.value)}><option value="normal">Spacing</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0</option></select>
            <span className="editor-toolbar-divider" />
            <button type="button" onClick={() => execFormat('bold')} title="Bold"><strong>B</strong></button><button type="button" onClick={() => execFormat('italic')} title="Italic"><em>I</em></button><button type="button" onClick={() => execFormat('underline')} title="Underline"><u>U</u></button><button type="button" onClick={() => execFormat('strikeThrough')} title="Strikethrough"><s>S</s></button>
            <span className="editor-toolbar-divider" />
            <button type="button" onClick={() => toggleList('ul')} title="Bullet list">•</button><button type="button" onClick={() => toggleList('ol')} title="Numbered list">1.</button><button type="button" onClick={() => execFormat('justifyLeft')} title="Align left">≡</button><button type="button" onClick={() => execFormat('justifyCenter')} title="Align center">≡</button><button type="button" onClick={() => execFormat('justifyRight')} title="Align right">≡</button><button type="button" onClick={insertLink} title="Insert link">↗</button><button type="button" onClick={() => imageInputRef.current?.click()} title="Upload image">▧</button><button type="button" onClick={insertTable} title="Insert table">▦</button>
            <div className="editor-color-palette" role="group" aria-label="Text colors">{[['#172033', 'Black'], ['#ef4444', 'Red'], ['#f97316', 'Orange'], ['#10b981', 'Green'], ['#2563eb', 'Blue'], ['#8b5cf6', 'Purple'], ['#64748b', 'Gray']].map(([color, name]) => <button key={color} type="button" className="editor-color-button" style={{ '--color': color }} onClick={() => execFormat('foreColor', color)} title={`${name} text`} aria-label={`${name} text`} />)}</div>
            <button type="button" onClick={() => execFormat('removeFormat')} title="Clear formatting">Tx</button>
          </div>
          <input ref={imageInputRef} className="editor-image-input" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageUpload} />
          <div className="custom-editor-content" contentEditable data-placeholder={placeholder} onInput={(event) => setText(event.currentTarget.innerHTML)} onKeyUp={saveSelection} onMouseUp={saveSelection} onFocus={saveSelection} suppressContentEditableWarning />
          <div className="custom-editor-status"><span>Rich text editor</span><span>Words: {wordCount} &nbsp; Characters: {characterCount}</span></div>
        </div>
      )}
      {mode === 'draw' && <div className="bg-white rounded-lg border border-slate-300 overflow-hidden"><div className="flex gap-2 p-2 border-b border-slate-200 bg-slate-50"><button type="button" onClick={() => canvasRef.current?.undo()} className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-slate-100">Undo</button><button type="button" onClick={() => canvasRef.current?.redo()} className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-slate-100">Redo</button><button type="button" onClick={() => canvasRef.current?.clearCanvas()} className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-slate-100">Clear</button></div><ReactSketchCanvas ref={canvasRef} strokeWidth={4} strokeColor="black" canvasColor="white" height="250px" style={{ border: 'none' }} /></div>}
      <button type="submit" className="editor-done-button">{submitLabel}</button>
    </form>
  )
}

export default RichTextEditor
