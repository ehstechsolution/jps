// ------------------------------------------------------------------
// src/components/StatCard.jsx
// ------------------------------------------------------------------
// Cartão de métrica do Dashboard: ícone colorido, valor em destaque,
// rótulo e link opcional.
// ------------------------------------------------------------------
export default function StatCard({ icon: Icon, iconClass, label, value, hint, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        card p-5 flex items-start gap-4
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}
      `}
    >
      <span className={`grid place-items-center h-12 w-12 rounded-xl text-white shrink-0 ${iconClass}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
          {value}
        </p>
        <p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {hint && (
          <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-500">{hint}</p>
        )}
      </div>
    </div>
  )
}