import { createContext, useContext, useState, useMemo } from 'react'
import {
  createSetters,
  createGetters,
  createActions,
  unpackModule
} from './utils'

export default function createSimpleContext(store) {
  const SimpleContext = createContext()

  const SimpleProvider = ({ children }) => {
    const [simpleState, setSimpleState] = useState(store.state)

    const setters = useMemo(
      () => createSetters(store.setters, setSimpleState),
      // eslint-disable-next-line
      []
    )
    const actions = useMemo(
      () => createActions(store.actions, setters),
      // eslint-disable-next-line
      []
    )
    const getters = createGetters(store.getters, simpleState)

    return (
      <SimpleContext.Provider
        value={{
          simpleState,
          setSimpleState,
          setters,
          getters,
          actions
        }}
      >
        {children}
      </SimpleContext.Provider>
    )
  }

  const useSimpleContext = () => useContext(SimpleContext)

  return [SimpleProvider, useSimpleContext]
}

export { unpackModule }
