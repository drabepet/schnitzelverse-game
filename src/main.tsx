import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './emoji-font.css'
import './index.css'
import App from './App'
import { store } from './game/store'
import { initSound, sfx } from './ui/sound'

// Start loading the emoji font now rather than at the first render; the browser picks the right file.
document.fonts?.load("1em 'Schnitzel Emoji'", '🍳').catch(() => {})

// Sound starts on the first click or key press (browsers require one). Any action that spends money
// clinks, one that earns it rings the till; selling the business has its own fanfare (Moments.tsx).
initSound()
store.onAct = (before, s, result) => {
  if (result === false || s.prestige.franchises !== before.franchises) return
  if (s.money.lt(before.money)) sfx('buy')
  else if (s.money.gt(before.money)) sfx('sale')
}

store.start()
if (import.meta.hot) import.meta.hot.dispose(() => store.stop())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
