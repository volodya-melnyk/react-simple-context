import { useState, useEffect, useRef } from 'react'
import { useSimpleContext } from 'context'

export default function Edit({ todo }) {
  const inputRef = useRef()
  const { setters } = useSimpleContext()

  const { id, text, edit } = todo
  const [newText, setNewText] = useState(text)

  useEffect(() => {
    if (inputRef.current && edit) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [edit])

  const changeText = ({ target: { value } }) => {
    const trimmed = value.replace(/\s{2,}/g, ' ').trim()
    setNewText(trimmed)
  }
  const finishEdit = () => {
    if (!newText) {
      return setters.removeTodo(id)
    }
    setters.updateTodo({ id, changes: { text: newText, edit: !edit } })
  }
  const cancelEdit = () => {
    setters.updateTodo({ id, changes: { edit: !edit } })
  }

  return (
    <li className='list-group-item d-flex align-items-center'>
      <input
        ref={inputRef}
        type='text'
        value={newText}
        onChange={changeText}
        className='form-control flex-grow-1'
      />
      <button onClick={finishEdit} className='btn btn-outline-success'>
        <i className='bi bi-check'></i>
      </button>
      <button onClick={cancelEdit} className='btn btn-outline-warning'>
        <i className='bi bi-x-square'></i>
      </button>
    </li>
  )
}
