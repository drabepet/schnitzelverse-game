import { reachedOrbit } from '../engine/rules'
import { useGame } from '../game/store'
import fireLogo from '../assets/logo-fire.png'
import spaceLogo from '../assets/logo-space.png'

/**
 * The Schnitzelverse logo: a schnitzel in a flaming pan, and once the
 * business has reached the orbit, the same pan circling a planet.
 */
export function Logo({ size = 48 }: { size?: number }) {
  const { state } = useGame()
  const space = reachedOrbit(state)
  return (
    <img
      className="logo"
      src={space ? spaceLogo : fireLogo}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}
