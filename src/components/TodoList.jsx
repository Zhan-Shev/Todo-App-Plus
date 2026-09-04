import TodoItem from './TodoItem'

function TodoList({ title, todos, onToggle, onDelete, onEditNotes, isCompleting }) {
  const sectionClass = title.startsWith('COMPLETED') ? 'todo-section todo-section-done' : 'todo-section'

  if (todos.length === 0) {
    return (
      <section className={sectionClass}>
        <h3 className="todo-section-title">{title}</h3>
        <p className="todo-section-empty">No tasks</p>
      </section>
    )
  }

  return (
    <section className={sectionClass}>
      <h3 className="todo-section-title">{title}</h3>
      <ul className="todo-items-list">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEditNotes={onEditNotes}
            isCompleting={isCompleting}
          />
        ))}
      </ul>
    </section>
  )
}

export default TodoList
