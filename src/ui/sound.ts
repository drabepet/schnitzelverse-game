// Sound, kept small: every sound is synthesised here with the Web Audio API (no audio files, nothing
// to license), and only your own actions and the rare big moments make one. The game ticking along
// by itself is silent, so it can run in a background tab all day.
//
// Two volumes (Settings): effects (clicks, buying, selling, badges, new places) and music (a short
// tune of its own for each chapter, played once when you reach it). A mute button in the header
// silences both; with "quiet in the background" on, nothing plays while the tab is hidden.

export type Sfx = 'pound' | 'bread' | 'fry' | 'cook' | 'buy' | 'sale' | 'knock' | 'badge' | 'place' | 'farPlace' | 'sold'

export interface SoundSettings {
  /** 0–1. */
  soundVolume: number
  /** 0–1. */
  musicVolume: number
  soundMuted: boolean
  /** No sound while the game's tab is hidden. */
  muteHidden: boolean
}

let settings: SoundSettings = { soundVolume: 0.4, musicVolume: 0.4, soundMuted: false, muteHidden: true }
let ctx: AudioContext | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
const lastPlayed: Partial<Record<Sfx, number>> = {}

/** Perceived loudness grows faster than linear: square the slider so 40% sounds like "quiet". */
const level = (v: number) => Math.max(0, Math.min(1, v)) ** 2

/** Settings → sound. Called by App.tsx whenever the settings change. */
export function setSoundSettings(s: SoundSettings): void {
  const same =
    s.soundVolume === settings.soundVolume &&
    s.musicVolume === settings.musicVolume &&
    s.soundMuted === settings.soundMuted &&
    s.muteHidden === settings.muteHidden
  settings = { soundVolume: s.soundVolume, musicVolume: s.musicVolume, soundMuted: s.soundMuted, muteHidden: s.muteHidden }
  if (same && ctx) return
  if (!ctx || !sfxBus || !musicBus) return
  const t = ctx.currentTime
  sfxBus.gain.setTargetAtTime(s.soundMuted ? 0 : level(s.soundVolume), t, 0.02)
  musicBus.gain.setTargetAtTime(s.soundMuted ? 0 : level(s.musicVolume), t, 0.02)
}

/**
 * Browsers only let a page make sound after the player has clicked or pressed a key, so the audio
 * starts on the first one. Call once at startup.
 */
export function initSound(): void {
  if (typeof window === 'undefined') return
  const start = () => {
    audio()
    void ctx?.resume()
  }
  window.addEventListener('pointerdown', start, { capture: true })
  window.addEventListener('keydown', start, { capture: true })
}

function audio(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  const master = ctx.createDynamicsCompressor()
  master.connect(ctx.destination)
  sfxBus = ctx.createGain()
  musicBus = ctx.createGain()
  sfxBus.connect(master)
  musicBus.connect(master)
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  setSoundSettings(settings)
  return ctx
}

function silent(volume: number): boolean {
  if (settings.soundMuted || volume <= 0) return true
  return settings.muteHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

/** Midi note number → Hz. */
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12)

interface ToneOpts {
  type?: OscillatorType
  gain?: number
  attack?: number
  /** Glide to this frequency by the end. */
  to?: number
  dest?: AudioNode
  /** Low-pass the tone (softens square and sawtooth waves). */
  cutoff?: number
}

function tone(a: AudioContext, freq: number, at: number, dur: number, o: ToneOpts = {}): void {
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, at)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, at + dur)
  const peak = o.gain ?? 0.3
  const attack = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  let out: AudioNode = g
  if (o.cutoff) {
    const f = a.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.cutoff
    g.connect(f)
    out = f
  }
  osc.connect(g)
  out.connect(o.dest ?? sfxBus!)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

function noise(a: AudioContext, at: number, dur: number, filter: BiquadFilterType, freq: number, gain: number, q = 1, attack = 0.003): void {
  const src = a.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const f = a.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  f.Q.value = q
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(f).connect(g).connect(sfxBus!)
  src.start(at, Math.random() * 0.5)
  src.stop(at + dur + 0.02)
}

/** The shortest gap between two of the same sound, so buying ×100 doesn't machine-gun. */
const MIN_GAP: Partial<Record<Sfx, number>> = { buy: 0.07, sale: 0.09, pound: 0.05, bread: 0.06, fry: 0.12, cook: 0.15 }

/** Play one of the game's sounds (does nothing when muted or the effects volume is 0). */
export function sfx(name: Sfx): void {
  if (silent(settings.soundVolume)) return
  const a = audio()
  if (!a || a.state !== 'running') return
  const t = a.currentTime + 0.01
  if (t - (lastPlayed[name] ?? -1) < (MIN_GAP[name] ?? 0)) return
  lastPlayed[name] = t
  // A little pitch wobble so repeated clicks don't sound like a machine.
  const v = 1 + (Math.random() - 0.5) * 0.1
  switch (name) {
    case 'pound': // the mallet on the cutlet
      tone(a, 150 * v, t, 0.13, { to: 55, gain: 0.7 })
      noise(a, t, 0.05, 'lowpass', 900, 0.4)
      break
    case 'bread': // dragging it through crumbs
      noise(a, t, 0.16, 'bandpass', 1800 * v, 0.35, 0.8, 0.03)
      noise(a, t + 0.07, 0.14, 'bandpass', 2400 * v, 0.2, 0.8, 0.03)
      break
    case 'fry':
    case 'cook': // into the hot fat
      noise(a, t, name === 'cook' ? 0.75 : 0.55, 'highpass', 3200, 0.16, 0.7, 0.02)
      for (let i = 0; i < (name === 'cook' ? 14 : 9); i++) noise(a, t + Math.random() * 0.5, 0.012, 'bandpass', 4000 + Math.random() * 3000, 0.25, 2)
      if (name === 'cook') tone(a, 150 * v, t, 0.1, { to: 60, gain: 0.35 })
      break
    case 'buy': // a coin on the counter
      tone(a, hz(88) * v, t, 0.06, { type: 'triangle', gain: 0.18 })
      tone(a, hz(93) * v, t + 0.05, 0.1, { type: 'triangle', gain: 0.16 })
      break
    case 'sale': // the till
      noise(a, t, 0.025, 'highpass', 6000, 0.15)
      tone(a, hz(96) * v, t + 0.03, 0.35, { gain: 0.13 })
      tone(a, hz(100) * v, t + 0.03, 0.4, { gain: 0.1 })
      break
    case 'knock': // on the neighbours' door
      for (const d of [0, 0.13]) {
        tone(a, 190, t + d, 0.08, { to: 120, gain: 0.5 })
        noise(a, t + d, 0.03, 'lowpass', 700, 0.25)
      }
      break
    case 'badge': // a little chime
      for (const [i, n] of [84, 88, 91, 96].entries()) tone(a, hz(n), t + i * 0.075, 0.45, { gain: 0.12 })
      break
    case 'place': // a new place: two notes up
      tone(a, hz(79), t, 0.18, { type: 'triangle', gain: 0.18 })
      tone(a, hz(84), t + 0.11, 0.3, { type: 'triangle', gain: 0.18 })
      break
    case 'farPlace': // further than ever before
      for (const [i, n] of [72, 76, 79, 84].entries()) tone(a, hz(n), t + i * 0.09, 0.4, { type: 'triangle', gain: 0.16 })
      tone(a, hz(103), t + 0.36, 0.25, { gain: 0.06 })
      break
    case 'sold': // selling the business: a whoosh up into a chord
      tone(a, 500, t, 0.45, { to: 2200, gain: 0.08 })
      for (const n of [72, 76, 79, 84]) tone(a, hz(n), t + 0.4, 0.9, { type: 'triangle', gain: 0.11, attack: 0.02 })
      break
  }
}

// ---------------------------------------------------------------- chapter tunes

/** A note: midi number (0 = rest) and length in beats. */
type Line = [number, number][]
interface Tune {
  bpm: number
  melody: Line
  bass: Line
  lead: OscillatorType
  /** Low-pass for the lead, to soften square waves. */
  cutoff?: number
  /** A soft echo (the stars). */
  echo?: boolean
}

// Short, original motifs, one per chapter, each about three seconds.
const TUNES: Record<number, Tune> = {
  // 1 · The garage: a cheeky little polka on a squeezebox.
  1: {
    bpm: 150,
    lead: 'square',
    cutoff: 1800,
    melody: [[72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5], [77, 0.5], [74, 0.5], [71, 0.5], [74, 0.5], [72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5]],
    bass: [[48, 0.5], [55, 0.5], [48, 0.5], [55, 0.5], [43, 0.5], [55, 0.5], [43, 0.5], [55, 0.5], [48, 0.5], [55, 0.5], [48, 2]],
  },
  // 2 · Grandpa's farm: an easy folk tune.
  2: {
    bpm: 120,
    lead: 'triangle',
    melody: [[67, 0.5], [69, 0.5], [71, 0.5], [74, 1], [72, 0.5], [71, 0.5], [69, 0.5], [67, 0.5], [71, 0.5], [67, 1.5]],
    bass: [[43, 1], [50, 1], [48, 1], [50, 1], [43, 2]],
  },
  // 3 · On the road: something with an engine in it.
  3: {
    bpm: 140,
    lead: 'sawtooth',
    cutoff: 2200,
    melody: [[64, 0.5], [67, 0.5], [69, 0.5], [71, 0.5], [72, 0.5], [71, 0.5], [69, 0.5], [67, 0.5], [69, 0.5], [72, 0.5], [76, 1.5]],
    bass: [[40, 0.5], [40, 0.5], [40, 0.5], [40, 0.5], [45, 0.5], [45, 0.5], [45, 0.5], [45, 0.5], [40, 0.5], [47, 0.5], [40, 1.5]],
  },
  // 4 · The stars: slow, wide, with an echo.
  4: {
    bpm: 90,
    lead: 'sine',
    echo: true,
    melody: [[72, 0.5], [79, 0.5], [84, 1], [83, 0.5], [79, 0.5], [76, 0.5], [77, 0.5], [79, 1.5]],
    bass: [[48, 2], [53, 2], [55, 2]],
  },
  // 5 · The Schnitzelverse: the big finish.
  5: {
    bpm: 110,
    lead: 'triangle',
    melody: [[76, 0.5], [77, 0.5], [79, 1], [84, 1], [83, 0.5], [81, 0.5], [79, 0.5], [84, 2]],
    bass: [[48, 1], [45, 1], [41, 1], [43, 1], [48, 2.5]],
  },
}

/** Play the chapter's tune once (does nothing when muted or the music volume is 0). */
export function chapterTune(chapter: number): void {
  const tune = TUNES[chapter]
  if (!tune || silent(settings.musicVolume)) return
  const a = audio()
  if (!a || a.state !== 'running' || !musicBus) return
  const beat = 60 / tune.bpm
  let dest: AudioNode = musicBus
  if (tune.echo) {
    const delay = a.createDelay(1)
    delay.delayTime.value = beat * 0.75
    const feedback = a.createGain()
    feedback.gain.value = 0.35
    const wet = a.createGain()
    wet.gain.value = 0.5
    const dry = a.createGain()
    dry.connect(musicBus)
    dry.connect(delay)
    delay.connect(feedback).connect(delay)
    delay.connect(wet).connect(musicBus)
    dest = dry
  }
  const play = (line: Line, opts: ToneOpts) => {
    let t = a.currentTime + 0.05
    for (const [note, beats] of line) {
      if (note) tone(a, hz(note), t, beats * beat * 0.95, { ...opts, dest })
      t += beats * beat
    }
  }
  play(tune.melody, { type: tune.lead, gain: 0.22, attack: 0.01, cutoff: tune.cutoff })
  play(tune.bass, { type: 'triangle', gain: 0.25, attack: 0.01 })
}
