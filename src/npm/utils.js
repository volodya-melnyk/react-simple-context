export const createSetters = (_setters, setState) => {
  const setters = {}
  for (const key in _setters) {
    setters[key] = (...args) => {
      setState((state) => {
        const newState = _setters[key](state, ...args)
        return {
          ...state,
          ...newState
        }
      })
    }
  }
  return setters
}

export const createGetters = (_getters, state) => {
  const getters = {}
  for (const key in _getters) {
    getters[key] = (...args) => _getters[key](state, ...args)
  }
  for (const key in _getters) {
    getters[key] = (...args) => _getters[key]({ ...state, getters }, ...args)
  }
  return getters
}

export const createActions = (_actions, setters) => {
  const actions = {}
  for (const key in _actions) {
    actions[key] = (...args) => _actions[key](setters, ...args)
  }
  return actions
}

export const unpackModule = (module) => {
  const obj = {}
  for (const key in module) {
    for (const _key in module[key]) {
      obj[_key] = module[key][_key]
    }
  }
  return obj
}
