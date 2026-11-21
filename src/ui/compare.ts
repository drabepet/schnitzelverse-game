// Silly real-world comparisons for the Records page: how far your schnitzels
// reach laid end to end, how much the pork weighs, how tall the money piles up.

/** [what, size in metres or kilograms], smallest first. */
type Ref = readonly [string, number]

/** Laid end to end, a schnitzel is about 25 cm. */
export const SCHNITZEL_LENGTH = 0.25
/** Pork loin per schnitzel, kg. */
export const PORK_PER_SCHNITZEL = 0.15
/** A banknote is about 0.11 mm thick; we stack $100 notes. */
export const NOTE_THICKNESS = 0.00011
export const NOTE_VALUE = 100

export const DISTANCES: Ref[] = [
  ['a football pitch', 105],
  ['a marathon', 42_195],
  ['the river Danube', 2.85e6],
  ['the way around the Earth', 4.0075e7],
  ['the way to the Moon', 3.844e8],
  ['the way to the Sun', 1.496e11],
  ['the way to Neptune', 4.5e12],
  ['a light year', 9.461e15],
  ['the way to the next star', 4.0e16],
  ['the Milky Way, end to end', 9.5e20],
  ['the way to Andromeda', 2.4e22],
]

export const MASSES: Ref[] = [
  ['a grandma', 65],
  ['a car', 1_400],
  ['an elephant', 6_000],
  ['a blue whale', 150_000],
  ['the Eiffel Tower', 1.01e7],
  ['the Great Pyramid', 6e9],
  ['Mount Everest', 8.1e14],
  ['the Moon', 7.35e22],
  ['the Earth', 5.97e24],
  ['the Sun', 1.99e30],
]

export const HEIGHTS: Ref[] = [
  ['Grandma', 1.6],
  ['a house', 10],
  ['a church tower', 60],
  ['the Eiffel Tower', 330],
  ['Mount Everest', 8_849],
  ['the space station’s orbit', 4.08e5],
  ['the distance to the Moon', 3.844e8],
  ['the distance to the Sun', 1.496e11],
  ['the distance to Neptune', 4.5e12],
  ['a light year', 9.461e15],
]

/** A multiplier with at most three significant digits: 1.5×, 12×, 340×, 2,400×. */
function times(ratio: number): string {
  if (ratio < 10) return `${Number(ratio.toFixed(1))}×`
  return `${Math.round(ratio).toLocaleString('en')}×`
}

/**
 * The biggest thing `value` is at least as big as, and how many times over:
 * { times: '2.3×', what: 'the way around the Earth' }. Null when smaller than everything.
 */
export function compare(value: number, refs: Ref[]): { times: string; what: string } | null {
  if (!Number.isFinite(value)) return { times: 'more than', what: refs[refs.length - 1][0] }
  let best: Ref | null = null
  for (const r of refs) if (value >= r[1]) best = r
  if (!best) return null
  return { times: times(value / best[1]), what: best[0] }
}
