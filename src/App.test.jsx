import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'

const makeTodo = (overrides = {}) => ({
  id: crypto.randomUUID(),
  text: 'Test task',
  completed: false,
  priority: 'blue',
  notes: '',
  date: '2026-09-04',
  time: '14:00',
  attachments: [],
  ...overrides,
})

const getSection = (name) =>
  screen.getByRole('heading', { name }).closest('section')

describe('smart task groups', () => {
  const now = new Date(2026, 8, 4, 13, 0)

  test('renders tasks in their calculated sections and keeps tasks without dates visible', () => {
    vi.setSystemTime(now)
    localStorage.setItem('todos', JSON.stringify([
      makeTodo({ id: 1, text: 'Past task', time: '12:00' }),
      makeTodo({ id: 2, text: 'Today task', time: '14:00' }),
      makeTodo({ id: 3, text: 'Future task', date: '2026-09-05' }),
      makeTodo({ id: 4, text: 'Finished task', completed: true }),
      makeTodo({ id: 5, text: 'Old task without date', date: '', time: '' }),
    ]))

    render(<App />)

    expect(within(getSection(/OVERDUE \(1\)/)).getByText('Past task')).toBeInTheDocument()
    expect(within(getSection(/TODAY \(1\)/)).getByText('Today task')).toBeInTheDocument()
    const upcomingSection = getSection(/UPCOMING \(2\)/)
    expect(within(upcomingSection).getByText('Future task')).toBeInTheDocument()
    expect(within(upcomingSection).getByText('Old task without date')).toBeInTheDocument()
    expect(within(getSection(/COMPLETED \(1\)/)).getByText('Finished task')).toBeInTheDocument()
  })
})

describe('todo regressions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 4, 13, 0))
    localStorage.setItem('todos', JSON.stringify([
      makeTodo({ id: 1, text: 'First task' }),
      makeTodo({ id: 2, text: 'Second task' }),
    ]))
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  test('completion animation runs only on the selected task', () => {
    render(<App />)
    const firstCheckbox = screen.getByRole('checkbox', { name: 'Mark First task as completed' })
    const secondCheckbox = screen.getByRole('checkbox', { name: 'Mark Second task as completed' })

    fireEvent.click(firstCheckbox)

    expect(firstCheckbox.closest('.checkbox-wrapper-18')).toHaveClass('is-completing')
    expect(secondCheckbox.closest('.checkbox-wrapper-18')).not.toHaveClass('is-completing')
    expect(firstCheckbox).toBeChecked()
    expect(secondCheckbox).not.toBeChecked()
  })

  test('moves only the selected task to completed after its animation', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark First task as completed' }))

    act(() => vi.advanceTimersByTime(1000))

    const completedSection = getSection(/COMPLETED \(1\)/)
    const todaySection = getSection(/TODAY \(1\)/)
    expect(within(completedSection).getByText('First task')).toBeInTheDocument()
    expect(within(todaySection).getByText('Second task')).toBeInTheDocument()
  })

  test('persists the changed task state in local storage', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark First task as completed' }))
    act(() => vi.advanceTimersByTime(1000))

    const savedTodos = JSON.parse(localStorage.getItem('todos'))
    expect(savedTodos.find((todo) => todo.id === 1).completed).toBe(true)
    expect(savedTodos.find((todo) => todo.id === 2).completed).toBe(false)
  })
})
