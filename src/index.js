import React from 'react'
import { render } from 'react-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import App from './App'
import { SimpleProvider } from './context'
// import { todos } from './todos'

render(
  <React.StrictMode>
    <SimpleProvider>
      <App />
    </SimpleProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
