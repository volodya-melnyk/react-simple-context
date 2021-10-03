import { useSimpleContext } from '../context'

export const Stats = () => {
  const { getters } = useSimpleContext()
  const stats = getters.getTodoStats()

  return (
    <div className='row'>
      <h3>Statistics</h3>
      <table className='table text-center'>
        <thead>
          <tr>
            {Object.keys(stats).map(([first, ...rest], index) => (
              <th scope='col' key={index}>
                {`${first.toUpperCase()}${rest.join('').toLowerCase()}`}
              </th>
            ))}
          </tr>
          <tr>
            {Object.values(stats).map((value, index) => (
              <td key={index}>{value}</td>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  )
}
