import { useEffect } from 'react'
import { New, Filters, List, Controls, Stats, Loader } from './components'
import { useSimpleContext } from './context'

export default function App() {
  const { getters, actions } = useSimpleContext()
  const todos = getters.getAllTodos()
  const status = getters.getStatus()
  const message = getters.getMessage()

  useEffect(() => {
    actions.fetchTodos()
    // eslint-disable-next-line
  }, [])

  return (
    <div
      className='container d-flex flex-column text-center mt-2 mb-2'
      style={{ maxWidth: '600px' }}
    >
      <h1 className='mb-4'>React Simple Context</h1>
      <New />
      {message.text ? (
        <div
          className={`alert ${
            message.type === 'success' ? 'alert-success' : 'alert-danger'
          } position-fixed top-50 start-50 translate-middle`}
          role='alert'
          style={{ zIndex: 1 }}
        >
          {message.text}
        </div>
      ) : null}
      {status === 'loading' ? (
        <Loader />
      ) : todos.length ? (
        <>
          <Stats />
          <div className='row'>
            <Filters />
            <List />
            <Controls />
          </div>
        </>
      ) : (
        <div className='d-flex justify-content-end'>
          <Controls />
        </div>
      )}
    </div>
  )
}
