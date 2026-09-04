import { useState, useEffect, useLayoutEffect } from 'react'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import TaskEditor from './components/TaskEditor'
import FilterButtons from './components/FilterButtons'
import SearchBar from './components/SearchBar'
import Fuse from 'fuse.js'

const getTodoDeadline = (todo) => {
  if (!todo.date) return null

  const time = /^\d{2}:\d{2}$/.test(todo.time || '') ? todo.time : '23:59'
  const deadline = new Date(`${todo.date}T${time}:00`)
  return Number.isNaN(deadline.getTime()) ? null : deadline
}

const getTodoGroup = (todo, now = new Date()) => {
  if (todo.completed) return 'completed'

  const deadline = getTodoDeadline(todo)
  if (!deadline) return 'upcoming'

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  if (deadline < now) return 'overdue'
  if (deadline < tomorrowStart) return 'today'
  return 'upcoming'
}


function App() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('todo-theme') === 'dark' ? 'dark' : 'light'
  )

  // Загружаем задачи из localStorage при старте
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })

  const [filter, setFilter] = useState('all') // all | active | completed
  const [search, setSearch] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Сохраняем задачи в localStorage при каждом изменении
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    localStorage.setItem('todo-theme', theme)
  }, [theme])

  // Добавить задачу
  const addTodo = (text) => {
    if (!text.trim()) return
    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      priority: 'blue',
      notes: '',
      date: '',
      time: '',
      attachments: [],
    }
    setTodos([newTodo, ...todos])
  }

  const createTodo = (task) => {
    setTodos((currentTodos) => [
      {
        id: Date.now(),
        completed: false,
        ...task,
      },
      ...currentTodos,
    ])
    setIsEditorOpen(false)
  }

  // Переключить выполненность
  // const toggleTodo = (id) => {
  //   setTodos(
  //     todos.map((todo) =>
  //       todo.id === id ? { ...todo, completed: !todo.completed } : todo
  //     )
  //   )
  // }
const [completingTodo, setCompletingTodo] = useState(null)
  const toggleTodo = (id) => {
  const todo = todos.find((todo) => todo.id === id)

  if (!todo) return

  if (!todo.completed) {
    setCompletingTodo(id)

    setTimeout(() => {
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === id
            ? { ...todo, completed: true }
            : todo
        )
      )

      setCompletingTodo(null)
    }, 1000)
  } else {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: false }
          : todo
      )
    )
  }
}



  // Удалить задачу
  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  // Очистить выполненные
  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed))
  }

  // Фильтр по статусу, затем нечёткий поиск по тексту задачи
  const statusFilteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const fuse = new Fuse(statusFilteredTodos, {
    keys: ['text'],
    threshold: 0.35,
    ignoreLocation: true,
  })

  const filteredTodos = search.trim()
    ? fuse.search(search.trim()).map((result) => result.item)
    : statusFilteredTodos

  const groupedTodos = filteredTodos.reduce(
    (groups, todo) => {
      groups[getTodoGroup(todo)].push(todo)
      return groups
    },
    { overdue: [], today: [], upcoming: [], completed: [] }
  )

  const activeCount = todos.filter((t) => !t.completed).length

  const [editingTodo, setEditingTodo] = useState(null)

  const saveTodo = (id, updates) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, ...updates } : todo
    ))
    setEditingTodo(null)
  }

  return (
    <div className="app-background min-h-screen">
      <div className="app-background-visual" aria-hidden="true" />
      <div className="content-panel">
        <div className="app-layout">
          <aside className="app-sidebar">
            <h1 className="app-title" aria-label="Todo App">
              <span aria-hidden="true">Todo A</span>
              <svg
                className="app-title-plus"
                viewBox="0 0 36 36"
                aria-hidden="true"
                focusable="false"
              >
                <defs>
                  <linearGradient id="app-title-plus-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff3d77" />
                    <stop offset="25%" stopColor="#ffb627" />
                    <stop offset="50%" stopColor="#45e0a8" />
                    <stop offset="75%" stopColor="#4da3ff" />
                    <stop offset="100%" stopColor="#b85cff" />
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      from="0 .5 .5"
                      to="360 .5 .5"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M14 3h8v11h11v8H22v11h-8V22H3v-8h11V3Z"
                  fill="#f97316"
                  stroke="url(#app-title-plus-gradient)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span aria-hidden="true">pp</span>
            </h1>

            <div className="sidebar-section">
              <TodoForm
                onAdd={addTodo}
                isOpen={false}
                onOpen={() => setIsEditorOpen(true)}
              />
            </div>

            <div className="sidebar-section">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            <div className="sidebar-section">
              <p className="sidebar-label">View</p>
              <FilterButtons current={filter} onChange={setFilter} />
            </div>

<div className="demo">
        <label className="toggle">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
              aria-label="Toggle dark theme"
            />
            <span className="track">
                <span className="knob"></span>
            </span>
            <span className="label">
                <span className="icon"></span>
                <span className="off">Light</span>
                <span className="on">Dark</span>
            </span>
        </label>

    </div>

          </aside>

          <main className="app-main">
            {isEditorOpen ? (
              <TaskEditor
                onCreate={createTodo}
                onClose={() => setIsEditorOpen(false)}
                title="Add a task"
              />
            ) : (
              <>
                <div className="main-heading">
                  <div>
                    <p className="eyebrow">Your workspace</p>
                    <h2>Tasks</h2>
                  </div>
                  <span className="task-total">{todos.length} total</span>
                </div>

                <div className="todo-sections">
                  <TodoList
                    title={`OVERDUE (${groupedTodos.overdue.length})`}
                    todos={groupedTodos.overdue}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEditNotes={setEditingTodo}
                     isCompleting={completingTodo}
                  />
                  <TodoList
                    title={`TODAY (${groupedTodos.today.length})`}
                    todos={groupedTodos.today}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEditNotes={setEditingTodo}
                     isCompleting={completingTodo}
                  />
                  <TodoList
                    title={`UPCOMING (${groupedTodos.upcoming.length})`}
                    todos={groupedTodos.upcoming}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEditNotes={setEditingTodo}
                     isCompleting={completingTodo}
                  />
                  <TodoList
                    title={`COMPLETED (${groupedTodos.completed.length})`}
                    todos={groupedTodos.completed}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onEditNotes={setEditingTodo}
                     isCompleting={completingTodo}
                  />
                </div>

                <div className="task-footer">
                  <span>{activeCount} active tasks</span>
                  <button
                    type="button"
                    onClick={clearCompleted}
                    className="clear-button"
                  >
                    Clear completed
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
      {editingTodo && (
        <TaskEditor
          todo={editingTodo}
          onSave={saveTodo}
          onClose={() => setEditingTodo(null)}
        />
      )}
    </div>
  )
}

export default App
