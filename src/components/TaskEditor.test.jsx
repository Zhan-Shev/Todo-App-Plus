import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import TaskEditor from './TaskEditor'

const todo = {
  id: 1,
  text: 'Task with limited notes',
  completed: false,
  priority: 'blue',
  notes: '',
  date: '2026-09-04',
  time: '14:00',
  attachments: [],
}

test('accepts up to 1000 visible note characters and rejects additional input', () => {
  const { container } = render(
    <TaskEditor todo={todo} onSave={vi.fn()} onClose={vi.fn()} />
  )
  const editor = container.querySelector('.notes-editor-content')

  editor.innerHTML = 'a'.repeat(1000)
  fireEvent.input(editor)
  expect(screen.getByText('1000 / 1000')).toBeInTheDocument()

  editor.innerHTML = `${'a'.repeat(1000)}b`
  fireEvent.input(editor)
  expect(editor).toHaveTextContent(/^a{1000}$/)
  expect(screen.getByText('1000 / 1000')).toBeInTheDocument()
})

test('does not count formatting tags as note characters', () => {
  const { container } = render(
    <TaskEditor todo={todo} onSave={vi.fn()} onClose={vi.fn()} />
  )
  const editor = container.querySelector('.notes-editor-content')

  editor.innerHTML = '<strong>Hello</strong>'
  fireEvent.input(editor)

  expect(screen.getByText('5 / 1000')).toBeInTheDocument()
})

test('removes images and unsupported pasted markup from notes', () => {
  const { container } = render(
    <TaskEditor todo={todo} onSave={vi.fn()} onClose={vi.fn()} />
  )
  const editor = container.querySelector('.notes-editor-content')

  editor.innerHTML = '<p>Hello<img src="data:image/png;base64,test"><iframe src="https://example.com"></iframe></p>'
  fireEvent.input(editor)

  expect(editor.querySelector('img')).not.toBeInTheDocument()
  expect(editor.querySelector('iframe')).not.toBeInTheDocument()
  expect(editor).toHaveTextContent('Hello')
  expect(screen.getByText('5 / 1000')).toBeInTheDocument()
})

test('clicking the date picker backdrop closes it like Cancel', () => {
  render(<TaskEditor todo={todo} onSave={vi.fn()} onClose={vi.fn()} />)

  fireEvent.click(screen.getByDisplayValue('04 Sep 2026'))
  const portalBackdrop = document.querySelector('.react-datepicker__portal')
  expect(portalBackdrop).toBeInTheDocument()

  fireEvent.mouseDown(portalBackdrop)

  expect(document.querySelector('.react-datepicker__portal')).not.toBeInTheDocument()
  expect(screen.getByDisplayValue('04 Sep 2026')).toBeInTheDocument()
})
