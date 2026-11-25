import { RecordsTop } from './RecordsTop'
import { StatsPanel } from './StatsPanel'
import { BadgesPage } from './BadgesPage'
import { LogPanel } from './LogPanel'

/** The Records tab: loaded on its own (see App.tsx), as most visits are to the other tabs. */
export default function RecordsTab() {
  return (
    <div className="stack">
      <RecordsTop />
      <StatsPanel />
      <BadgesPage />
      <LogPanel />
    </div>
  )
}
