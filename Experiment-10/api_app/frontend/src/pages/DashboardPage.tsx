import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from '../lib/api'
import { getToken } from '../lib/storage'

/* --- UI Component for Status --- */
function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'unknown'
  const themes: Record<string, string> = {
    up: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    down: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    throttled: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  const theme = themes[s] || 'bg-white/5 text-white/40 border-white/10'

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-tighter ${theme}`}>
      {s}
    </span>
  )
}


export function DashboardPage() {
  const [apis, setApis] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headersText, setHeadersText] = useState('{\n  "Content-Type": "application/json"\n}')
  const [bodyText, setBodyText] = useState('{\n  "ping": "sentinel"\n}')
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'apiKey'>('none')
  const [bearerToken, setBearerToken] = useState('')
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState('x-api-key')
  const [apiKeyValue, setApiKeyValue] = useState('')

  const canSendBody = useMemo(() => !['GET', 'HEAD', 'OPTIONS'].includes(method), [method])
  const showAdvancedRequestFields = useMemo(
    () => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method),
    [method],
  )
  const selected = useMemo(() => apis.find((api) => api.id === selectedId) ?? null, [apis, selectedId])

  const loadData = async () => {
    try {
      const data = await apiFetch<any[]>('/api/monitored-apis')
      setApis(data)
      setError(null)
    } catch (e: any) {
      if (e.status === 429) {
        setError('RATE LIMIT REACHED: Backend is throttling your requests.')
      } else {
        setError('OFFLINE: Backend server is unreachable.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    const interval = setInterval(() => void loadData(), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${wsProtocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}`)
    socket.onopen = () => setWsConnected(true)
    socket.onclose = () => setWsConnected(false)
    socket.onerror = () => setWsConnected(false)
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as {
        type?: string
        apiId?: number
        status?: string
      }
      if (payload.type !== 'api-status-updated' || !payload.apiId || !payload.status) return
      setApis((prev) =>
        prev.map((api) => (api.id === payload.apiId ? { ...api, status: payload.status } : api)),
      )
      if (selectedId === payload.apiId) {
        void fetchHistory(payload.apiId)
      }
    }
    return () => socket.close()
  }, [selectedId])

  const fetchHistory = async (apiOrId: any) => {
    const apiId = typeof apiOrId === 'number' ? apiOrId : apiOrId.id
    setSelectedId(apiId)
    try {
      const h = await apiFetch<any[]>(`/api/monitored-apis/${apiId}/history`)
      setHistory(h)
    } catch {
      console.error('History fetch failed')
    }
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setCreating(true)

    try {
      const rawHeaders = showAdvancedRequestFields && headersText.trim() ? JSON.parse(headersText) : {}
      const authHeaders: Record<string, string> = {}
      if (showAdvancedRequestFields && authType === 'bearer' && bearerToken.trim()) {
        authHeaders.Authorization = `Bearer ${bearerToken.trim()}`
      }
      if (showAdvancedRequestFields && authType === 'apiKey' && apiKeyHeaderName.trim() && apiKeyValue.trim()) {
        authHeaders[apiKeyHeaderName.trim()] = apiKeyValue.trim()
      }
      const mergedHeaders = { ...rawHeaders, ...authHeaders }
      const headers = Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined
      const body =
        showAdvancedRequestFields && canSendBody && bodyText.trim() ? JSON.parse(bodyText) : undefined
      const created = await apiFetch<any>('/api/monitored-apis', {
        method: 'POST',
        json: {
          name,
          url,
          method,
          headers,
          body,
        },
      })
      setApis((prev) => [created, ...prev])
      setName('')
      setUrl('')
      setMethod('GET')
      setAuthType('none')
      setBearerToken('')
      setApiKeyValue('')
      setBodyText('{\n  "ping": "sentinel"\n}')
      setFormError(null)
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create monitor')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* Main Section */}
        <div className="space-y-6">
          <header className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl">
            <div>
              <h1 className="text-2xl font-black tracking-tight italic text-violet-400">SENTINEL_DASH</h1>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mt-1">
                {loading ? 'Initializing...' : 'Operational'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`text-[9px] font-black px-3 py-2 rounded-full border uppercase tracking-widest ${
                  wsConnected
                    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                }`}
              >
                {wsConnected ? 'WS LIVE' : 'WS RETRYING'}
              </div>
              {error && (
                <div className="text-rose-400 text-[9px] font-black bg-rose-400/10 px-4 py-2 rounded-full border border-rose-400/30 animate-pulse tracking-widest uppercase">
                  {error}
                </div>
              )}
            </div>
          </header>

          <form onSubmit={handleCreate} className="p-5 rounded-3xl border border-white/10 bg-white/5 space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold">New monitor (Postman style)</div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
              <input
                className="px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"
                placeholder="Monitor Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <select
                className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m} className="bg-black">
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-sm font-mono"
              placeholder="https://api.example.com/resource"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            {showAdvancedRequestFields && (
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
                    Authorization
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer' | 'apiKey')}
                    >
                      <option value="none" className="bg-black">
                        No Auth
                      </option>
                      <option value="bearer" className="bg-black">
                        Bearer Token
                      </option>
                      <option value="apiKey" className="bg-black">
                        API Key Header
                      </option>
                    </select>
                    {authType === 'bearer' && (
                      <input
                        className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"
                        value={bearerToken}
                        onChange={(e) => setBearerToken(e.target.value)}
                        placeholder="Paste bearer token"
                      />
                    )}
                    {authType === 'apiKey' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"
                          value={apiKeyHeaderName}
                          onChange={(e) => setApiKeyHeaderName(e.target.value)}
                          placeholder="Header name"
                        />
                        <input
                          className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-sm"
                          value={apiKeyValue}
                          onChange={(e) => setApiKeyValue(e.target.value)}
                          placeholder="Header value"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">Headers</div>
                    <textarea
                      className="w-full h-28 px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-xs font-mono"
                      value={headersText}
                      onChange={(e) => setHeadersText(e.target.value)}
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">Payload</div>
                    <textarea
                      className="w-full h-28 px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-xs font-mono"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      disabled={!canSendBody}
                    />
                  </div>
                </div>
              </div>
            )}
            {formError && <div className="text-rose-300 text-xs">{formError}</div>}
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-sm font-semibold"
            >
              {creating ? 'Creating...' : 'Create monitor'}
            </button>
          </form>

          <div className="grid gap-3">
            {apis.map(api => (
              <div 
                key={api.id}
                onClick={() => fetchHistory(api)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex justify-between items-center group ${
                  selected?.id === api.id ? 'bg-violet-600/10 border-violet-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-2 h-2 rounded-full ${api.status === 'up' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
                  <div>
                    <span className="font-bold text-sm tracking-tight">{api.name}</span>
                    <div className="text-[9px] text-violet-300 font-mono mt-0.5">{api.method}</div>
                    <div className="text-[10px] text-white/30 font-mono mt-0.5">{api.url}</div>
                  </div>
                </div>
                <StatusPill status={api.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 h-[calc(100vh-3rem)] sticky top-6 flex flex-col shadow-2xl backdrop-blur-xl">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-8 text-center">Node Logs</h2>
          
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-4">
              <div className="text-6xl">⊘</div>
              <p className="text-[10px] uppercase font-bold tracking-widest">Select Node</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-6 p-5 bg-black/40 rounded-[1.5rem] border border-white/10">
                <h3 className="font-bold text-base mb-2 truncate">{selected.name}</h3>
                <StatusPill status={selected.status} />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <p className="text-center text-[10px] text-white/20 uppercase mt-10 tracking-widest">No Traffic Data</p>
                ) : (
                  history.map(h => (
                    <div key={h.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                      <StatusPill status={h.status} />
                      <span className="text-[9px] font-mono text-white/30 group-hover:text-white/60">
                        {new Date(h.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}