import { useSimpleContext } from '../context'

export const Controls = () => {
  const { simpleState, setters, actions } = useSimpleContext()
  const { todos } = simpleState

  return (
    <div className='col-3 d-flex flex-column'>
      <h3>Controls</h3>
      {todos.length ? (
        <>
          <button
            onClick={() => setters.completeTodos()}
            className='btn btn-info mb-2'
          >
            Complete
          </button>
          <button
            onClick={() => setters.clearCompleted()}
            className='btn btn-danger mb-2'
          >
            Clear
          </button>
        </>
      ) : null}
      <button
        onClick={() => actions.saveTodos(todos)}
        className='btn btn-success'
      >
        Save
      </button>
    </div>
  )
}
