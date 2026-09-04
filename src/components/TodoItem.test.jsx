import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import TodoItem from './TodoItem'

const todo = {
  id: 1,
  text: 'Task with notes',
  completed: false,
  priority: 'orange',
  notes: '<p>This is a note that belongs only to this task.</p>',
  date: '2026-09-04',
  time: '14:00',
  attachments: [],
}

test('pins and closes notes only when its task card is clicked', () => {
  vi.useFakeTimers()
  const { container } = render(
    <TodoItem
      todo={todo}
      onToggle={vi.fn()}
      onDelete={vi.fn()}
      onEditNotes={vi.fn()}
      isCompleting={null}
    />
  )
  const item = container.querySelector('.todo-item')

  fireEvent.click(screen.getByText('Task with notes'))
  act(() => vi.advanceTimersByTime(220))
  expect(item).toHaveClass('is-notes-pinned')

  fireEvent.click(screen.getByText('Task with notes'))
  act(() => vi.advanceTimersByTime(220))
  expect(item).not.toHaveClass('is-notes-pinned')
  vi.useRealTimers()
})

test('opens the task editor on a double click without pinning notes', () => {
  vi.useFakeTimers()
  const onEditNotes = vi.fn()
  const { container } = render(
    <TodoItem
      todo={todo}
      onToggle={vi.fn()}
      onDelete={vi.fn()}
      onEditNotes={onEditNotes}
      isCompleting={null}
    />
  )

  fireEvent.doubleClick(screen.getByText('Task with notes'))
  act(() => vi.advanceTimersByTime(220))

  expect(onEditNotes).toHaveBeenCalledWith(todo)
  expect(container.querySelector('.todo-item')).not.toHaveClass('is-notes-pinned')
  vi.useRealTimers()
})

test('action buttons do not accidentally open the notes card', () => {
  const onDelete = vi.fn()
  const { container } = render(
    <TodoItem
      todo={todo}
      onToggle={vi.fn()}
      onDelete={onDelete}
      onEditNotes={vi.fn()}
      isCompleting={null}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: /Delete/ }))

  expect(onDelete).toHaveBeenCalledWith(todo.id)
  expect(container.querySelector('.todo-item')).not.toHaveClass('is-notes-pinned')
})
