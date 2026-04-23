import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { setToken } from '../lib/storage'

type LoginResponse = { token: string }

export function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim() && password, [email, password])

  return (
    <div className="grid min-h-[76vh] place-items-center">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative hidden p-8 md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/10" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live checks every interval
              </div>
              <div className="mt-4 text-2xl font-semibold text-white">
                Monitor your APIs with confidence
              </div>
              <div className="mt-2 text-sm text-white/70">
                Track uptime, response times, and history — all in one clean dashboard.
              </div>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    What you get
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-white/80">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                      Status history (last 10 checks)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
                      Uptime percentage
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                      Response time tracking
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5">
              <div className="text-xl font-semibold text-white">Welcome back</div>
              <div className="text-sm text-white/70">Login to your dashboard</div>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!canSubmit) return
                setSubmitting(true)
                setError(null)
                try {
                  const res = await apiFetch<LoginResponse>('/api/auth/login', {
                    method: 'POST',
                    json: { email: email.trim().toLowerCase(), password },
                  })
                  setToken(res.token)
                  nav('/dashboard')
                } catch (err) {
                  setError('Login failed. Check your email & password.')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
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
                  autoComplete="current-password"
                  placeholder="••••••••"
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
                className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/10 hover:from-violet-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-white/70">
              New here?{' '}
              <Link className="font-medium text-white hover:underline" to="/register">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

