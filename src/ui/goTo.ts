// Jump to a tab and a spot on it from anywhere (the sidebar has no access to
// the tab state, which lives in App). App listens for this event.
import type { TabId } from './Tabs'

export const GO_TO_EVENT = 'schnitzelverse:goto'

export interface GoTo {
  tab: TabId
  /** Element id to scroll to once the tab is shown. */
  anchor?: string
}

export function goTo(target: GoTo): void {
  window.dispatchEvent(new CustomEvent<GoTo>(GO_TO_EVENT, { detail: target }))
}
