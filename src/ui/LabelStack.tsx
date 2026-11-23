/**
 * Several labels in one spot, showing one: the spot is as wide as the widest,
 * so a button whose label changes on its own (a countdown, say) keeps its size.
 */
export function LabelStack({ labels, show }: { labels: string[]; show: number }) {
  return (
    <span className="label-stack">
      {labels.map((l, i) => (
        <span key={i} className={i === show ? '' : 'hidden'} aria-hidden={i !== show}>
          {l}
        </span>
      ))}
    </span>
  )
}
