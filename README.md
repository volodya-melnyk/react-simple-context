# React: простое и эффективное решение для управления состоянием приложений :metal:

Привет, друзья!

В этом небольшом "туториале" я хочу показать вам, как реализовать простое, но эффективное решение для управления состоянием `React-приложений`.

Немного забегая вперед, скажу, что решение получилось чуть менее производительным, чем "классическое" сочетание хука `useReducer()` и инструментов, предоставляемых `Context API` (которые, собственно, и составляют ядро решения).

Решение представляет собой результат нескольких экспериментов, направленных на максимальное упрощение работы с контекстом `React`, и во многом вдохновлено [`Vuex`](https://vuex.vuejs.org/ru/guide/) - официальным инструментом для управления состоянием `Vue-приложений`.

Решение не является законченным и находится в стадии активной разработки.

Пока мне не представилось возможности испытать решение в "полевых условиях" (я намерен сделать это при первом удобном случае), но кажется, что оно подойдет для разработки приложений любой сложности при соблюдении двух важных условий:

1. В хранилище (`store`) должно храниться только глобальное состояние. Я не буду утомлять вас рассуждениями на тему "Что такое состояние приложения? Какое состояние является локальным, а какое глобальным?" и т.д. Лично я исхожу из предположения, что любое состояние является локальным, пока не доказано обратное, т.е. пока не возникнет необходимости в его распределении между автономными компонентами.
2. Провайдер контекста должен размещаться максимально близко к компонентам, потребляющим контекст. Это называется коллокацией (collocation) или размещением совместного состояния. Логика принятия решения о том, каким является состояние и где его размещать выглядит примерно так:

<img src="https://habrastorage.org/webt/gz/_o/yx/gz_oyx9xhm_7wvpydh1uk1wc3wy.jpeg" />

Поиграть с кодом приложения можно [здесь](https://codesandbox.io/s/react-simple-context-f1gzk).

_Обратите внимание_: статья рассчитана на разработчиков, который имеют некоторый опыт работы с `React`, уставших от `Redux` и иже с ним 😃

## Результат

Давайте начнем с того, что мы хотим получить на выходе. И почему не воспользоваться готовыми решениями? Другими словами, зачем нам изобретать велосипед, когда, казалось бы, все давно придумано умными людьми?

Объясню простыми... кодом. Предположим, что мы хотим разработать "тудушку" со следующим функционалом:

- получение задач от сервера — асинхронная операция;
- добавление в список новой задачи — синхронная;
- обновление задачи: ее текста, состояния завершенности и состояния редактирования — синхронные;
- удаление задачи из списка — синхронная;
- фильтрация задач в списке: отображение всех, только завершенных или только активных задач — синхронная;
- завершение всех активных задач - синхронная;
- удаление всех завершенных задач - синхронная;
- сохранение задач на сервере (в базе данных) - асинхронная;
- отображение статистики: общее количество, количество завершенных и количество активных задач, а также процент активных задач — синхронная;
- получение сообщений: о загрузке задач с сервера, сохранении задач в БД или возникшей ошибке — асинхронная.

Если реализовать этот функционал, следуя всем канонам современного [`Redux`](https://redux.js.org/) в лице [`Redux Toolkit`](https://redux-toolkit.js.org/), то код хранилища получится следующим:

```javascript
import {
 configureStore,
 createAsyncThunk,
 createEntityAdapter,
 createSelector,
 createSlice
} from '@reduxjs/toolkit'
// Утилита для выполнения HTTP-запросов
import axios from 'axios'

// Адрес сервера
const SERVER_URL = 'http://localhost:5000/todos'

// Так называемый адаптер сущностей (entity adapter) (для задач)
const todoAdapter = createEntityAdapter()

// Начальное состояние (для задач)
const initialTodoState = todoAdapter.getInitialState({
 // статус приложения
 status: 'idle',
 // статус сообщения
 message: {}
})

// Так называемый преобразователь (thunk) -
// асинхронная операция для получения задач от сервера
export const fetchTodos = createAsyncThunk('todos/fetchTodos', async () => {
 try {
   // получаем данные
   const { data: todos } = await axios(SERVER_URL)
   // возвращаем задачи и сообщение об успехе
   return {
     todos,
     message: { type: 'success', text: 'Todos loaded' }
   }
 } catch (err) {
   console.error(err.toJSON())
   // возвращаем сообщение об ошибке
   return {
     message: { type: 'error', text: 'Something went wrong' }
   }
 }
})

// Асинхронная операция для сохранения задач в БД
export const saveTodos = createAsyncThunk(
 'todos/saveTodos',
 async (newTodos) => {
   try {
     // получаем существующие задачи
     const { data: existingTodos } = await axios(SERVER_URL)

     // перебираем их
     for (const todo of existingTodos) {
       // формируем `URL` текущей задачи
       const todoUrl = `${SERVER_URL}/${todo.id}`

       // определяем, имеется ли существующая задача среди новых
       const commonTodo = newTodos.find((_todo) => _todo.id === todo.id)

       // если имеется
       if (commonTodo) {
         // определяем наличие изменений
         if (
           !Object.entries(commonTodo).every(
             ([key, value]) => value === todo[key]
           )
         ) {
           // если изменения есть, обновляем задачу на сервере,
           await axios.put(todoUrl, commonTodo)
         }
       } else {
         // если не имеется
         // удаляем задачу на сервере
         await axios.delete(todoUrl)
       }
     }

     // теперь перебираем новые задачи и сравниваем их с существующими
     for (const todo of newTodos) {
       // если новой задачи нет среди существующих
       // значит, она действительно новая
       if (!existingTodos.find((_todo) => _todo.id === todo.id)) {
         // сохраняем ее в БД
         await axios.post(SERVER_URL, todo)
       }
     }
     // возвращаем сообщение об успехе
     return { type: 'success', text: 'Todos saved' }
   } catch (err) {
     console.error(err.toJSON())
     // возвращаем сообщение об ошибке
     return {
       type: 'error',
       text: 'Something went wrong'
     }
   }
 }
)

// Асинхронная операция для выполнения искусственной задержки -
// она нужна для отображения сообщения в течение указанного времени
export const giveMeSomeTime = createAsyncThunk(
 'todos/giveMeSomeTime',
 async (ms) =>
   await new Promise((resolve) => {
     const timerId = setTimeout(() => {
       resolve()
       clearTimeout(timerId)
     }, ms)
   })
)

// Так называемая часть или срез состояния (для задач)
const todoSlice = createSlice({
 // название
 name: 'todos',
 // начальное состояние в виде нормализованной структуры
 initialState: initialTodoState,
 // обычные редукторы
 reducers: {
   // для добавления задачи
   addTodo: todoAdapter.addOne,
   // для обновления задачи
   updateTodo: todoAdapter.updateOne,
   // для удаления задачи
   removeTodo: todoAdapter.removeOne,
   // для завершения всех активных задач
   completeAllTodos(state) {
     Object.values(state.entities).forEach((todo) => {
       todo.done = true
     })
   },
   // для удаления всех завершенных задач
   clearCompletedTodos(state) {
     const completedTodoIds = Object.values(state.entities)
       .filter((todo) => todo.done)
       .map((todo) => todo.id)
     todoAdapter.removeMany(state, completedTodoIds)
   }
 },
 // дополнительные редукторы для обработки результатов асинхронных операций
 extraReducers: (builder) => {
   builder
     // запрос на получение задач от сервера находится в процессе выполнения
     .addCase(fetchTodos.pending, (state) => {
       // обновляем индикатор загрузки
       state.status = 'loading'
     })
     // запрос выполнен
     .addCase(fetchTodos.fulfilled, (state, { payload }) => {
       if (payload.todos) {
         // обновляем состояние задач
         todoAdapter.setAll(state, payload.todos)
       }
       // записываем сообщение
       state.message = payload.message
       // обновляем индикатор загрузки
       state.status = 'idle'
     })
     // запрос на сохранение задач в БД находится в процессе выполнения
     .addCase(saveTodos.pending, (state) => {
       // обновляем индикатор загрузки
       state.status = 'loading'
     })
     // запрос выполнен
     .addCase(saveTodos.fulfilled, (state, { payload }) => {
       // записываем сообщение
       state.message = payload
       // обновляем индикатор загрузки
       state.status = 'idle'
     })
     // запрос на выполнение задержки выполнен
     .addCase(giveMeSomeTime.fulfilled, (state) => {
       // очищаем сообщение
       state.message = {}
     })
 }
})

// Операции для работы с задачами
export const {
 addTodo,
 updateTodo,
 removeTodo,
 completeAllTodos,
 clearCompletedTodos
} = todoSlice.actions

// Начальное состояние (для фильтра)
const initialFilterState = {
 status: 'all'
}

// Часть состояния (для фильтра)
const filterSlice = createSlice({
 // название
 name: 'filter',
 // начальное состояние
 initialState: initialFilterState,
 // обычные редукторы
 reducers: {
   // для установки значения фильтра
   setFilter(state, action) {
     state.status = action.payload
   }
 }
})

// Операция для установки значения фильтра
export const { setFilter } = filterSlice.actions

// Так называемые селекторы для выборки всех задач и их общего количества
export const { selectAll, selectTotal } = todoAdapter.getSelectors(
 (state) => state.todos
)

// Селектор для выборки задач на основе текущего состояния фильтра
export const selectFilteredTodos = createSelector(
 selectAll,
 (state) => state.filter,
 (todos, filter) => {
   const { status } = filter
   if (status === 'all') return todos
   return status === 'active'
     ? todos.filter((todo) => !todo.done)
     : todos.filter((todo) => todo.done)
 }
)

// Селектор для выборки статистики
export const selectTodoStats = createSelector(
 selectAll,
 selectTotal,
 (todos, total) => {
   const completed = todos.filter((todo) => todo.done).length
   const active = total - completed
   const percent = total === 0 ? 0 : Math.round((active / total) * 100)

   return {
     total,
     completed,
     active,
     percent
   }
 }
)

// Хранилище
export const store = configureStore({
 reducer: {
   todos: todoSlice.reducer,
   filter: filterSlice.reducer
 }
})
```

Много кода, но мало смысла. И это - продвинутый `Redux`!

Если переписать функционал тудушки, используя сочетание `useReducer()` и `Context API` (а также парочки "хаков"), код получится примерно таким:

```javascript
import { createContext, useContext, useReducer, useMemo } from 'react'
import axios from 'axios'

const SERVER_URL = 'http://localhost:5000/todos'

// Константы
const SET_TODOS = 'SET_TODOS'
const SET_STATUS = 'SET_STATUS'
const ADD_TODO = 'ADD_TODO'
const UPDATE_TODO = 'UPDATE_TODO'
const REMOVE_TODO = 'REMOVE_TODO'
const COMPLETE_TODOS = 'COMPLETE_TODOS'
const CLEAR_COMPLETED = 'CLEAR_COMPLETED'
const SET_FILTER = 'SET_FILTER'
const SET_MESSAGE = 'SET_MESSAGE'

// Редуктор
const reducer = (state, { type, payload }) => {
 switch (type) {
   case SET_TODOS:
     return {
       ...state,
       todos: payload
     }
   case SET_STATUS:
     return {
       ...state,
       status: payload
     }
   case ADD_TODO:
     return { ...state, todos: state.todos.concat(payload) }
   case UPDATE_TODO:
     return {
       ...state,
       todos: state.todos.map((todo) =>
         todo.id === payload.id ? { ...todo, ...payload.changes } : todo
       )
     }
   case REMOVE_TODO:
     return {
       ...state,
       todos: state.todos.filter((todo) => todo.id !== payload)
     }
   case COMPLETE_TODOS:
     return { ...state, todos: state.todos.map((todo) => todo.done === true) }
   case CLEAR_COMPLETED:
     return {
       ...state,
       todos: state.todos.filter((todo) => todo.done === true)
     }
   case SET_FILTER:
     return {
       ...state,
       filter: payload
     }
   case SET_MESSAGE:
     return {
       ...state,
       message: payload
     }
   default:
     return state
 }
}

// Задержка
const giveMeSomeTime = async () =>
 await new Promise((resolve) => {
   const timerId = setTimeout(() => {
     resolve()
     clearTimeout(timerId)
   }, 2000)
 })

// Так называемый создатель операций (хак номер раз)
const createActions = (dispatch) => ({
 setTodos: (todos) => ({
   type: SET_TODOS,
   payload: todos
 }),
 setStatus: (status) => ({
   type: SET_STATUS,
   payload: status
 }),
 addTodo: (todo) => ({
   type: ADD_TODO,
   payload: todo
 }),
 updateTodo: (payload) => ({
   type: UPDATE_TODO,
   payload
 }),
 removeTodo: (todoId) => ({
   type: REMOVE_TODO,
   payload: todoId
 }),
 completeTodos: () => ({
   type: COMPLETE_TODOS
 }),
 clearCompleted: () => ({
   type: COMPLETE_TODOS
 }),
 setFilter: (filter) => ({
   type: SET_FILTER,
   payload: filter
 }),
 setMessage: (message) => ({
   type: SET_MESSAGE,
   payload: message
 }),
 async fetchTodos() {
   dispatch(this.setStatus('loading'))

   try {
     const { data: todos } = await axios(SERVER_URL)

     dispatch(this.setTodos(todos))

     dispatch(
       this.setMessage({ type: 'success', text: 'Todos loaded' })
     )
   } catch (err) {
     console.error(err.toJSON())

     dispatch(
       this.setMessage({
         type: 'error',
         text: 'Something went wrong'
       })
     )
   } finally {
     dispatch(this.setStatus('idle'))

     await giveMeSomeTime()

     dispatch(this.setMessage({}))
   }
 },
 async saveTodos(newTodos) {
   dispatch(this.setStatus('loading'))

   try {
     const { data: existingTodos } = await axios(SERVER_URL)

     for (const todo of existingTodos) {
       const todoUrl = `${SERVER_URL}/${todo.id}`

       const commonTodo = newTodos.find((_todo) => _todo.id === todo.id)

       if (commonTodo) {
         if (
           !Object.entries(commonTodo).every(
             ([key, value]) => value === todo[key]
           )
         ) {
           await axios.put(todoUrl, commonTodo)
         }
       } else {
         await axios.delete(todoUrl)
       }
     }

     for (const todo of newTodos) {
       if (!existingTodos.find((_todo) => _todo.id === todo.id)) {
         await axios.post(SERVER_URL, todo)
       }
     }

     dispatch(
       this.setMessage({ type: 'success', text: 'Todos saved' })
     )
   } catch (err) {
     console.error(err.toJSON())

     dispatch(
       this.setMessage({
         type: 'error',
         text: 'Something went wrong'
       })
     )
   } finally {
     dispatch(this.setStatus('idle'))

     await giveMeSomeTime()

     dispatch(this.setMessage({}))
   }
 }
})

// Так называемый создатель селекторов (хак номер два)
const createSelectors = (state) => ({
 selectFilteredTodos() {
   const { todos, filter } = state
   if (filter === 'all') return todos
   return filter === 'active'
     ? todos.filter((todo) => !todo.done)
     : todos.filter((todo) => todo.done)
 },
 selectTodoStats() {
   const { todos } = state
   const { length } = todos

   const completed = todos.filter((todo) => todo.done).length
   const active = length - completed
   const percent = length === 0 ? 0 : Math.round((active / length) * 100)

   return {
     total: length,
     completed,
     active,
     percent
   }
 }
})

// Начальное состояние
const initialState = {
 todos: [],
 status: 'idle',
 filter: 'all',
 message: {}
}

// Контекcт
const Context = createContext()

// Провайдер контекста
export const Provider = ({ children }) => {
 const [state, dispatch] = useReducer(reducer, initialState)

 // Небольшая оптимизация, возможно, преждевременная
 // это зависит от размера и сложности приложения
 // и может быть определено только опытным путем
 const actions = useMemo(() => createActions(dispatch), [])
 const selectors = createSelectors(state)

 return (
   <Context.Provider value={{ state, dispatch, actions, selectors }}>
     {children}
   </Context.Provider>
 )
}

// Хук для потребления контекста
export const useAppContext = () => useContext(Context)
```

Намного лучше как с точки зрения читаемости кода, так и, что особенно важно, с точки зрения производительности. Но константы! В принципе, без них можно обойтись. Но редуктор! Кажется, что без редуктора обойтись нельзя. Или все-таки можно? Вполне. А что насчет диспетчера? Можно ли обойтись без него? Нет, без диспетчера обойтись не получится, потому что управлять состоянием `React-приложения` можно только через него. Но, как мы увидим дальше, его совсем не обязательно использовать в явном виде.

Если переписать функционал тудушки с помощью решения, которое мы еще не рассматривали, но скоро рассмотрим, то код хранилища получится следующим:

```javascript
import axios from 'axios'
axios.defaults.baseURL = 'http://localhost:5000/todos'

const sleep = (ms) =>
 new Promise((resolve) => {
   const timerId = setTimeout(() => {
     resolve()
     clearTimeout(timerId)
   }, ms)
 })

const store = {
 state: {
   todos: [],
   status: 'idle',
   filter: 'all',
   message: {}
 },
 setters: {
   setStatus: (_, status) => ({ status }),
   setMessage: (_, message) => ({ message }),
   setTodos: (_, newTodos) => ({ todos: newTodos }),
   addTodo: ({ todos }, newTodo) => ({ todos: todos.concat(newTodo) }),
   updateTodo: ({ todos }, { id, changes }) => ({
     todos: todos.map((todo) =>
       todo.id === id
         ? {
             ...todo,
             ...changes
           }
         : todo
     )
   }),
   removeTodo: ({ todos }, todoId) => {
     return {
       todos: todos.filter((todo) => todo.id !== todoId)
     }
   },
   completeTodos: ({ todos }) => ({
     todos: todos.map((todo) => ({ ...todo, done: true }))
   }),
   clearCompleted: ({ todos }) => ({ todos: todos.filter((todo) => !todo.done) }),
   setFilter: (_, filter) => ({ filter })
 },
 getters: {
   getFilteredTodos: ({ todos, filter }) => {
     if (filter === 'all') return todos
     return filter === 'active'
       ? todos.filter((todo) => !todo.done)
       : todos.filter((todo) => todo.done)
   },
   getTodoStats: ({ todos }) => {
     const { length } = todos

     const completed = todos.filter((todo) => todo.done).length
     const active = length - completed
     const percent = length === 0 ? 0 : Math.round((active / length) * 100)

     return {
       total: length,
       completed,
       active,
       percent
     }
 },
 actions: {
   async fetchTodos({ setStatus, setTodos, setMessage }) {
     setStatus('loading')

     try {
       const { data } = await axios()
       setTodos(data)
       setMessage({
         type: 'success',
         text: 'Todos received'
       })
     } catch (err) {
       console.error(err.toJSON())
       setMessage({
         type: 'error',
         text: 'Something went wrong'
       })
     } finally {
       setStatus('idle')
       await sleep(1000)
       setMessage({})
     }
   },
   async saveTodos({ setStatus, setMessage }, newTodos) {
     setStatus('loading')
     try {
       const { data: existingTodos } = await axios()

       for (const todo of existingTodos) {
         const commonTodo = newTodos.find((_todo) => _todo.id === todo.id)

         if (commonTodo) {
           if (
             !Object.entries(commonTodo).every(
               ([key, value]) => value === todo[key]
             )
           ) {
             await axios.put(todo.id, commonTodo)
           }
         } else {
           await axios.delete(todo.id)
         }
       }

       for (const todo of newTodos) {
         if (!existingTodos.find((_todo) => _todo.id === todo.id)) {
           await axios.post('/', todo)
         }
       }

       setMessage({ type: 'success', text: 'Todos saved' })
     } catch (err) {
       console.error(err.toJSON())
       setMessage({
         type: 'error',
         text: 'Something went wrong'
       })
     } finally {
       setStatus('idle')
       await sleep(1000)
       setMessage({})
     }
   }
 }
}
```

Если "разнести" сеттеры, геттеры и экшены по отдельным файлам, то код хранилища получится таким:

```javascript
import { unpackModule } from './context'
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
```

То, что доктор прописал. Теперь давайте обо всем по порядку.

## Концепция

Для хранения состояния и операций для работы с ним нам требуется некая гибкая и легко изменяемая структура. В `JavaScript` нет более подходящей структуры, чем объект. Назовем этот объект хранилищем - `store`.

Структура хранилища по возможности должна оставаться плоской, т.е. одноуровневой: это сильно упростит логику обновления состояния.

Далее, нам нужны операции для изменения состояния. Состояние может меняться синхронно и асинхронно, поэтому имеет смысл дифференцировать операции соответствующим образом. Назовем синхронные операции сеттерами (`setters`), а асинхронные - экшенами (`actions`).

Какую сигнатуру должны иметь сеттеры и экшены?

Очевидно, что сеттеры должны принимать какие-то параметры и иметь _прямой_ доступ к состоянию для его изменения. Возвращать сеттеры должны модифицированное состояние в виде части глобального состояния, т.е. объект с ключом, соответствующим определенной части глобального состояния. Я пока не нашел более простого способа для корректной идентификации части модифицируемого сеттером состояния. Схематично это можно представить следующим образом:

```javascript
setSomething: (state, args) => ({ stateSlice: newState })
// или
setSomething(state, args) {
 return {
   stateSlice: newState
 }
}
// мне больше нравится первый вариант
```

Или, когда сеттер не использует состояние:

```javascript
setSomething: (_, args) => ({ stateSlice: newState })
```

Или, когда название аргумента совпадает с названием части глобального состояния (ключом объекта состояния):

```javascript
setSomething: (_, arg) => ({ arg })
```

_Обратите внимание_:

- первым параметром, принимаемым сеттером, всегда является состояние
- сеттеру может передаваться любое количество аргументов
- сеттер всегда должен возвращать объект определенной формы (о которой говорилось выше)

Экшены также могут принимать любое количество параметров, но не имеют прямого доступа к состоянию. Доступ экшенов к состоянию опосредован сеттерами, т.е. экшены меняют состояние только через сеттеры. Экшены не должны ничего возвращать. Сигнатура:

```javascript
async fetchSomething(setters, args) {
 const result = await fetchSomething(args)
 setters.setSomething(result)
}
```

Наконец, нам нужны операции для извлечения части состояния или вычисления производных данных. Назовем эти операции геттерами - `getters`.

Геттеры могут принимать любое количество параметров и имеют _прямой_ доступ к состоянию. Поскольку цель геттеров - даже не столько извлечение части состояния (потому что мы можем делать это напрямую из состояния, содержащегося в контексте), сколько вычисление производных данных, имеет смысл передавать геттерам состояние в распакованном виде, т.е. в виде отдельных частей. Также, поскольку геттеры могут использоваться для производства сложных вычислений, имеет смысл передавать им другие геттеры (`DRY`). Возвращать геттеры должны часть состояния или производные данные. Сигнатура:

```javascript
getSomething: ({ stateSlice1, stateSlice2, ...stateSliceN, getters }) => stateSice | derivedData
```

_Обратите внимание_: геттеры не должны модифицировать состояние.

Теперь поговорим о том, как добиться правильной сигнатуры операций.

## Реализация

После определения, хранилище передается в функцию `createSimpleContext()`, которая возвращает массив с двумя элементами: провайдером контекста и хуком для его потребления:

```javascript
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
```

_Ремарка_: функция `unpackModule()` - это простая утилита для преобразования модуля в объект, которая выглядит так:

```javascript
export const unpackModule = (module) => {
 const obj = {}
 for (const key in module) {
   for (const _key in module[key]) {
     obj[_key] = module[key][_key]
   }
 }
 return obj
}
```

Если сеттеры, например, импортируются как обычный объект, то у нас нет необходимости прибегать к помощи `unpackModule()`:

```javascript
import { setters } from './setters'
import { getters } from './getters'
import { actions } from './actions'

const store = {
 state: {
   todos: [],
   status: 'idle',
   filter: 'all',
   message: {}
 },
 setters,
 getters,
 actions
}
```

Если мы импортируем сеттеры по отдельности, их необходимо распаковать:

```javascript
import { appSetters, todoSetters, filterSetters } from './setters'
import { getters } from './getters'
import { actions } from './actions'

const store = {
 state: {
   todos: [],
   status: 'idle',
   filter: 'all',
   message: {}
 },
 setters: {
   ...appSetters,
   ...todoSetters,
   ...filterSetters
 },
 getters,
 actions
}
```

Что происходит в `createSimpleContext()`? Вот как выглядит ее код:

```javascript
import { createContext, useContext, useState, useMemo } from 'react'
import {
 createSetters,
 createGetters,
 createActions,
 unpackModule
} from './utils'

// Функция принимает хранилище
export default function createSimpleContext(store) {
 // Создаем контекст
 const SimpleContext = createContext()

 // Создаем провайдер
 // Функция принимает дочерние компоненты
 const SimpleProvider = ({ children }) => {
   const [simpleState, setSimpleState] = useState(store.state)

   // мемоизация вычисления сеттеров и экшенов
   // является безопасной, поскольку они являются иммутабельными
   // здесь у вас может возникнуть вопрос о том, как сеттер получает свежее состояние
   // обратите внимание на то, что передается в функцию `createSetters()` в качестве второго аргумента
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
   // я пока не придумал способа мемоизировать вычисление геттеров с сохранением возможности получения ими всегда акутального состояния
   const getters = createGetters(store.getters, simpleState)

   return (
     // Мы вполне можем управлять состоянием напрямую через `simpleState` и `setSimpleState()`,
     // но лучше этого не делать во избежание путаницы между глобальными и локальными операциями.
     // Этим же объясняется то, что сеттеры, геттеры и экшены лучше не распаковывать
     // при передаче в контекст: мы видим, например, `setters.setTodos()` и сразу понимаем,
     // что имеем дело с глобальным состоянием
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

 // Хук для потребления контекста
 const useSimpleContext = () => useContext(SimpleContext)

 return [SimpleProvider, useSimpleContext]
}

export { unpackModule }
```

Самой простой функцией из числа утилит для преобразования операций является `createActions()`. С нее и начнем:

```javascript
// Функция принимает экшены и сеттеры
export const createActions = (_actions, setters) => {
 const actions = {}
 // Просто передаем каждому экшену сеттеры в качестве первого аргумента.
 // Полагаю, здесь мы применяем такой паттерн проектирования, как декоратор,
 // т.е. декорируем экшены с помощью дополнительного параметра.
 // Другими словами, мы увеличиваем "арность" функции
 for (const key in _actions) {
   actions[key] = (...args) => _actions[key](setters, ...args)
 }
 return actions
}
```

_Обратите внимание_: порядок вызова утилит имеет принципиальное значение. `createActions()` должны передаваться декорированные сеттеры.

Теперь рассмотрим `createGetters()`:

```javascript
// По сути, все то же самое, за исключением того,
// что мы декорируем геттеры дважды:
// в первый раз мы передаем им состояние в качестве первого аргумента,
// во второй раз в качестве первого аргумента им передается распакованное состояние и преобразованные геттеры
const createGetters = (_getters, state) => {
 const getters = {}
 for (const key in _getters) {
   getters[key] = (...args) => _getters[key](state, ...args)
 }
 for (const key in _getters) {
   getters[key] = (...args) => _getters[key]({ ...state, getters }, ...args)
 }
 return getters
}
```

Самое интересное происходит в функции `createSetters()`:

```javascript
const createSetters = (_setters, setState) => {
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
```

Здесь мы также модифицируем сеттеры, но не просто передаем им состояние в качестве первого аргумента, а вычисляем новую часть состояния на основе (гарантированно) свежего состояния, которое при вызове получает колбек `setState()`:

```javascript
setState((state) => {
 const newState = setters[key](state, ...args)
 return {
   ...state,
   ...newState
 }
})
```

Вот почему так важно, чтобы сеттер возвращал объект с ключом (или несколькими ключами), соответствующими ключам объекта состояния. Значения совпадающих ключей (части состояния) перезаписываются новыми значениями.

Вот и все. Для доступа к состоянию и операциям необходимо обернуть компоненты в провайдер контекста и вызвать хук `useSimpleContext()` в нужном компоненте:

```javascript
import { SimpleProvider } from './context'

render(
 <React.StrictMode>
   <SimpleProvider>
     <App />
   </SimpleProvider>
 </React.StrictMode>,
 document.getElementById('root')
)

const { simpleState, setSimpleState, setters, getters, actions } = useSimpleContext()
```

Так что, как видите, мы вовсе не изобретали велосипед заново, а всего лишь сделали его немного лучше. Как я отмечал в начале, ездить велосипед после этого стал немного медленнее (поскольку слегка потяжелел), но это только при разгоне. Зато выглядеть велосипед стал круче, да и "апгрейдить" его стало легче 😃

Пожалуй, это все, чем я хотел поделиться с вами в данной статье.
