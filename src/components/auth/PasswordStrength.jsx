// ------------------------------------------------------------------
// src/components/auth/PasswordStrength.jsx
// ------------------------------------------------------------------
// Medidor visual de força de senha (4 segmentos) usado no cadastro.
// ------------------------------------------------------------------

/** Pontua a senha de 0 a 4 com base em critérios simples. */
function computeScore(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++ // letras mistas
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++ // símbolo
  return score
}

const LABELS = ['', 'Fraca', 'Média', 'Boa', 'Forte']
const COLORS = {
  1: 'bg-red-400',
  2: 'bg-amber-400',
  3: 'bg-emerald-400',
  4: 'bg-emerald-500',
}
const TEXT_COLORS = {
  1: 'text-red-500',
  2: 'text-amber-500',
  3: 'text-emerald-600',
  4: 'text-emerald-600',
}

/** @param {{ password: string }} props */
export default function PasswordStrength({ password }) {
  const score = computeScore(password)
  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? COLORS[score] : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-[11px] font-semibold ${TEXT_COLORS[score]}`}>
        Força da senha: {LABELS[score]}
      </p>
    </div>
  )
}