import { Suspense, useEffect, useState } from 'react'
import { Header } from './ui/Header'
import { SupplyPanel } from './ui/SupplyPanel'
import { KitchenPage } from './ui/KitchenPage'
import { DistributionPanel } from './ui/DistributionPanel'
import { StaffPanel } from './ui/StaffPanel'
import { UpgradesPanel } from './ui/UpgradesPanel'
import { OfflineDialog } from './ui/OfflineDialog'
import { FranchisePanel } from './ui/FranchisePanel'
import { FarmPanel } from './ui/FarmPanel'
import { FleetPanel } from './ui/FleetPanel'
import { BadgeToasts } from './ui/BadgeToasts'
import { Moments } from './ui/Moments'
import { setEffectsLevel } from './ui/juice'
import { StatusSidebar } from './ui/StatusSidebar'
import { preloadLazyParts, RecordsTab } from './ui/lazyParts'
import { IntroDialog } from './ui/IntroDialog'
import { FinaleDialog } from './ui/FinaleDialog'
import { TabBar } from './ui/Tabs'
import { visibleTabs, type TabId } from './ui/tabList'
import { chapter2Unlocked, chapterNumber } from './engine/rules'
import { useGame } from './game/store'
import { setNotation } from './engine/format'
import { GO_TO_EVENT, type GoTo } from './ui/goTo'

const TAB_KEY = 'schnitzelverse-tab'
const HOME: TabId = 'making'

function loadTab(): TabId {
  try {
    return (localStorage.getItem(TAB_KEY) as TabId | null) ?? HOME
  } catch {
    return HOME
  }
}

export default function App() {
  const game = useGame()
  // Number format for everything rendered below.
  setNotation(game.state.settings.notation)
  const [tab, setTab] = useState<TabId>(loadTab)
  // A remembered tab may not exist (yet, or any more) in this save: fall back to the kitchen.
  const current: TabId = visibleTabs(game.state).some((t) => t.id === tab) ? tab : HOME
  const farm = chapter2Unlocked(game.state)

  // Interface size (Settings): the whole layout is in rem, so it scales with the root font.
  const scale = game.state.settings.uiScale
  useEffect(() => {
    document.documentElement.dataset.scale = scale
  }, [scale])

  // Effects (Settings): the juice functions and CSS (sizzle, pulse) follow it.
  const effects = game.state.settings.effects
  setEffectsLevel(effects)
  useEffect(() => {
    document.documentElement.dataset.effects = effects
  }, [effects])

  // Chapter skins (Settings): the page takes the colours of the chapter you're in.
  const skin = game.state.settings.chapterColours ? chapterNumber(game.state) : 1
  useEffect(() => {
    document.documentElement.dataset.chapter = String(skin)
  }, [skin])

  // The Records tab and the menu's dialogs: fetched once the game is running.
  useEffect(preloadLazyParts, [])

  // Links elsewhere (the sidebar) can open a tab and scroll to a spot on it.
  useEffect(() => {
    const onGoTo = (e: Event) => {
      const { tab: to, anchor } = (e as CustomEvent<GoTo>).detail
      setTab(to)
      if (anchor) {
        // Wait for the tab to render before scrolling to the spot.
        window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
    window.addEventListener(GO_TO_EVENT, onGoTo)
    return () => window.removeEventListener(GO_TO_EVENT, onGoTo)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, current)
    } catch {
      // ignore: the tab is only a convenience
    }
  }, [current])

  return (
    <div className="app">
      <Header />
      <div className="layout">
        <StatusSidebar />
        <div className="content">
          <TabBar active={current} onSelect={setTab} />

          {current === 'prep' &&
            (farm ? (
              <FarmPanel />
            ) : (
              <div className="tab-grid">
                <SupplyPanel />
                <UpgradesPanel pillar="prep" />
              </div>
            ))}

          {current === 'making' && <KitchenPage />}

          {current === 'distribution' && (
            <div className="tab-grid">
              <DistributionPanel />
              <div className="stack">
                <StaffPanel />
                <FleetPanel />
                <UpgradesPanel pillar="distribution" />
              </div>
            </div>
          )}

          {current === 'franchise' && (
            <div className="stack">
              <FranchisePanel />
            </div>
          )}

          {current === 'records' && (
            <Suspense fallback={<p className="muted lazy-wait">Opening the records…</p>}>
              <RecordsTab />
            </Suspense>
          )}
        </div>
      </div>

      <BadgeToasts />
      <Moments />
      <OfflineDialog />
      <IntroDialog />
      <FinaleDialog />
    </div>
  )
}
