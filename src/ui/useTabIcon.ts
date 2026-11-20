import { useEffect } from 'react'
import { reachedOrbit } from '../engine/rules'
import { useGame } from '../game/store'
import spaceIcon from '../assets/favicon-space.png'

/** Keeps the browser-tab icon in step with the logo. */
export function useTabIcon(): void {
  const { state } = useGame()
  const space = reachedOrbit(state)
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    if (!link.dataset.fire) link.dataset.fire = link.href
    link.type = 'image/png'
    link.href = space ? spaceIcon : link.dataset.fire
  }, [space])
}
