import { useSimpleContext } from '../../context'

export default function Regular({ todo }) {
  const { setters } = useSimpleContext()
  const { id, text, done, edit } = todo

  return (
    <li className='list-group-item d-flex align-items-center'>
      <input
        type='checkbox'
        checked={done}
        onChange={() => setters.updateTodo({ id, changes: { done: !done } })}
        className='form-check-input'
      />
      <p
        className={`flex-grow-1 m-0 ${
          done ? 'text-muted text-decoration-line-through' : ''
        }`}
      >
        {text}
      </p>
      <button
        onClick={() => setters.updateTodo({ id, changes: { edit: !edit } })}
        className='btn btn-outline-info'
        disabled={done}
      >
        <i className='bi bi-pencil'></i>
      </button>
      <button
        onClick={() => setters.removeTodo(id)}
        className='btn btn-outline-danger'
      >
        <i className='bi bi-trash'></i>
      </button>
    </li>
  )
}
