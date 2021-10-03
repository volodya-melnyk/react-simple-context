import createSimpleContext, { unpackModule } from '../npm'

import * as setters from './setters'
import * as getters from './getters'
import * as actions from './actions'

const store = {
  state: {
    todos: [],
    status: 'idle',
    filter: 'all',
    message: {}
  },
  setters: unpackModule(setters),
  getters: unpackModule(getters),
  actions: unpackModule(actions)
}

export const [SimpleProvider, useSimpleContext] = createSimpleContext(store)
