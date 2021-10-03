import { useSimpleContext } from '../context'

export const Filters = () => {
  const { setters, getters } = useSimpleContext()
  const filter = getters.getFilter()

  return (
    <div className='col-3'>
      <h3>Filters</h3>
      {['all', 'active', 'completed'].map((_filter) => (
        <div key={_filter} className='form-check' style={{ textAlign: 'left' }}>
          <input
            id={_filter}
            type='radio'
            checked={_filter === filter}
            onChange={() => setters.setFilter(_filter)}
            className='form-check-input'
          />
          <label htmlFor={_filter} className='form-check-label'>
            {_filter.toUpperCase()}
          </label>
        </div>
      ))}
    </div>
  )
}
