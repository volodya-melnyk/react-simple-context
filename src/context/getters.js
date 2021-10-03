export const appGetters = {
  getStatus: ({ status }) => status,
  getMessage: ({ message }) => message
}

export const todoGetters = {
  getAllTodos: ({ todos }) => todos,
  getTodoById: ({ todos }, id) => todos.find((todo) => todo.id === id),
  getTotalTodos: ({ todos }) => todos.length,
  getActiveTodos: ({ todos }) => todos.filter((todo) => !todo.done),
  getCompletedTodos: ({ todos }) => todos.filter((todo) => todo.done),
  getFilter: ({ filter }) => filter,
  getFilteredTodos: ({ todos, getters }) => {
    const filter = getters.getFilter()
    if (filter === 'all') return todos
    return filter === 'active'
      ? getters.getActiveTodos()
      : getters.getCompletedTodos()
  },
  getTodoStats: ({ getters }) => {
    const total = getters.getTotalTodos()

    const completed = getters.getCompletedTodos().length
    const active = getters.getActiveTodos().length

    const percent = total === 0 ? 0 : Math.round((active / total) * 100)

    return {
      total,
      completed,
      active,
      percent
    }
  }
}

export const filterGetters = {
  getFilter: ({ filter }) => filter
}
