import { Fragment } from 'react'
import { useGame } from '../game/store'
import { visibleTabs, type TabId } from './tabList'

export function TabBar({ active, onSelect }: { active: TabId; onSelect: (t: TabId) => void }) {
  const { state } = useGame()
  const tabs = visibleTabs(state)
  return (
    <nav className="tabs" role="tablist">
      {tabs.map((t, i) => {
        const prev = tabs[i - 1]
        return (
          <Fragment key={t.id}>
            {prev?.pipeline && t.pipeline && (
              <span className="tab-arrow" aria-hidden>
                →
              </span>
            )}
            {prev?.pipeline && !t.pipeline && <span className="tab-divider" aria-hidden />}
            <button
              role="tab"
              aria-selected={active === t.id}
              className={`tab ${active === t.id ? 'active' : ''}`}
              onClick={() => onSelect(t.id)}
            >
              <span aria-hidden>{t.emoji}</span> {t.label}
              {'alert' in t && (
                // Always there (hidden when quiet), so tabs don't slide sideways as it comes and goes.
                <span
                  className={`tab-alert ${t.alert === '!' ? 'warn' : ''} ${t.alert ? '' : 'quiet'}`}
                  title={t.alert ? t.alertTitle : undefined}
                  aria-hidden={!t.alert}
                >
                  {t.alert ?? '!'}
                </span>
              )}
            </button>
          </Fragment>
        )
      })}
    </nav>
  )
}
