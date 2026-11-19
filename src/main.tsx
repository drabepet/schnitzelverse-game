import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { store } from './game/store'

store.start()
if (import.meta.hot) import.meta.hot.dispose(() => store.stop())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
