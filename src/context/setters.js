export const appSetters = {
  setStatus: (_, status) => ({ status }),
  setMessage: (_, message) => ({ message })
}

export const todoSetters = {
  setTodos: (_, newTodos) => ({ todos: newTodos }),
  addTodo: ({ todos }, newTodo) => ({ todos: todos.concat(newTodo) }),
  updateTodo: ({ todos }, { id, changes }) => ({
    todos: todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            ...changes
          }
        : todo
    )
  }),
  removeTodo: ({ todos }, todoId) => {
    return {
      todos: todos.filter((todo) => todo.id !== todoId)
    }
  },
  completeTodos: ({ todos }) => ({
    todos: todos.map((todo) => ({ ...todo, done: true }))
  }),
  clearCompleted: ({ todos }) => ({ todos: todos.filter((todo) => !todo.done) })
}

export const filterSetters = {
  setFilter: (_, filter) => ({ filter })
}
