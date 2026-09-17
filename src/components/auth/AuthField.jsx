// ------------------------------------------------------------------
// src/components/auth/AuthField.jsx
// ------------------------------------------------------------------
// Campo reutilizável do formulário de autenticação: label, ícone à
// esquerda, slot opcional à direita (ex.: mostrar/ocultar senha) e
// mensagem de erro.
// ------------------------------------------------------------------
export default function AuthField({ label, icon: Icon, error, trailing, className = '', ...inputProps }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
        <input
          className={`input pl-10 ${trailing ? 'pr-11' : ''}`}
          {...inputProps}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}