import axios from 'axios'
axios.defaults.baseURL = 'http://localhost:5000/todos'

const sleep = (ms) =>
  new Promise((resolve) => {
    const timerId = setTimeout(() => {
      resolve()
      clearTimeout(timerId)
    }, ms)
  })

export const todoActions = {
  async fetchTodos({ setStatus, setTodos, setMessage }) {
    setStatus('loading')

    try {
      const { data } = await axios()
      setTodos(data)
      setMessage({
        type: 'success',
        text: 'Todos received'
      })
    } catch (err) {
      console.error(err.toJSON())
      setMessage({
        type: 'error',
        text: 'Something went wrong'
      })
    } finally {
      setStatus('idle')
      await sleep(1000)
      setMessage({})
    }
  },
  async saveTodos({ setStatus, setMessage }, newTodos) {
    setStatus('loading')

    try {
      const { data: existingTodos } = await axios()

      for (const todo of existingTodos) {
        const commonTodo = newTodos.find((_todo) => _todo.id === todo.id)

        if (commonTodo) {
          if (
            !Object.entries(commonTodo).every(
              ([key, value]) => value === todo[key]
            )
          ) {
            await axios.put(todo.id, commonTodo)
          }
        } else {
          await axios.delete(todo.id)
        }
      }

      for (const todo of newTodos) {
        if (!existingTodos.find((_todo) => _todo.id === todo.id)) {
          await axios.post('/', todo)
        }
      }
      console.log('ok')

      setMessage({ type: 'success', text: 'Todos saved' })
    } catch (err) {
      console.error(err)
      setMessage({
        type: 'error',
        text: 'Something went wrong'
      })
    } finally {
      setStatus('idle')
      await sleep(1000)
      setMessage({})
    }
  }
}
