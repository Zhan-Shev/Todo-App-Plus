import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import TimePicker from './TimePicker'

test('clicking outside the time dialog works like Cancel', () => {
  const onChange = vi.fn()
  const { container } = render(<TimePicker value="14:00" onChange={onChange} />)

  fireEvent.click(screen.getByRole('button', { name: '14:00' }))
  const overlay = container.querySelector('.time-picker-overlay')
  fireEvent.mouseDown(overlay)

  expect(screen.queryByRole('dialog', { name: 'Set time' })).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
})
