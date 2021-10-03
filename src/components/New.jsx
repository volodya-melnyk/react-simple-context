import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useSimpleContext } from '../context'

export const New = () => {
  const { setters } = useSimpleContext()
  const [text, setText] = useState('')

  const changeText = ({ target: { value } }) => {
    const trimmed = value.replace(/\s{2,}/g, ' ').trim()
    setText(trimmed)
  }

  const addTodo = (e) => {
    e.preventDefault()

    if (!text) return

    const newTodo = {
      id: nanoid(5),
      text,
      done: false,
      edit: false
    }

    setters.addTodo(newTodo)

    setText('')
  }

  return (
    <form onSubmit={addTodo} className='d-flex mb-4'>
      <input
        type='text'
        placeholder='What needs to be done?'
        value={text}
        onChange={changeText}
        className='form-control flex-grow-1'
      />
      <button className='btn btn-outline-success'>
        <i className='bi bi-plus-square'></i>
      </button>
    </form>
  )
}
