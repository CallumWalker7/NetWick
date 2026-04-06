// StrengthBadge — colored pill for weak / medium / strong
const STYLES = {
  strong: 'bg-green-100 text-green-700',
  medium: 'bg-gold-100 text-gold-700',
  weak:   'bg-stone-100 text-stone-500',
}

export default function StrengthBadge({ strength }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STYLES[strength] ?? STYLES.weak}`}>
      {strength}
    </span>
  )
}
