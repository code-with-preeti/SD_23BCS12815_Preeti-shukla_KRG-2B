import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

type RegisterResponse = { message: string; userId: number }

function getReadableError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Registration failed. Please try again.'
  const maybeMessage = (err as { message?: string }).message
  if (!maybeMessage) return 'Registration failed. Please try again.'
  try {
    const parsed = JSON.parse(maybeMessage) as { message?: string }
    return parsed.message || maybeMessage
  } catch {
    return maybeMessage
  }
}

export function RegisterPage() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => name.trim() && email.trim() && password.length >= 6,
    [name, email, password],
  )

  return (
    <div className="grid min-h-[76vh] place-items-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative hidden p-8 md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-sky-500/10 to-violet-500/15" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                Secure JWT auth
              </div>
              <div className="mt-4 text-2xl font-semibold text-white">Create your monitoring space</div>
              <div className="mt-2 text-sm text-white/70">
                Add monitors, get status history, and calculate uptime automatically.
              </div>
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Pro tips</div>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    Use `/health` endpoints for stable checks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                    Track response time to detect slowdowns early
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5">
              <div className="text-xl font-semibold text-white">Create account</div>
              <div className="text-sm text-white/70">Start monitoring in minutes</div>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!canSubmit) return
                setSubmitting(true)
                setError(null)
                try {
                  await apiFetch<RegisterResponse>('/api/auth/register', {
                    method: 'POST',
                    json: { name: name.trim(), email: email.trim().toLowerCase(), password },
                  })
                  nav('/login')
                } catch (err) {
                  setError(getReadableError(err))
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              <label className="block">
                <div className="mb-1 text-sm font-medium text-white/90">Name</div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 placeholder:text-white/40 focus:ring-4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Preety"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-medium text-white/90">Email</div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 placeholder:text-white/40 focus:ring-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-medium text-white/90">Password</div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 placeholder:text-white/40 focus:ring-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  type="password"
                />
              </label>

              {error ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/10 hover:from-cyan-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-white/70">
              Already have an account?{' '}
              <Link className="font-medium text-white hover:underline" to="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

