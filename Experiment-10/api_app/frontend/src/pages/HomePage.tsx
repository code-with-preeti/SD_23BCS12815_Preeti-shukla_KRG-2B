import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getToken } from '../lib/storage'
import { apiFetch } from '../lib/api'

function FeatureCard({
  title,
  desc,
  accent,
}: {
  title: string
  desc: string
  accent: 'violet' | 'cyan' | 'fuchsia'
}) {
  const ring =
    accent === 'violet'
      ? 'ring-violet-400/20'
      : accent === 'cyan'
        ? 'ring-cyan-400/20'
        : 'ring-fuchsia-400/20'
  const dot =
    accent === 'violet'
      ? 'bg-violet-400'
      : accent === 'cyan'
        ? 'bg-cyan-400'
        : 'bg-fuchsia-400'

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur ring-1 ${ring}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/70">{desc}</div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-2xl backdrop-blur">
      <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-white/60">{label}</div>
    </div>
  )
}

type PublicStats = {
  ok: boolean
  monitors: number
  checks: number
  uptimePercent: number
}

export function HomePage() {
  const nav = useNavigate()
  const authed = Boolean(getToken())
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await apiFetch<PublicStats>('/api/public/stats')
        if (!cancelled) setStats(s)
      } catch {
        if (!cancelled) setStats({ ok: false, monitors: 0, checks: 0, uptimePercent: 0 })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = useMemo(() => {
    if (!stats) {
      return [
        { label: 'Monitors', value: '—' },
        { label: 'Checks stored', value: '—' },
        { label: 'Overall uptime', value: '—' },
      ]
    }
    return [
      { label: 'Monitors', value: String(stats.monitors) },
      { label: 'Checks stored', value: String(stats.checks) },
      { label: 'Overall uptime', value: `${stats.uptimePercent}%` },
    ]
  }, [stats])

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Interview-ready API monitoring demo
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            API Sentinel
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Uptime, history, and response-time checks — automated.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base text-white/70">
            A clean backend + a polished dashboard that monitors endpoints on a fixed interval, stores
            check history, and calculates uptime. Supports GET/POST/PUT/PATCH/DELETE with JSON bodies.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/10 hover:from-violet-400 hover:to-fuchsia-400"
              onClick={() => nav(authed ? '/dashboard' : '/register')}
            >
              {authed ? 'Open dashboard' : 'Get started'}
            </button>
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur hover:bg-white/10"
              to="/login"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {statCards.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Live preview</div>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Payments API</div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                  UP
                </span>
              </div>
              <div className="mt-1 text-xs text-white/60">POST https://api.example.com/charge</div>
              <div className="mt-2 text-xs text-white/70">
                Response time: <span className="font-semibold text-white">142ms</span> · Uptime:{' '}
                <span className="font-semibold text-white">99.9%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Healthcheck</div>
                <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs font-medium text-rose-200">
                  DOWN
                </span>
              </div>
              <div className="mt-1 text-xs text-white/60">GET https://example.com/health</div>
              <div className="mt-2 text-xs text-white/70">
                Timeout after <span className="font-semibold text-white">5s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FeatureCard
          accent="violet"
          title="Multi-method monitors"
          desc="Monitor GET/POST/PUT/PATCH/DELETE endpoints with optional JSON bodies."
        />
        <FeatureCard
          accent="fuchsia"
          title="History + uptime"
          desc="Stores the last 10 checks per API and calculates uptime percentage."
        />
        <FeatureCard
          accent="cyan"
          title="Built like a product"
          desc="JWT auth, clean dashboard UI, and a background worker architecture."
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xl font-semibold text-white">How it works</div>
            <div className="mt-1 text-sm text-white/70">
              Simple architecture, easy to explain in interviews.
            </div>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            onClick={() => nav('/dashboard')}
          >
            View dashboard
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/60">1. Create monitor</div>
            <div className="mt-2 text-sm text-white/80">Save URL, method, and optional body per API.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/60">2. Worker checks</div>
            <div className="mt-2 text-sm text-white/80">Runs on an interval, measures latency, marks UP/DOWN.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/60">3. Insights</div>
            <div className="mt-2 text-sm text-white/80">Dashboard shows history and uptime instantly.</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-400/10 p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-xl font-semibold text-white">Ready to demo?</div>
            <div className="mt-1 text-sm text-white/70">
              Create a monitor, wait 10 seconds, and you’ll see history + uptime.
            </div>
          </div>
          <button
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-white/90"
            onClick={() => nav(authed ? '/dashboard' : '/register')}
          >
            {authed ? 'Open dashboard' : 'Create an account'}
          </button>
        </div>
      </section>
    </div>
  )
}

