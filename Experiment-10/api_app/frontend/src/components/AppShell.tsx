import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../lib/storage'

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm" />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">API Sentinel</div>
        <div className="text-xs text-white/60">Beautiful monitoring</div>
      </div>
    </div>
  )
}

export function AppShell() {
  const nav = useNavigate()
  const loc = useLocation()
  const authed = Boolean(getToken())
  const active = (path: string) =>
    loc.pathname === path
      ? 'bg-white/10 text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-200px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-[-260px] right-[-220px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-cyan-400/20 via-sky-500/20 to-violet-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-6">
          <button onClick={() => nav('/')} className="text-left">
            <Logo />
          </button>
          <nav className="hidden items-center gap-2 md:flex">
            <Link className={`rounded-xl px-3 py-2 text-sm font-medium ${active('/')}`} to="/">
              Home
            </Link>
            <Link
              className={`rounded-xl px-3 py-2 text-sm font-medium ${active('/dashboard')}`}
              to="/dashboard"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {authed ? (
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm backdrop-blur hover:bg-white/10"
              onClick={() => {
                clearToken()
                nav('/login')
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <button
                className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm backdrop-blur hover:bg-white/10 sm:inline-flex"
                onClick={() => nav('/login')}
              >
                Login
              </button>
              <button
                className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/10 hover:from-violet-400 hover:to-fuchsia-400"
                onClick={() => nav('/register')}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12">
        <Outlet />
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} API Sentinel · Built for demos & interviews
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link className="rounded-xl px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white" to="/">
              Home
            </Link>
            <Link
              className="rounded-xl px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white"
              to="/dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

