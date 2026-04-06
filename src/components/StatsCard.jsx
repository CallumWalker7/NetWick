// StatsCard — one metric tile for the dashboard
export default function StatsCard({ title, value, icon, colorClass }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClass}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-stone-800">{value}</div>
      <div className="text-sm text-stone-500 mt-0.5">{title}</div>
    </div>
  )
}
